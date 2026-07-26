import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AuditService } from "../audit/audit.service";
import { MediaService } from "../media/media.service";
import { RevalidateService } from "../revalidate/revalidate.service";

import { InstagramTile, type InstagramTileDocument } from "./schemas/instagram-tile.schema";

import type {
  InstagramTile as InstagramTileDto,
  InstagramTileInput,
  InstagramTileUpdate,
  PublicGalleryTile,
} from "@kedland/types";

@Injectable()
export class InstagramService {
  constructor(
    @InjectModel(InstagramTile.name) private readonly tiles: Model<InstagramTileDocument>,
    private readonly audit: AuditService,
    private readonly revalidate: RevalidateService,
    private readonly media: MediaService,
  ) {}

  async list(includeDrafts = true): Promise<InstagramTileDto[]> {
    const tiles = await this.tiles
      .find(includeDrafts ? {} : { published: true })
      .sort({ order: 1, createdAt: 1 })
      .exec();
    return tiles.map(toDto);
  }

  async listPublic(): Promise<PublicGalleryTile[]> {
    const tiles = await this.list(false);
    const resolved = await Promise.all(
      tiles.map(async (tile) => {
        try {
          const media = await this.media.publicByReference(tile.mediaId);
          return { id: tile.id, caption: tile.caption, href: tile.href, order: tile.order, media };
        } catch {
          return null;
        }
      }),
    );

    return resolved.filter((tile): tile is PublicGalleryTile => tile !== null);
  }

  /** Seed-only upsert for the bundled, editable starter mosaic. */
  async ensureStarter(input: InstagramTileInput): Promise<void> {
    await this.tiles
      .updateOne(
        { mediaId: input.mediaId, caption: input.caption },
        { $setOnInsert: { ...input, updatedById: null } },
        { upsert: true },
      )
      .exec();
  }

  async create(input: InstagramTileInput, actorId: string): Promise<InstagramTileDto> {
    const tile = await this.tiles.create({ ...input, updatedById: new Types.ObjectId(actorId) });
    await this.recordAndRefresh(actorId, "create", tile.id, { href: input.href });
    return toDto(tile);
  }

  async update(id: string, input: InstagramTileUpdate, actorId: string): Promise<InstagramTileDto> {
    const tile = await this.get(id);
    Object.assign(tile, input, { updatedById: new Types.ObjectId(actorId) });
    await tile.save();
    await this.recordAndRefresh(actorId, "update", id, input);
    return toDto(tile);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const tile = await this.get(id);
    await tile.deleteOne();
    await this.recordAndRefresh(actorId, "delete", id);
  }

  private async get(id: string): Promise<InstagramTileDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("No such Instagram tile");
    const tile = await this.tiles.findById(id).exec();
    if (!tile) throw new NotFoundException("No such Instagram tile");
    return tile;
  }

  private async recordAndRefresh(
    actorId: string,
    action: "create" | "update" | "delete",
    entityId: string,
    changes?: Record<string, unknown>,
  ): Promise<void> {
    await this.audit.record({
      actorId,
      action,
      entityType: "instagram-tile",
      entityId,
      ...(changes === undefined ? {} : { changes }),
    });
    await this.revalidate.gallery();
  }
}

function toDto(tile: InstagramTileDocument): InstagramTileDto {
  return {
    id: tile.id,
    mediaId: tile.mediaId,
    caption: tile.caption,
    href: tile.href,
    order: tile.order,
    published: tile.published,
    createdAt: tile.createdAt.toISOString(),
    updatedAt: tile.updatedAt.toISOString(),
  };
}
