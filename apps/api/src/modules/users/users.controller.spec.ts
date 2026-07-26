import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { ALL_PERMISSIONS, type Permission } from "@kedland/types";

import { MailService } from "../mail/mail.service";
import { RolesService } from "../roles/roles.service";

import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

import type { UserDocument } from "./schemas/user.schema";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";

const ACTOR: AuthenticatedUser = {
  id: "507f1f77bcf86cd799439011",
  email: "head@kedland.edu.gh",
  roleSlug: "administrator",
  permissions: ALL_PERMISSIONS as Permission[],
};

function account(overrides: Record<string, unknown> = {}): UserDocument {
  return {
    id: "u2",
    email: "new@kedland.edu.gh",
    displayName: "Mary Owusu",
    roleSlug: "editor",
    permissions: ["posts:read", "posts:update"],
    status: "active",
    isInvited: false,
    lastLoginAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  } as unknown as UserDocument;
}

describe("UsersController", () => {
  let controller: UsersController;
  let users: {
    findAll: jest.Mock;
    findByIdOrFail: jest.Mock;
    create: jest.Mock;
    setPermissions: jest.Mock;
    assignRole: jest.Mock;
    setStatus: jest.Mock;
    remove: jest.Mock;
    createPasswordResetToken: jest.Mock;
  };
  let roles: { permissionsForSlug: jest.Mock };
  let mail: { isConfigured: jest.Mock; sendInvitation: jest.Mock };

  beforeEach(async () => {
    users = {
      findAll: jest.fn().mockResolvedValue([account()]),
      findByIdOrFail: jest.fn().mockResolvedValue(account()),
      create: jest.fn().mockResolvedValue(account()),
      setPermissions: jest.fn().mockResolvedValue(account()),
      assignRole: jest.fn().mockResolvedValue(account()),
      setStatus: jest.fn().mockResolvedValue(account({ status: "suspended" })),
      remove: jest.fn().mockResolvedValue(undefined),
      createPasswordResetToken: jest.fn().mockResolvedValue("raw-token"),
    };
    roles = { permissionsForSlug: jest.fn().mockResolvedValue(["posts:read", "posts:update"]) };
    mail = {
      isConfigured: jest.fn().mockReturnValue(true),
      sendInvitation: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: users },
        { provide: RolesService, useValue: roles },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    controller = moduleRef.get(UsersController);
  });

  const NEW_USER = {
    email: "new@kedland.edu.gh",
    displayName: "Mary Owusu",
    password: "a-long-enough-password",
    roleSlug: "editor",
  };

  describe("create", () => {
    it("takes the new account's permissions from the role", async () => {
      await controller.create(NEW_USER);

      expect(roles.permissionsForSlug).toHaveBeenCalledWith("editor");
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ roleSlug: "editor", permissions: ["posts:read", "posts:update"] }),
      );
    });

    it("never returns the password hash", async () => {
      const result = await controller.create(NEW_USER);

      expect(result).not.toHaveProperty("passwordHash");
      expect(JSON.stringify(result)).not.toContain("argon2");
    });

    it("rejects a short password", async () => {
      await expect(controller.create({ ...NEW_USER, password: "short" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(users.create).not.toHaveBeenCalled();
    });

    it("rejects an address that is not one", async () => {
      await expect(controller.create({ ...NEW_USER, email: "not-an-email" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    /** A typo'd key must not quietly create an account with default permissions. */
    it("rejects an unrecognised field", async () => {
      await expect(controller.create({ ...NEW_USER, permissions: ["users:delete"] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    /**
     * Permissions come from the role, never from the request. Otherwise anyone
     * who may create a user may grant themselves anything by creating one.
     */
    it("ignores permissions sent alongside a valid body", async () => {
      await expect(controller.create({ ...NEW_USER, permissions: ALL_PERMISSIONS })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("fails when the role does not exist", async () => {
      roles.permissionsForSlug.mockRejectedValue(new Error("No such role"));

      await expect(controller.create(NEW_USER)).rejects.toThrow("No such role");
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe("invite", () => {
    const INVITE = { email: "new@kedland.edu.gh", displayName: "Mary Owusu", roleSlug: "editor" };

    it("creates the account, then emails a link to set a password", async () => {
      await controller.invite(INVITE);

      expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ isInvited: true }));
      expect(users.createPasswordResetToken).toHaveBeenCalledWith("u2");
      expect(mail.sendInvitation).toHaveBeenCalledWith(
        expect.objectContaining({ to: "new@kedland.edu.gh", token: "raw-token" }),
      );
    });

    it("sets an unguessable password nobody is told", async () => {
      await controller.invite(INVITE);

      const [input] = users.create.mock.calls[0] as [{ password: string }];
      expect(input.password.length).toBeGreaterThanOrEqual(32);
    });

    /**
     * Refusing up front rather than creating an account whose invitation never
     * arrives — which would leave a real person unable to sign in and an
     * administrator believing they had been invited.
     */
    it("refuses when mail is not configured, without creating anything", async () => {
      mail.isConfigured.mockReturnValue(false);

      await expect(controller.invite(INVITE)).rejects.toBeInstanceOf(BadRequestException);
      expect(users.create).not.toHaveBeenCalled();
    });

    it("rejects a password sent to the invite route", async () => {
      // Inviting and creating are separate on purpose; a password here means the
      // caller is using the wrong endpoint.
      await expect(
        controller.invite({ ...INVITE, password: "a-long-enough-password" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("permissions", () => {
    it("passes the completed list through to the service", async () => {
      await controller.setPermissions("u2", { permissions: ["posts:delete"] });

      // The schema completes implied reads before the service ever sees them.
      expect(users.setPermissions).toHaveBeenCalledWith("u2", ["posts:delete", "posts:read"]);
    });

    it("rejects a permission that does not exist", async () => {
      await expect(
        controller.setPermissions("u2", { permissions: ["posts:approve"] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("accepts an empty list — an account with nothing granted", async () => {
      await expect(controller.setPermissions("u2", { permissions: [] })).resolves.toBeDefined();
    });

    it("re-adopts a role's permissions when moving an account onto it", async () => {
      roles.permissionsForSlug.mockResolvedValue(["media:read"]);

      await controller.assignRole("u2", { roleSlug: "organisation" });

      expect(users.assignRole).toHaveBeenCalledWith("u2", "organisation", ["media:read"]);
    });
  });

  describe("guarding the administrator against themselves", () => {
    it("refuses to suspend your own account", async () => {
      await expect(controller.setStatus(ACTOR.id, { status: "suspended" }, ACTOR)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(users.setStatus).not.toHaveBeenCalled();
    });

    it("allows suspending somebody else", async () => {
      await expect(controller.setStatus("u2", { status: "suspended" }, ACTOR)).resolves.toBeDefined();
    });

    /** Restoring yourself is harmless — and is how you undo a mistake. */
    it("allows restoring your own account", async () => {
      await expect(controller.setStatus(ACTOR.id, { status: "active" }, ACTOR)).resolves.toBeDefined();
    });

    it("refuses to delete your own account", async () => {
      await expect(controller.remove(ACTOR.id, ACTOR)).rejects.toBeInstanceOf(BadRequestException);
      expect(users.remove).not.toHaveBeenCalled();
    });

    it("allows deleting somebody else", async () => {
      await expect(controller.remove("u2", ACTOR)).resolves.toBeUndefined();
    });
  });

  describe("list", () => {
    it("reports both the role and the permissions actually held", async () => {
      // Both, because they can differ: editing one account's permissions
      // deliberately does not change its role.
      const [first] = await controller.list();

      expect(first).toMatchObject({ roleSlug: "editor", permissions: ["posts:read", "posts:update"] });
    });

    it("completes implied reads on the way out", async () => {
      users.findAll.mockResolvedValue([account({ permissions: ["posts:update"] })]);

      const [first] = await controller.list();
      expect(first?.permissions).toEqual(["posts:read", "posts:update"]);
    });
  });
});
