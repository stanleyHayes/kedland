import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { ALL_PERMISSIONS, RESOURCES } from "@kedland/types";

import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";

import type { RoleDocument } from "./schemas/role.schema";

function role(overrides: Record<string, unknown> = {}): RoleDocument {
  return {
    id: "r1",
    slug: "editor",
    name: "Editor",
    description: "Publishes news",
    permissions: ["posts:read", "posts:update"],
    isSystem: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  } as unknown as RoleDocument;
}

describe("RolesController", () => {
  let controller: RolesController;
  let roles: { findAll: jest.Mock; create: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    roles = {
      findAll: jest.fn().mockResolvedValue([role()]),
      create: jest.fn().mockResolvedValue(role({ isSystem: false })),
      update: jest.fn().mockResolvedValue(role()),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: roles }],
    }).compile();

    controller = moduleRef.get(RolesController);
  });

  describe("catalogue", () => {
    /**
     * The dashboard's permission editor is built from this, so that adding a
     * resource to the API makes it appear there without anyone remembering to
     * update a second list by hand.
     */
    it("offers every permission the system can express", () => {
      expect(controller.catalogue().permissions).toEqual(ALL_PERMISSIONS);
    });

    it("labels every resource, so nothing renders as a raw slug", () => {
      const { resourceLabels } = controller.catalogue();

      for (const resource of RESOURCES) {
        expect(resourceLabels[resource]).toBeTruthy();
      }
    });

    it("labels all four actions", () => {
      expect(Object.keys(controller.catalogue().actionLabels)).toEqual([
        "read",
        "create",
        "update",
        "delete",
      ]);
    });
  });

  describe("list", () => {
    it("returns roles as plain objects with ISO timestamps", async () => {
      const [first] = await controller.list();

      expect(first).toMatchObject({ id: "r1", slug: "editor", isSystem: true });
      expect(first?.createdAt).toBe("2026-01-01T00:00:00.000Z");
    });

    /** The dashboard needs it to know which roles it must not offer to delete. */
    it("reports whether a role is built in", async () => {
      const [first] = await controller.list();
      expect(first?.isSystem).toBe(true);
    });
  });

  describe("create", () => {
    it("passes a valid role through", async () => {
      await controller.create({ name: "Front Office", permissions: ["enquiries:update"] });

      expect(roles.create).toHaveBeenCalledWith(
        // Implied reads are completed by the schema before the service sees them.
        expect.objectContaining({
          name: "Front Office",
          permissions: ["enquiries:read", "enquiries:update"],
        }),
      );
    });

    it("rejects a nameless role", async () => {
      await expect(controller.create({ permissions: [] })).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects a permission that does not exist", async () => {
      await expect(controller.create({ name: "Odd", permissions: ["posts:approve"] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    /** `isSystem` is the API's to decide; a request must not be able to claim it. */
    it("rejects an attempt to declare a role built in", async () => {
      await expect(
        controller.create({ name: "Impostor", permissions: [], isSystem: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("update", () => {
    it("forwards only the fields that were sent", async () => {
      await controller.update("r1", { permissions: ["media:read"] });

      expect(roles.update).toHaveBeenCalledWith("r1", { permissions: ["media:read"] });
    });

    it("accepts a rename on its own", async () => {
      await controller.update("r1", { name: "Front Office" });

      expect(roles.update).toHaveBeenCalledWith("r1", { name: "Front Office" });
    });

    it("rejects an unrecognised field", async () => {
      await expect(controller.update("r1", { slug: "hand-picked" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("remove", () => {
    it("deletes by id", async () => {
      await controller.remove("r1");
      expect(roles.remove).toHaveBeenCalledWith("r1");
    });
  });
});
