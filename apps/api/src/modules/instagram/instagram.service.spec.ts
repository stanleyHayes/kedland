import { NotFoundException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { AuditService } from "../audit/audit.service";
import { MediaService } from "../media/media.service";
import { RevalidateService } from "../revalidate/revalidate.service";

import { InstagramService } from "./instagram.service";
import { InstagramTile } from "./schemas/instagram-tile.schema";

interface Chain {
  exec: jest.Mock;
}

function query<T>(result: T): Chain {
  return { exec: jest.fn().mockResolvedValue(result) };
}

function storedTile(overrides: Record<string, unknown> = {}) {
  return {
    id: "tile-1",
    mediaId: "media-1",
    caption: "Sports day sprints",
    href: "https://www.instagram.com/kedland",
    order: 1,
    published: true,
    createdAt: new Date("2026-03-01T09:00:00Z"),
    updatedAt: new Date("2026-03-02T09:00:00Z"),
    ...overrides,
  };
}

describe("InstagramService", () => {
  let service: InstagramService;
  let model: { findById: jest.Mock };

  beforeEach(async () => {
    model = { findById: jest.fn().mockReturnValue(query(null)) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InstagramService,
        { provide: getModelToken(InstagramTile.name), useValue: model },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: RevalidateService, useValue: { gallery: jest.fn() } },
        { provide: MediaService, useValue: { publicByReference: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(InstagramService);
  });

  describe("findOne", () => {
    it("returns the dashboard shape for a known id", async () => {
      model.findById.mockReturnValue(query(storedTile()));

      const item = await service.findOne("507f1f77bcf86cd799439011");

      expect(item).toMatchObject({
        id: "tile-1",
        mediaId: "media-1",
        caption: "Sports day sprints",
        updatedAt: "2026-03-02T09:00:00.000Z",
      });
    });

    it("reports an unknown id as not found", async () => {
      await expect(service.findOne("507f1f77bcf86cd799439011")).rejects.toThrow(NotFoundException);
    });

    it("rejects a malformed id without asking the database", async () => {
      await expect(service.findOne("not-an-id")).rejects.toThrow(NotFoundException);
      expect(model.findById).not.toHaveBeenCalled();
    });
  });
});
