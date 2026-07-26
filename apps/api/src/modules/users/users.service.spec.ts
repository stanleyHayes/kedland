import { ConflictException, NotFoundException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { User } from "./schemas/user.schema";
import { LOCK_DURATION_MS, MAX_FAILED_ATTEMPTS, UsersService } from "./users.service";

/**
 * A chainable stub standing in for a Mongoose query.
 *
 * Typed as an interface rather than `Record<string, jest.Mock>`: an index
 * signature would force bracket access under `noPropertyAccessFromIndexSignature`,
 * and the self-reference in `jest.fn(() => chain)` needs a declared type to
 * break the inference cycle.
 */
interface QueryChain {
  sort: jest.Mock;
  limit: jest.Mock;
  select: jest.Mock;
  exec: jest.Mock;
}

function query<T>(result: T): QueryChain {
  const chain: QueryChain = {
    sort: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    select: jest.fn(() => chain),
    exec: jest.fn().mockResolvedValue(result),
  };
  return chain;
}

/** Inferred rather than `Record<string, jest.Mock>`, so property access on the
 *  mock stays type-safe under `noPropertyAccessFromIndexSignature`. */
function makeModel() {
  return {
    create: jest.fn().mockResolvedValue({ id: "1" }),
    exists: jest.fn().mockResolvedValue(null),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn().mockReturnValue(query({})),
    deleteOne: jest.fn().mockReturnValue(query({})),
    countDocuments: jest.fn().mockReturnValue(query(2)),
  };
}

describe("password handling", () => {
  it("produces an argon2id hash", async () => {
    const hash = await UsersService.hashPassword("correct-horse-battery-staple");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("salts, so the same password hashes differently every time", async () => {
    const [a, b] = await Promise.all([
      UsersService.hashPassword("same-password-twice"),
      UsersService.hashPassword("same-password-twice"),
    ]);
    expect(a).not.toBe(b);
  });

  it("verifies the right password", async () => {
    const hash = await UsersService.hashPassword("correct-horse-battery-staple");
    await expect(UsersService.verifyPassword(hash, "correct-horse-battery-staple")).resolves.toBe(true);
  });

  it("rejects the wrong one", async () => {
    const hash = await UsersService.hashPassword("correct-horse-battery-staple");
    await expect(UsersService.verifyPassword(hash, "something-else-entirely")).resolves.toBe(false);
  });

  it("treats a corrupt stored hash as a failed verification, not a crash", async () => {
    // A 500 here would tell a caller that this account's record is unusual.
    await expect(UsersService.verifyPassword("not-a-hash", "anything")).resolves.toBe(false);
  });

  it("hashes reset tokens deterministically, so a lookup can find them", () => {
    expect(UsersService.hashToken("abc")).toBe(UsersService.hashToken("abc"));
    expect(UsersService.hashToken("abc")).not.toBe(UsersService.hashToken("abd"));
  });
});

describe("isLocked", () => {
  it("is false when no lock is set", () => {
    expect(UsersService.isLocked({ lockedUntil: null })).toBe(false);
  });

  it("is true while the lock is in the future", () => {
    expect(UsersService.isLocked({ lockedUntil: new Date(Date.now() + 60_000) })).toBe(true);
  });

  it("is false once the lock has passed", () => {
    // A lock that never lifts would be a denial-of-service handed to anyone
    // who knows a staff email address.
    expect(UsersService.isLocked({ lockedUntil: new Date(Date.now() - 1) })).toBe(false);
  });
});

describe("UsersService", () => {
  let service: UsersService;
  let model: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    model = makeModel();

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: getModelToken(User.name), useValue: model }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe("create", () => {
    it("normalises the email", async () => {
      await service.create({
        email: "  Office@Kedland.EDU.gh ",
        password: "x".repeat(12),
        displayName: "Mary",
      });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ email: "office@kedland.edu.gh" }));
    });

    it("stores a hash, never the password", async () => {
      await service.create({ email: "a@b.c", password: "plaintext-password", displayName: "Mary" });

      const written = model.create.mock.calls[0]?.[0] as { passwordHash: string };
      expect(written.passwordHash).not.toContain("plaintext-password");
      expect(written.passwordHash.startsWith("$argon2id$")).toBe(true);
    });

    it("defaults a new account to the editor role, not administrator", async () => {
      await service.create({ email: "a@b.c", password: "x".repeat(12), displayName: "Mary" });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ roleSlug: "editor" }));
    });

    it("refuses a duplicate address", async () => {
      model.exists.mockResolvedValue({ _id: "existing" });

      await expect(
        service.create({ email: "a@b.c", password: "x".repeat(12), displayName: "Mary" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("lockout", () => {
    it("counts a failure without locking below the threshold", async () => {
      model.findById.mockReturnValue(query({ failedAttempts: 2, lockedUntil: null }));

      await service.recordFailedAttempt("1");

      const update = model.updateOne.mock.calls[0]?.[1] as {
        $set: { failedAttempts: number; lockedUntil: Date | null };
      };
      expect(update.$set.failedAttempts).toBe(3);
      expect(update.$set.lockedUntil).toBeNull();
    });

    it("locks once the threshold is reached", async () => {
      model.findById.mockReturnValue(query({ failedAttempts: MAX_FAILED_ATTEMPTS - 1, lockedUntil: null }));

      await service.recordFailedAttempt("1");

      const update = model.updateOne.mock.calls[0]?.[1] as { $set: { lockedUntil: Date } };
      expect(update.$set.lockedUntil.getTime()).toBeGreaterThan(Date.now());
      expect(update.$set.lockedUntil.getTime()).toBeLessThanOrEqual(Date.now() + LOCK_DURATION_MS);
    });

    it("does nothing for an account that no longer exists", async () => {
      model.findById.mockReturnValue(query(null));

      await service.recordFailedAttempt("gone");
      expect(model.updateOne).not.toHaveBeenCalled();
    });

    it("clears the counter and the lock on a successful sign-in", async () => {
      await service.recordSuccessfulLogin("1");

      const update = model.updateOne.mock.calls[0]?.[1] as {
        $set: { failedAttempts: number; lockedUntil: null };
      };
      expect(update.$set.failedAttempts).toBe(0);
      expect(update.$set.lockedUntil).toBeNull();
    });
  });

  describe("password reset tokens", () => {
    it("stores only the hash and returns the raw token", async () => {
      const token = await service.createPasswordResetToken("1");

      const update = model.updateOne.mock.calls[0]?.[1] as {
        $set: { passwordResetTokenHash: string };
      };
      // A database read must not be turnable into an account takeover.
      expect(update.$set.passwordResetTokenHash).toBe(UsersService.hashToken(token));
      expect(update.$set.passwordResetTokenHash).not.toBe(token);
    });

    it("looks a token up by its hash and only while unexpired", async () => {
      model.findOne.mockReturnValue(query(null));

      await service.findByResetToken("raw-token");

      const filter = model.findOne.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(filter["passwordResetTokenHash"]).toBe(UsersService.hashToken("raw-token"));
      expect(filter["passwordResetExpiresAt"]).toHaveProperty("$gt");
    });

    it("clears the token when the password is set", async () => {
      await service.setPassword("1", "a-brand-new-password");

      const update = model.updateOne.mock.calls[0]?.[1] as {
        $set: { passwordResetTokenHash: null; failedAttempts: number };
      };
      expect(update.$set.passwordResetTokenHash).toBeNull();
      expect(update.$set.failedAttempts).toBe(0);
    });
  });

  describe("lookups", () => {
    it("asks for the hash only on the authentication path", async () => {
      const chain = query(null);
      model.findOne.mockReturnValue(chain);

      await service.findForAuthentication("a@b.c");
      expect(chain.select).toHaveBeenCalledWith("+passwordHash");
    });

    it("reports a missing account rather than returning undefined", async () => {
      model.findById.mockReturnValue(query(null));
      await expect(service.findByIdOrFail("nope")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("lists accounts oldest first", async () => {
      const chain = query([]);
      model.find.mockReturnValue(chain);

      await service.findAll();
      expect(chain.sort).toHaveBeenCalledWith({ createdAt: 1 });
    });
  });

  /**
   * The protected invariant is "somebody can still manage staff accounts", and
   * it is counted by permission rather than by role name. A school that renames
   * "Administrator" to "Head Teacher" must not thereby lose the protection.
   */
  describe("removal", () => {
    it("removes an account that cannot manage users", async () => {
      model.findById.mockReturnValue(query({ id: "1", permissions: ["posts:read"] }));

      await service.remove("1");
      expect(model.deleteOne).toHaveBeenCalledWith({ _id: "1" });
    });

    it("removes an account manager while another remains", async () => {
      model.findById.mockReturnValue(query({ id: "1", permissions: ["users:update"], displayName: "Ama" }));
      model.countDocuments.mockReturnValue(query(1));

      await service.remove("1");
      expect(model.deleteOne).toHaveBeenCalled();
    });

    it("refuses to remove the only person who can manage accounts", async () => {
      model.findById.mockReturnValue(query({ id: "1", permissions: ["users:update"], displayName: "Ama" }));
      model.countDocuments.mockReturnValue(query(0));

      // Locking everyone out of user management is not a state the school can
      // recover from without a developer and a database console.
      await expect(service.remove("1")).rejects.toBeInstanceOf(ConflictException);
      expect(model.deleteOne).not.toHaveBeenCalled();
    });

    /** The count must exclude the account being removed, or it never trips. */
    it("does not count the account being removed as the remaining manager", async () => {
      model.findById.mockReturnValue(query({ id: "1", permissions: ["users:update"], displayName: "Ama" }));
      model.countDocuments.mockReturnValue(query(0));

      await service.remove("1").catch(() => undefined);

      expect(model.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ _id: { $ne: "1" }, permissions: "users:update", status: "active" }),
      );
    });
  });

  describe("permissions", () => {
    it("stores them completed and stamps the change", async () => {
      model.findByIdAndUpdate.mockReturnValue(query({ id: "1" }));

      await service.setPermissions("1", ["posts:delete"]);

      const [, update] = model.findByIdAndUpdate.mock.calls[0] as [string, { $set: Record<string, unknown> }];
      // `posts:read` arrives with `posts:delete`, and the timestamp is what
      // invalidates tokens minted a moment ago.
      expect(update.$set["permissions"]).toEqual(["posts:delete", "posts:read"]);
      expect(update.$set["permissionsChangedAt"]).toBeInstanceOf(Date);
    });

    /** §5 of the brief: one person's permissions, without touching the role. */
    it("leaves the account's role alone", async () => {
      model.findByIdAndUpdate.mockReturnValue(query({ id: "1" }));

      await service.setPermissions("1", ["posts:read"]);

      const [, update] = model.findByIdAndUpdate.mock.calls[0] as [string, { $set: Record<string, unknown> }];
      expect(update.$set).not.toHaveProperty("roleSlug");
    });

    it("reports a missing account", async () => {
      model.findByIdAndUpdate.mockReturnValue(query(null));
      await expect(service.setPermissions("nope", [])).rejects.toBeInstanceOf(NotFoundException);
    });

    it("adopts a role's permissions when moved onto it", async () => {
      model.findById.mockReturnValue(query({ id: "1", permissions: ["posts:read"] }));
      model.findByIdAndUpdate.mockReturnValue(query({ id: "1" }));

      await service.assignRole("1", "Editor", ["posts:update"]);

      const [, update] = model.findByIdAndUpdate.mock.calls[0] as [string, { $set: Record<string, unknown> }];
      expect(update.$set["roleSlug"]).toBe("editor");
      expect(update.$set["permissions"]).toEqual(["posts:read", "posts:update"]);
    });

    /** Demoting the last manager locks the school out as surely as deleting them. */
    it("refuses to move the last account manager onto a role that cannot manage accounts", async () => {
      model.findById.mockReturnValue(query({ id: "1", permissions: ["users:update"], displayName: "Ama" }));
      model.countDocuments.mockReturnValue(query(0));

      await expect(service.assignRole("1", "editor", ["posts:read"])).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe("status", () => {
    it("suspends without deleting", async () => {
      model.findById.mockReturnValue(query({ id: "1", permissions: ["posts:read"] }));
      model.findByIdAndUpdate.mockReturnValue(query({ status: "suspended" }));

      await expect(service.setStatus("1", "suspended")).resolves.toMatchObject({ status: "suspended" });
    });

    it("reports a missing account when changing status", async () => {
      model.findById.mockReturnValue(query({ id: "nope", permissions: [] }));
      model.findByIdAndUpdate.mockReturnValue(query(null));
      await expect(service.setStatus("nope", "suspended")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("refuses to suspend the only person who can manage accounts", async () => {
      model.findById.mockReturnValue(query({ id: "1", permissions: ["users:update"], displayName: "Ama" }));
      model.countDocuments.mockReturnValue(query(0));

      await expect(service.setStatus("1", "suspended")).rejects.toBeInstanceOf(ConflictException);
    });

    /** Restoring somebody can never reduce the number of managers. */
    it("does not run the manager check when restoring an account", async () => {
      model.findByIdAndUpdate.mockReturnValue(query({ status: "active" }));

      await service.setStatus("1", "active");
      expect(model.countDocuments).not.toHaveBeenCalled();
    });
  });
});
