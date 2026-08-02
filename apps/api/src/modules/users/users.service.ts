import { randomBytes, createHash } from "node:crypto";

import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as argon2 from "argon2";
import { Model, Types, type QueryFilter } from "mongoose";

import { can, withImpliedReads } from "@kedland/types";

import { User, type UserDocument } from "./schemas/user.schema";

/**
 * After this many consecutive failures the account is locked briefly.
 *
 * Slows credential stuffing without letting an attacker lock a real member of
 * staff out for long by guessing at their address — a permanent lock would be
 * a denial-of-service handed to anyone who knows an email.
 */
export const MAX_FAILED_ATTEMPTS = 8;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

/** Reset links are short-lived; an old email should not stay a live key. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Argon2id parameters.
 *
 * Deliberately explicit rather than left to defaults, so a library upgrade
 * cannot quietly weaken them. 19 MiB and 2 passes is the OWASP baseline.
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * The same 404 from every path that can be handed an id that no longer exists.
 *
 * A helper rather than four copies of the string: the four call sites are
 * `findByIdOrFail`, `setPermissions`, `assignRole` and `setStatus`, and they
 * should not be able to drift into telling the dashboard four different things
 * about the same condition.
 */
function noSuchUser(): NotFoundException {
  return new NotFoundException("No such user");
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  /** The role to copy permissions from. Defaults to `editor`. */
  roleSlug?: string;
  /**
   * The permissions to start with — normally the role's, resolved by the
   * caller.
   *
   * Passed in rather than looked up here so `UsersService` does not depend on
   * `RolesService`: the seed needs to create the first administrator before any
   * role document is guaranteed to exist, and a circular dependency between the
   * two services is a worse problem than one explicit argument.
   */
  permissions?: readonly string[];
  /** True for an invited account that has not chosen a password yet. */
  isInvited?: boolean;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<UserDocument>) {}

  static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  /**
   * Verifies a password.
   *
   * Swallows argon2's errors deliberately: a malformed stored hash is a failed
   * verification, not a 500 that tells the caller something interesting.
   */
  static async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  static hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /**
   * A password for an invited account that nobody will ever type.
   *
   * The account needs *some* hash — the field is required, and a nullable one
   * would mean every sign-in path had to consider "no password set" as a case
   * that might mean "let them in". This is unguessable and discarded
   * immediately; the invitee sets a real one through the reset flow.
   */
  static randomPassword(): string {
    return randomBytes(32).toString("base64url");
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    const email = input.email.toLowerCase().trim();

    if (await this.users.exists({ email })) {
      throw new ConflictException("An account with that email already exists");
    }

    return this.users.create({
      email,
      passwordHash: await UsersService.hashPassword(input.password),
      displayName: input.displayName.trim(),
      roleSlug: input.roleSlug ?? "editor",
      // Resolved once, here, and the account's own from this moment on. Later
      // edits to the role do not reach back into it.
      permissions: withImpliedReads(input.permissions ?? []),
      isInvited: input.isInvited ?? false,
      status: "active",
    });
  }

  /**
   * Replaces an account's permissions.
   *
   * Does not touch `roleSlug`: the role records where the account started, and
   * an administrator granting one editor an extra permission is not changing
   * what "Editor" means. That is the distinction the whole model rests on.
   *
   * Stamps `permissionsChangedAt`, which invalidates every access token issued
   * before now — so a permission removed here stops working on the holder's next
   * request rather than up to fifteen minutes later.
   */
  async setPermissions(id: string, permissions: readonly string[]): Promise<UserDocument> {
    const user = await this.users
      .findByIdAndUpdate(
        id,
        { $set: { permissions: withImpliedReads(permissions), permissionsChangedAt: new Date() } },
        { returnDocument: "after" },
      )
      .exec();

    if (!user) throw noSuchUser();
    return user;
  }

  /**
   * Gives permissions to accounts created before permissions existed.
   *
   * Without this, upgrading a running school locks it out of its own dashboard:
   * the seed skips creating an administrator when one already exists, so the only
   * account keeps `permissions: []` and every route refuses it. That is not a
   * hypothetical — it is what happened on the first run against a real database,
   * and the login succeeded while every subsequent request returned 403.
   *
   * Two details it depends on:
   *
   *  - **The legacy `role` field is read through the raw collection.** It is no
   *    longer in the schema, and Mongoose in strict mode will not return a path
   *    it does not know about. `"admin"` becomes `administrator`; anything else
   *    becomes `editor`, which is what the old two-value field meant.
   *  - **Only accounts nobody has deliberately emptied.** An administrator may
   *    legitimately strip an account to nothing, and that must not be undone by
   *    the next deploy. `permissionsChangedAt` is the discriminator: null means
   *    no one has ever set them, so an empty list is absence rather than intent.
   *
   * The resolver is passed in for the same reason `create` takes permissions —
   * so this service does not depend on `RolesService`.
   */
  async backfillPermissions(
    permissionsFor: (roleSlug: string) => Promise<readonly string[]>,
  ): Promise<{ updated: string[] }> {
    const stale = await this.users
      .find({
        permissionsChangedAt: null,
        $or: [{ permissions: { $size: 0 } }, { permissions: { $exists: false } }],
      })
      .exec();

    const updated: string[] = [];

    for (const user of stale) {
      // Read the pre-migration field the schema no longer declares.
      const legacy = await this.users.collection.findOne<{ role?: string }>(
        { _id: new Types.ObjectId(user.id) },
        { projection: { role: 1 } },
      );

      // No `?? "editor"` on `roleSlug`: the schema defaults it, and Mongoose
      // applies schema defaults when it hydrates — including for a document
      // written before the field existed, which is precisely this case.
      const roleSlug = legacy?.role === "admin" ? "administrator" : user.roleSlug;
      const permissions = withImpliedReads(await permissionsFor(roleSlug));

      await this.users
        .updateOne(
          { _id: user.id },
          // No `permissionsChangedAt`: this is filling in what was never set,
          // not an administrator revoking something, and stamping it would sign
          // the account out of a session it is entitled to keep.
          { $set: { roleSlug, permissions }, $unset: { role: "" } },
        )
        .exec();

      updated.push(user.email);
    }

    return { updated };
  }

  /* ── Two-factor authentication ──────────────────────────────────────── */

  /**
   * The fields two-factor needs, none of which are selected by default.
   *
   * One query rather than three, and the only place that asks for the secret at
   * all — a credential that arrives on every routine user read is one that ends
   * up in a log eventually.
   */
  async findForMfa(id: string): Promise<UserDocument | null> {
    return this.users.findById(id).select("+mfaSecret +mfaRecoveryCodes +passwordHash").exec();
  }

  /**
   * Switches two-factor on, with its recovery codes.
   *
   * Does not stamp `permissionsChangedAt`: adding a factor is not a change to
   * what the account may do, and signing somebody out of the session they just
   * enrolled from would be a strange reward for turning it on.
   */
  async enableMfa(id: string, encryptedSecret: string, hashedRecoveryCodes: string[]): Promise<void> {
    await this.users
      .updateOne(
        { _id: id },
        {
          $set: {
            mfaSecret: encryptedSecret,
            mfaRecoveryCodes: hashedRecoveryCodes,
            mfaEnabledAt: new Date(),
          },
        },
      )
      .exec();
  }

  /** Off again, leaving nothing behind that could be re-armed. */
  async disableMfa(id: string): Promise<void> {
    await this.users
      .updateOne({ _id: id }, { $set: { mfaSecret: null, mfaRecoveryCodes: [], mfaEnabledAt: null } })
      .exec();
  }

  /**
   * Spends one recovery code.
   *
   * `$pull`, so the code is gone rather than marked used — there is then no
   * state in which a spent code could be replayed, and no flag for a later query
   * to forget to check.
   */
  async consumeRecoveryCode(id: string, hashedCode: string): Promise<void> {
    await this.users.updateOne({ _id: id }, { $pull: { mfaRecoveryCodes: hashedCode } }).exec();
  }

  /**
   * Everyone who can manage staff accounts.
   *
   * The invariant the school cannot recover from on its own is losing the
   * ability to grant permissions — not losing a role named "administrator".
   * Counting the permission rather than the role is what makes the check
   * survive an administrator who renamed things.
   */
  async countAccountManagers(excludeId?: string): Promise<number> {
    const filter: QueryFilter<User> = {
      permissions: "users:update",
      status: "active",
      ...(excludeId === undefined ? {} : { _id: { $ne: excludeId } }),
    };

    return this.users.countDocuments(filter).exec();
  }

  /** Throws unless at least one other active account could still manage users. */
  private async assertNotLastAccountManager(user: UserDocument, action: string): Promise<void> {
    if (!can(withImpliedReads(user.permissions), "users", "update")) return;

    if ((await this.countAccountManagers(user.id)) === 0) {
      throw new ConflictException(
        `${user.displayName} is the only person who can manage staff accounts, so they cannot be ${action}`,
      );
    }
  }

  /** Includes the password hash — only for the sign-in path. */
  async findForAuthentication(email: string): Promise<UserDocument | null> {
    return this.users.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash").exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.users.findById(id).exec();
  }

  async findByIdOrFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) throw noSuchUser();
    return user;
  }

  async findAll(filter: QueryFilter<User> = {}): Promise<UserDocument[]> {
    return this.users.find(filter).sort({ createdAt: 1 }).exec();
  }

  async updateProfile(
    id: string,
    input: string | { displayName?: string | undefined; avatarUrl?: string | null | undefined },
  ): Promise<UserDocument> {
    const profile = typeof input === "string" ? { displayName: input } : input;
    const changes: Record<string, string | null> = {};
    if (profile.displayName !== undefined) changes["displayName"] = profile.displayName.trim();
    if (profile.avatarUrl !== undefined) changes["avatarUrl"] = profile.avatarUrl;
    const user = await this.users
      .findByIdAndUpdate(id, { $set: changes }, { returnDocument: "after" })
      .exec();

    if (!user) throw noSuchUser();
    return user;
  }

  async count(): Promise<number> {
    return this.users.countDocuments().exec();
  }

  /** True while the account is locked out after repeated failures. */
  static isLocked(user: Pick<UserDocument, "lockedUntil">): boolean {
    return user.lockedUntil !== null && user.lockedUntil.getTime() > Date.now();
  }

  async recordFailedAttempt(id: string): Promise<void> {
    const user = await this.users.findById(id).exec();
    if (!user) return;

    const failedAttempts = user.failedAttempts + 1;
    const lockedUntil =
      failedAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MS) : user.lockedUntil;

    await this.users.updateOne({ _id: id }, { $set: { failedAttempts, lockedUntil } }).exec();
  }

  async recordSuccessfulLogin(id: string): Promise<void> {
    await this.users
      .updateOne({ _id: id }, { $set: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } })
      .exec();
  }

  async setPassword(id: string, password: string): Promise<void> {
    await this.users
      .updateOne(
        { _id: id },
        {
          $set: {
            passwordHash: await UsersService.hashPassword(password),
            passwordChangedAt: new Date(),
            failedAttempts: 0,
            lockedUntil: null,
            passwordResetTokenHash: null,
            passwordResetExpiresAt: null,
          },
        },
      )
      .exec();
  }

  /**
   * Issues a password-reset token.
   *
   * Returns the raw token for the email; only its hash is stored, so a database
   * read cannot be turned into an account takeover.
   */
  async createPasswordResetToken(id: string): Promise<string> {
    const token = randomBytes(32).toString("hex");

    await this.users
      .updateOne(
        { _id: id },
        {
          $set: {
            passwordResetTokenHash: UsersService.hashToken(token),
            passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
          },
        },
      )
      .exec();

    return token;
  }

  /** Resolves a raw reset token to its account, if it is valid and unexpired. */
  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.users
      .findOne({
        passwordResetTokenHash: UsersService.hashToken(token),
        passwordResetExpiresAt: { $gt: new Date() },
      })
      .exec();
  }

  /**
   * Moves an account onto a different role, adopting that role's permissions.
   *
   * This is the one path that *does* overwrite a user's permissions from a
   * role, because it is the administrator explicitly asking for it — the same
   * thing that happened at creation. Any individual grants made since are lost,
   * which is why the dashboard says so before doing it.
   */
  async assignRole(id: string, roleSlug: string, permissions: readonly string[]): Promise<UserDocument> {
    const target = await this.findByIdOrFail(id);
    const next = withImpliedReads(permissions);

    // Demoting the last person who can manage accounts locks the school out
    // just as thoroughly as deleting them.
    if (!can(next, "users", "update")) {
      await this.assertNotLastAccountManager(target, "moved to a role that cannot manage accounts");
    }

    const user = await this.users
      .findByIdAndUpdate(
        id,
        {
          $set: {
            roleSlug: roleSlug.toLowerCase().trim(),
            permissions: next,
            permissionsChangedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!user) throw noSuchUser();
    return user;
  }

  async setStatus(id: string, status: "active" | "suspended"): Promise<UserDocument> {
    if (status === "suspended") {
      await this.assertNotLastAccountManager(await this.findByIdOrFail(id), "suspended");
    }

    const user = await this.users
      .findByIdAndUpdate(id, { $set: { status } }, { returnDocument: "after" })
      .exec();
    if (!user) throw noSuchUser();
    return user;
  }

  /**
   * Deletes an account without any of the checks `remove` applies.
   *
   * Only for undoing a create that failed part-way through — inviting somebody
   * whose invitation could not be sent. The business rules exist to stop an
   * administrator locking the school out, and none of them are relevant to an
   * account that was never usable and existed for milliseconds. Running them
   * here would also be misleading: a failure would report that somebody cannot
   * be removed, about an account nobody asked to remove.
   */
  async deleteForRollback(id: string): Promise<void> {
    await this.users.deleteOne({ _id: id }).exec();
  }

  /**
   * Refuses to remove the last person who can manage staff accounts.
   *
   * Locking everyone out of user management is not a state the school can
   * recover from without a developer and a database console.
   */
  async remove(id: string): Promise<void> {
    const user = await this.findByIdOrFail(id);
    await this.assertNotLastAccountManager(user, "removed");

    await this.users.deleteOne({ _id: id }).exec();
  }
}
