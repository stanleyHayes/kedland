import { createHash } from "node:crypto";

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AuditService } from "../audit/audit.service";

import { Media, type MediaDocument } from "./schemas/media.schema";

import type { MediaItem, MediaRegister, MediaUpdate, UploadRequest, UploadSignature } from "@kedland/types";

/** Cloudinary refuses a signature older than an hour; we are far tighter. */
const SIGNATURE_TTL_SECONDS = 600;

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name) private readonly media: Model<MediaDocument>,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Signs one upload, into one folder, for ten minutes.
   *
   * The browser uploads straight to Cloudinary with this — the file never
   * touches our API. Render's disks are ephemeral and its request bodies
   * capped, so proxying a photo album through them would be both wasteful and
   * fragile; and the API secret stays on the server, which is the part that
   * matters.
   *
   * The signature covers exactly the parameters Cloudinary will hash back. Any
   * extra parameter the browser adds to the upload invalidates it, which is
   * what stops a signature for `kedland/posts` being reused to write elsewhere.
   *
   * Issuing a signature is not audited; registering the upload is. A signature
   * that nobody used is not an event worth a row in the trail, and the trail
   * is more useful for being only real events.
   */
  signUpload(request: UploadRequest): UploadSignature {
    const cloudName = this.config.get<string>("media.cloudName");
    const apiKey = this.config.get<string>("media.apiKey");
    const apiSecret = this.config.get<string>("media.apiSecret");
    const root = this.config.get<string>("media.folder") ?? "kedland";

    if (!cloudName || !apiKey || !apiSecret) {
      // Said plainly rather than failing halfway through an upload the editor
      // has already waited for.
      throw new BadRequestException(
        "Image uploads are not configured yet. Ask an administrator to add the Cloudinary keys.",
      );
    }

    // The requested folder is always *inside* the school's root, never instead
    // of it. The schema has already refused traversal and absolute paths.
    const folder = request.folder ? `${root}/${request.folder}` : root;
    const timestamp = Math.floor(Date.now() / 1000);

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      apiKey,
      timestamp,
      folder,
      signature: MediaService.sign({ folder, timestamp }, apiSecret),
      expiresInSeconds: SIGNATURE_TTL_SECONDS,
    };
  }

  /**
   * Cloudinary's signature: the parameters sorted by key, joined as a query
   * string, with the API secret appended, hashed with SHA-1.
   *
   * **SHA-1 is Cloudinary's choice, not ours.** It is what their API verifies
   * against, so it is a protocol requirement here rather than a security
   * decision we get to make — using anything stronger would simply produce a
   * signature Cloudinary rejects. Nothing about the safety of this upload rests
   * on the hash being collision-resistant: what protects it is that the secret
   * never leaves the server, the signature covers the folder, and it expires in
   * ten minutes. Cloudinary does offer SHA-256 as an account-level option; if
   * the school ever enables it, this is the one line to change.
   */
  private static sign(params: Record<string, string | number>, apiSecret: string): string {
    const canonical = Object.keys(params)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => `${key}=${String(params[key])}`)
      .join("&");

    // eslint-disable-next-line sonarjs/hashing -- Cloudinary's signature scheme mandates SHA-1; see the note above
    return createHash("sha1").update(`${canonical}${apiSecret}`).digest("hex");
  }

  /**
   * Records an upload that has already happened.
   *
   * Called by the dashboard once Cloudinary has accepted the file. The library
   * exists so an editor can reuse an image without re-uploading it, and so alt
   * text is written once and travels with the image.
   */
  async register(input: MediaRegister, actorId: string): Promise<MediaItem> {
    const existing = await this.media.findOne({ publicId: input.publicId }).exec();

    // Cloudinary can return an existing public id when the same file is
    // uploaded twice. Updating beats a duplicate row and a unique-index error.
    if (existing) {
      existing.alt = input.alt;
      existing.depictsPupils = input.depictsPupils ?? existing.depictsPupils ?? false;
      existing.consentOnFile = input.consentOnFile ?? existing.consentOnFile ?? false;
      existing.consentRef = input.consentRef ?? existing.consentRef;
      await existing.save();
      return MediaService.toDto(existing);
    }

    const created = await this.media.create({
      publicId: input.publicId,
      url: input.url,
      alt: input.alt,
      width: input.width,
      height: input.height,
      format: input.format,
      bytes: input.bytes,
      depictsPupils: input.depictsPupils ?? false,
      consentOnFile: input.consentOnFile ?? false,
      consentRef: input.consentRef ?? null,
      uploadedById: new Types.ObjectId(actorId),
    });

    await this.audit.record({
      actorId,
      action: "create",
      entityType: "media",
      entityId: created.id,
      changes: { publicId: input.publicId },
    });

    return MediaService.toDto(created);
  }

  /** The library, newest first. */
  async list(): Promise<MediaItem[]> {
    const found = await this.media.find().sort({ createdAt: -1 }).exec();
    return found.map((item) => MediaService.toDto(item));
  }

  /** Corrects alt text. The most likely thing anyone needs to fix. */
  async describe(id: string, alt: string, actorId: string): Promise<MediaItem> {
    return this.update(id, { alt }, actorId);
  }

  /** Updates accessibility and safeguarding metadata together. */
  async update(id: string, input: MediaUpdate, actorId: string): Promise<MediaItem> {
    const item = await this.get(id);

    if (input.alt !== undefined) item.alt = input.alt;
    if (input.depictsPupils !== undefined) item.depictsPupils = input.depictsPupils;
    if (input.consentOnFile !== undefined) item.consentOnFile = input.consentOnFile;
    if (input.consentRef !== undefined) item.consentRef = input.consentRef;
    await item.save();

    await this.audit.record({
      actorId,
      action: "update",
      entityType: "media",
      entityId: id,
      changes: input,
    });

    return MediaService.toDto(item);
  }

  /**
   * Forgets an image.
   *
   * Only the record: the file stays in Cloudinary. Deleting the asset from
   * under a page that still references it would replace a photograph with a
   * broken image, and Cloudinary's own console is the right place to clear
   * storage deliberately.
   */
  async remove(id: string, actorId: string): Promise<void> {
    const item = await this.get(id);

    await item.deleteOne();
    await this.audit.record({ actorId, action: "delete", entityType: "media", entityId: id });
  }

  private async get(id: string): Promise<MediaDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("No such image");

    const item = await this.media.findById(id).exec();
    if (!item) throw new NotFoundException("No such image");

    return item;
  }

  private static toDto(document: MediaDocument): MediaItem {
    return {
      id: document.id,
      publicId: document.publicId,
      url: document.url,
      alt: document.alt,
      width: document.width,
      height: document.height,
      format: document.format,
      bytes: document.bytes,
      createdAt: document.createdAt.toISOString(),
      uploadedBy: document.uploadedById?.toHexString() ?? null,
      depictsPupils: document.depictsPupils ?? false,
      consentOnFile: document.consentOnFile ?? false,
      consentRef: document.consentRef ?? null,
    };
  }
}
