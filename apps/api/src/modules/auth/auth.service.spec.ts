import { UnauthorizedException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { AuditService } from "../audit/audit.service";
import { UsersService } from "../users/users.service";

import { AuthService } from "./auth.service";
import { RefreshToken } from "./schemas/refresh-token.schema";

/**
 * Unit tests for the parts of authentication that a database cannot show you.
 *
 * The integration suite proves the flow end to end against real MongoDB. These
 * assert the decisions inside it: that an unknown address still costs a
 * password verification, that a replayed token revokes its whole family, that
 * every failure reports the same thing.
 */
interface QueryChain {
  exec: jest.Mock;
}

function query<T>(result: T): QueryChain {
  return { exec: jest.fn().mockResolvedValue(result) };
}

/** The UsersService methods AuthService calls. Inferred, so the mocks keep
 *  their jest typing — `jest.Mocked<Partial<T>>` loses it on each method. */
function makeUsers() {
  return {
    findForAuthentication: jest.fn(),
    findById: jest.fn(),
    findByIdOrFail: jest.fn(),
    recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
    recordSuccessfulLogin: jest.fn().mockResolvedValue(undefined),
    setPassword: jest.fn().mockResolvedValue(undefined),
    createPasswordResetToken: jest.fn().mockResolvedValue("raw-reset-token"),
    findByResetToken: jest.fn(),
  };
}

function makeTokenModel() {
  return {
    create: jest.fn().mockResolvedValue({}),
    findOne: jest.fn().mockReturnValue(query(null)),
    updateOne: jest.fn().mockReturnValue(query({})),
    updateMany: jest.fn().mockReturnValue(query({})),
  };
}

const ACTIVE_USER = {
  id: "507f1f77bcf86cd799439011",
  email: "office@kedland.edu.gh",
  displayName: "Mary",
  roleSlug: "administrator",
  permissions: ["users:read", "users:update"],
  status: "active" as const,
  passwordHash: "$argon2id$hash",
  lockedUntil: null,
};

describe("AuthService", () => {
  let service: AuthService;
  let users: ReturnType<typeof makeUsers>;
  let audit: { record: jest.Mock };
  let tokens: ReturnType<typeof makeTokenModel>;
  let verifySpy: jest.SpyInstance;

  beforeEach(async () => {
    tokens = makeTokenModel();
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    users = makeUsers();

    const config = {
      getOrThrow: (key: string) => (key === "auth.accessTtl" ? "15m" : "a-secret-long-enough-for-tests"),
    } as unknown as ConfigService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: AuditService, useValue: audit },
        { provide: JwtService, useValue: new JwtService({}) },
        { provide: ConfigService, useValue: config },
        { provide: getModelToken(RefreshToken.name), useValue: tokens },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    verifySpy = jest.spyOn(UsersService, "verifyPassword").mockResolvedValue(true);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("login", () => {
    it("returns a pair and the account on success", async () => {
      users.findForAuthentication.mockResolvedValue(ACTIVE_USER);

      const result = await service.login("office@kedland.edu.gh", "correct-password");

      expect(result.user).toEqual({
        id: ACTIVE_USER.id,
        email: ACTIVE_USER.email,
        displayName: "Mary",
        roleSlug: "administrator",
        // Sent with the session so the dashboard can decide what to render
        // without a second round trip.
        permissions: ["users:read", "users:update"],
      });
      expect(typeof result.accessToken).toBe("string");
      expect(typeof result.refreshToken).toBe("string");
    });

    it("still verifies a password when the address is unknown", async () => {
      users.findForAuthentication.mockResolvedValue(null);

      await expect(service.login("nobody@kedland.edu.gh", "any")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      // Skipping the hash here would make a missing account measurably faster
      // to reject, which is a timing oracle for which addresses exist.
      expect(verifySpy).toHaveBeenCalled();
    });

    it("records a failed sign-in for an unknown address", async () => {
      users.findForAuthentication.mockResolvedValue(null);

      await expect(service.login("nobody@kedland.edu.gh", "any")).rejects.toThrow();
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "login-failed" }));
    });

    it("refuses a locked account without counting another failure", async () => {
      users.findForAuthentication.mockResolvedValue({
        ...ACTIVE_USER,
        lockedUntil: new Date(Date.now() + 60_000),
      });

      await expect(service.login(ACTIVE_USER.email, "correct-password")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      // The lock is already doing its job; incrementing would extend it forever.
      expect(users.recordFailedAttempt).not.toHaveBeenCalled();
    });

    it("counts a failure on a wrong password", async () => {
      users.findForAuthentication.mockResolvedValue(ACTIVE_USER);
      verifySpy.mockResolvedValue(false);

      await expect(service.login(ACTIVE_USER.email, "wrong")).rejects.toThrow();
      expect(users.recordFailedAttempt).toHaveBeenCalledWith(ACTIVE_USER.id);
    });

    it("refuses a suspended account even with the right password", async () => {
      users.findForAuthentication.mockResolvedValue({ ...ACTIVE_USER, status: "suspended" });

      await expect(service.login(ACTIVE_USER.email, "correct-password")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("gives every failure the same message", async () => {
      const messages: string[] = [];

      users.findForAuthentication.mockResolvedValue(null);
      await service.login("a@b.c", "x").catch((e: unknown) => messages.push((e as Error).message));

      users.findForAuthentication.mockResolvedValue(ACTIVE_USER);
      verifySpy.mockResolvedValue(false);
      await service.login("a@b.c", "x").catch((e: unknown) => messages.push((e as Error).message));

      users.findForAuthentication.mockResolvedValue({ ...ACTIVE_USER, status: "suspended" });
      verifySpy.mockResolvedValue(true);
      await service.login("a@b.c", "x").catch((e: unknown) => messages.push((e as Error).message));

      expect(new Set(messages).size).toBe(1);
    });

    it("stores only a hash of the refresh token", async () => {
      users.findForAuthentication.mockResolvedValue(ACTIVE_USER);

      const result = await service.login(ACTIVE_USER.email, "correct-password");
      const written = tokens.create.mock.calls[0]?.[0] as { tokenHash: string };

      expect(written.tokenHash).not.toBe(result.refreshToken);
      expect(written.tokenHash).toHaveLength(64);
    });

    it("hashes the caller's IP rather than storing it", async () => {
      users.findForAuthentication.mockResolvedValue(ACTIVE_USER);

      await service.login(ACTIVE_USER.email, "correct-password", { ip: "203.0.113.9" });
      const written = tokens.create.mock.calls[0]?.[0] as { ipHash: string };

      expect(written.ipHash).not.toContain("203.0.113.9");
    });
  });

  describe("refresh", () => {
    it("refuses an unknown token", async () => {
      tokens.findOne.mockReturnValue(query(null));
      await expect(service.refresh("nope")).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("revokes the whole family when a used token is replayed", async () => {
      tokens.findOne.mockReturnValue(
        query({
          _id: "1",
          userId: { toString: () => ACTIVE_USER.id },
          family: "fam-1",
          revokedAt: new Date(),
        }),
      );

      await expect(service.refresh("replayed")).rejects.toBeInstanceOf(UnauthorizedException);

      // The legitimate holder already rotated this one, so the copy being
      // replayed is a thief's. Both sessions must end.
      expect(tokens.updateMany).toHaveBeenCalledWith(
        { family: "fam-1", revokedAt: null },
        expect.objectContaining({ $set: expect.objectContaining({ revokedAt: expect.any(Date) }) }),
      );
    });

    it("refuses an expired token", async () => {
      tokens.findOne.mockReturnValue(
        query({
          _id: "1",
          userId: { toString: () => ACTIVE_USER.id },
          family: "f",
          revokedAt: null,
          expiresAt: new Date(Date.now() - 1),
        }),
      );

      await expect(service.refresh("stale")).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("refuses once the account has been suspended", async () => {
      tokens.findOne.mockReturnValue(
        query({
          _id: "1",
          userId: { toString: () => ACTIVE_USER.id },
          family: "f",
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
        }),
      );
      users.findById.mockResolvedValue({ ...ACTIVE_USER, status: "suspended" });

      // Suspending someone must end their access without waiting for the
      // access token to expire.
      await expect(service.refresh("valid")).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rotates: issues a new pair and revokes the old token", async () => {
      tokens.findOne.mockReturnValue(
        query({
          _id: "1",
          userId: { toString: () => ACTIVE_USER.id },
          family: "f",
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
        }),
      );
      users.findById.mockResolvedValue(ACTIVE_USER);

      const pair = await service.refresh("valid");

      expect(typeof pair.refreshToken).toBe("string");
      expect(tokens.updateOne).toHaveBeenCalledWith(
        { _id: "1" },
        expect.objectContaining({
          $set: expect.objectContaining({ revokedAt: expect.any(Date), replacedByHash: expect.any(String) }),
        }),
      );
    });

    it("keeps the new token in the same family", async () => {
      tokens.findOne.mockReturnValue(
        query({
          _id: "1",
          userId: { toString: () => ACTIVE_USER.id },
          family: "fam-7",
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
        }),
      );
      users.findById.mockResolvedValue(ACTIVE_USER);

      await service.refresh("valid");
      expect(tokens.create).toHaveBeenCalledWith(expect.objectContaining({ family: "fam-7" }));
    });
  });

  describe("logout", () => {
    it("revokes a known token", async () => {
      tokens.findOne.mockReturnValue(query({ _id: "1", userId: { toString: () => ACTIVE_USER.id } }));

      await service.logout("a-token");
      expect(tokens.updateOne).toHaveBeenCalled();
    });

    it("says nothing about a token it does not know", async () => {
      tokens.findOne.mockReturnValue(query(null));

      await expect(service.logout("unknown")).resolves.toBeUndefined();
      expect(tokens.updateOne).not.toHaveBeenCalled();
    });
  });

  describe("password reset", () => {
    it("returns nothing for an unknown address", async () => {
      users.findForAuthentication.mockResolvedValue(null);
      await expect(service.startPasswordReset("nobody@kedland.edu.gh")).resolves.toBeNull();
    });

    it("returns nothing for a suspended account", async () => {
      users.findForAuthentication.mockResolvedValue({ ...ACTIVE_USER, status: "suspended" });
      await expect(service.startPasswordReset(ACTIVE_USER.email)).resolves.toBeNull();
    });

    it("issues a token for a live account", async () => {
      users.findForAuthentication.mockResolvedValue(ACTIVE_USER);

      const issued = await service.startPasswordReset(ACTIVE_USER.email);
      expect(issued?.token).toBe("raw-reset-token");
    });

    it("refuses an invalid reset token", async () => {
      users.findByResetToken.mockResolvedValue(null);

      await expect(service.completePasswordReset("bad", "a-new-password")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("signs out every session when the password is reset", async () => {
      users.findByResetToken.mockResolvedValue(ACTIVE_USER);

      await service.completePasswordReset("good", "a-new-password");

      // A reset is what you do after a compromise; leaving the attacker's
      // session alive would defeat the point.
      expect(tokens.updateMany).toHaveBeenCalled();
      expect(users.setPassword).toHaveBeenCalledWith(ACTIVE_USER.id, "a-new-password");
    });
  });

  describe("changing your own password", () => {
    it("requires the current one", async () => {
      users.findByIdOrFail.mockResolvedValue(ACTIVE_USER);
      users.findForAuthentication.mockResolvedValue(ACTIVE_USER);
      verifySpy.mockResolvedValue(false);

      await expect(service.changePassword(ACTIVE_USER.id, "wrong", "a-new-password")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("changes it and ends other sessions", async () => {
      users.findByIdOrFail.mockResolvedValue(ACTIVE_USER);
      users.findForAuthentication.mockResolvedValue(ACTIVE_USER);

      await service.changePassword(ACTIVE_USER.id, "current", "a-new-password");

      expect(users.setPassword).toHaveBeenCalledWith(ACTIVE_USER.id, "a-new-password");
      expect(tokens.updateMany).toHaveBeenCalled();
    });
  });
});
