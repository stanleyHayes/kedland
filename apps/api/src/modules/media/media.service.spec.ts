import { createHash } from "node:crypto";

import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { Types } from "mongoose";

import { AuditService } from "../audit/audit.service";
import { RevalidateService } from "../revalidate/revalidate.service";

import { MediaService } from "./media.service";
import { Media } from "./schemas/media.schema";

const CONFIG: Record<string, string> = {
  "media.cloudName": "kedland",
  "media.apiKey": "123456789",
  "media.apiSecret": "a-secret-that-never-leaves-the-server",
  "media.folder": "kedland",
};

const ACTOR = new Types.ObjectId().toHexString();

interface Chain {
  exec: jest.Mock;
  sort: jest.Mock;
}

function query<T>(result: T): Chain {
  const chain = { exec: jest.fn().mockResolvedValue(result), sort: jest.fn() };
  chain.sort.mockReturnValue(chain);
  return chain;
}

function storedMedia(overrides: Record<string, unknown> = {}) {
  return {
    id: "media-1",
    publicId: "kedland/posts/abc",
    url: "https://res.cloudinary.com/kedland/image/upload/v1/abc.jpg",
    alt: "Children racing",
    width: 1600,
    height: 1200,
    format: "jpg",
    bytes: 240_000,
    uploadedById: null as Types.ObjectId | null,
    createdAt: new Date("2026-03-01T09:00:00Z"),
    save: jest.fn().mockResolvedValue(undefined),
    deleteOne: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("MediaService", () => {
  let service: MediaService;
  let model: { create: jest.Mock; find: jest.Mock; findOne: jest.Mock; findById: jest.Mock };
  let config: { get: jest.Mock };
  let audit: { record: jest.Mock };
  let revalidate: { gallery: jest.Mock };

  beforeEach(async () => {
    model = {
      create: jest.fn((doc: Record<string, unknown>) => Promise.resolve(storedMedia(doc))),
      find: jest.fn().mockReturnValue(query([])),
      findOne: jest.fn().mockReturnValue(query(null)),
      findById: jest.fn().mockReturnValue(query(null)),
    };
    config = { get: jest.fn((key: string) => CONFIG[key]) };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    revalidate = { gallery: jest.fn().mockResolvedValue(true) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getModelToken(Media.name), useValue: model },
        { provide: ConfigService, useValue: config },
        { provide: AuditService, useValue: audit },
        { provide: RevalidateService, useValue: revalidate },
      ],
    }).compile();

    service = moduleRef.get(MediaService);
  });

  describe("signUpload", () => {
    it("points the browser at the school's own cloud", () => {
      expect(service.signUpload({}).uploadUrl).toBe("https://api.cloudinary.com/v1_1/kedland/image/upload");
    });

    /**
     * The signature is Cloudinary's scheme: parameters sorted by key, joined as
     * a query string, secret appended, SHA-1. Computed independently here — a
     * test that called the same private method would only prove it is
     * self-consistent.
     */
    it("signs exactly the parameters Cloudinary will hash back", () => {
      const signed = service.signUpload({});
      // eslint-disable-next-line sonarjs/hashing -- mirrors Cloudinary's mandated SHA-1 scheme; see media.service.ts
      const expected = createHash("sha1")
        .update(
          `folder=${signed.folder}&timestamp=${String(signed.timestamp)}${CONFIG["media.apiSecret"] ?? ""}`,
        )
        .digest("hex");

      expect(signed.signature).toBe(expected);
    });

    it("never hands the API secret to the browser", () => {
      // The whole reason for signing server-side. The api *key* is public; the
      // secret is not.
      const signed = service.signUpload({});

      expect(JSON.stringify(signed)).not.toContain(CONFIG["media.apiSecret"]);
      expect(signed.apiKey).toBe(CONFIG["media.apiKey"]);
    });

    it("expires the signature in minutes, not hours", () => {
      expect(service.signUpload({}).expiresInSeconds).toBeLessThanOrEqual(600);
    });

    /**
     * The folder is the only thing the browser chooses, and it is always
     * *inside* the school's root. In a shared Cloudinary account, a signature
     * that could write anywhere is a signature that can overwrite anyone.
     */
    it("nests the requested folder inside the school's root", () => {
      expect(service.signUpload({ folder: "posts/sports-day" }).folder).toBe("kedland/posts/sports-day");
    });

    it("uses the root itself when no folder is asked for", () => {
      expect(service.signUpload({}).folder).toBe("kedland");
    });

    it("falls back to a sane root when none is configured", () => {
      config.get.mockImplementation((key: string) => (key === "media.folder" ? undefined : CONFIG[key]));

      expect(service.signUpload({}).folder).toBe("kedland");
    });

    it.each(["media.cloudName", "media.apiKey", "media.apiSecret"])(
      "says plainly that uploads are not configured when %s is missing",
      (missing) => {
        config.get.mockImplementation((key: string) => (key === missing ? undefined : CONFIG[key]));

        // Better than failing halfway through an upload the editor has already
        // waited for.
        expect(() => service.signUpload({})).toThrow(BadRequestException);
      },
    );
  });

  describe("register", () => {
    it("records the upload and who made it", async () => {
      const item = await service.register(
        {
          publicId: "kedland/posts/abc",
          url: "https://res.cloudinary.com/kedland/image/upload/v1/abc.jpg",
          alt: "Children racing",
          width: 1600,
          height: 1200,
          format: "jpg",
          bytes: 240_000,
        },
        ACTOR,
      );

      expect(item.publicId).toBe("kedland/posts/abc");
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "create", entityType: "media" }),
      );
    });

    /**
     * Cloudinary returns an existing public id when the same file is uploaded
     * twice. Creating a second row would hit the unique index and surface as a
     * 500 for something that is not an error.
     */
    it("updates rather than duplicating when the same file arrives twice", async () => {
      const existing = storedMedia();
      model.findOne.mockReturnValue(query(existing));

      const item = await service.register(
        {
          publicId: "kedland/posts/abc",
          url: existing.url,
          alt: "A better description",
          width: 1600,
          height: 1200,
          format: "jpg",
          bytes: 240_000,
        },
        ACTOR,
      );

      expect(model.create).not.toHaveBeenCalled();
      expect(existing.save).toHaveBeenCalled();
      expect(item.alt).toBe("A better description");
    });
  });

  describe("correcting alt text", () => {
    it("corrects the alt text and records it", async () => {
      const item = storedMedia();
      model.findById.mockReturnValue(query(item));

      await service.describe("507f1f77bcf86cd799439011", "A clearer description", ACTOR);

      expect(item.alt).toBe("A clearer description");
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "update" }));
    });

    it("reports an unknown id as not found", async () => {
      await expect(service.describe("not-an-id", "anything", ACTOR)).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    /**
     * Only the record goes. Deleting the asset from under a page that still
     * references it would swap a photograph for a broken image; Cloudinary's own
     * console is where storage gets cleared deliberately.
     */
    it("forgets the record without touching Cloudinary", async () => {
      const item = storedMedia();
      model.findById.mockReturnValue(query(item));

      await service.remove("507f1f77bcf86cd799439011", ACTOR);

      expect(item.deleteOne).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "delete" }));
    });
  });

  describe("list", () => {
    it("returns the library newest first", async () => {
      const chain = query([storedMedia()]);
      model.find.mockReturnValue(chain);

      const items = await service.list();

      expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(items[0]?.alt).toBe("Children racing");
    });
  });

  describe("findOne", () => {
    it("returns the full dashboard shape for a known id", async () => {
      model.findById.mockReturnValue(query(storedMedia()));

      const item = await service.findOne("507f1f77bcf86cd799439011");

      expect(item).toMatchObject({ id: "media-1", publicId: "kedland/posts/abc", alt: "Children racing" });
    });

    it("reports an unknown id as not found", async () => {
      await expect(service.findOne("507f1f77bcf86cd799439011")).rejects.toThrow(NotFoundException);
    });

    it("rejects a malformed id without asking the database", async () => {
      await expect(service.findOne("not-an-id")).rejects.toThrow(NotFoundException);
      expect(model.findById).not.toHaveBeenCalled();
    });
  });

  describe("public media resolution", () => {
    it("returns only the renderable public shape", async () => {
      model.findOne.mockReturnValue(
        query(storedMedia({ depictsPupils: false, consentOnFile: false, consentRef: null })),
      );

      const item = await service.publicByReference("kedland/posts/abc");

      expect(item).toEqual({
        id: "media-1",
        url: "https://res.cloudinary.com/kedland/image/upload/v1/abc.jpg",
        alt: "Children racing",
        width: 1600,
        height: 1200,
      });
      expect(item).not.toHaveProperty("consentRef");
      expect(item).not.toHaveProperty("uploadedBy");
    });

    it("keeps a pupil image private until written consent has a reference", async () => {
      model.findOne.mockReturnValue(
        query(storedMedia({ depictsPupils: true, consentOnFile: true, consentRef: null })),
      );

      await expect(service.publicByReference("kedland/posts/abc")).rejects.toThrow(NotFoundException);
    });

    it("releases a pupil image after the full consent gate is satisfied", async () => {
      model.findOne.mockReturnValue(
        query(
          storedMedia({
            depictsPupils: true,
            consentOnFile: true,
            consentRef: "CONSENT-2026-014",
          }),
        ),
      );

      await expect(service.publicByReference("kedland/posts/abc")).resolves.toMatchObject({
        id: "media-1",
      });
    });
  });
});
