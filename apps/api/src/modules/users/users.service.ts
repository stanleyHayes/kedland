import { randomBytes, createHash } from "node:crypto";

import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as argon2 from "argon2";
import { Model, type QueryFilter } from "mongoose";

import { User, type UserDocument } from "./schemas/user.schema";

import type { UserRole } from "@kedland/types";

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

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
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

  async create(input: CreateUserInput): Promise<UserDocument> {
    const email = input.email.toLowerCase().trim();

    if (await this.users.exists({ email })) {
      throw new ConflictException("An account with that email already exists");
    }

    return this.users.create({
      email,
      passwordHash: await UsersService.hashPassword(input.password),
      displayName: input.displayName.trim(),
      role: input.role ?? "editor",
      status: "active",
    });
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
    if (!user) throw new NotFoundException("No such user");
    return user;
  }

  async findAll(filter: QueryFilter<User> = {}): Promise<UserDocument[]> {
    return this.users.find(filter).sort({ createdAt: 1 }).exec();
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

  async updateRole(id: string, role: UserRole): Promise<UserDocument> {
    const user = await this.users
      .findByIdAndUpdate(id, { $set: { role } }, { returnDocument: "after" })
      .exec();
    if (!user) throw new NotFoundException("No such user");
    return user;
  }

  async setStatus(id: string, status: "active" | "suspended"): Promise<UserDocument> {
    const user = await this.users
      .findByIdAndUpdate(id, { $set: { status } }, { returnDocument: "after" })
      .exec();
    if (!user) throw new NotFoundException("No such user");
    return user;
  }

  /**
   * Refuses to remove the last admin.
   *
   * Locking everyone out of the dashboard is not a state the school can
   * recover from without a developer and a database console.
   */
  async remove(id: string): Promise<void> {
    const user = await this.findByIdOrFail(id);

    if (user.role === "admin") {
      const admins = await this.users.countDocuments({ role: "admin" }).exec();
      if (admins <= 1) {
        throw new ConflictException("Cannot remove the only administrator");
      }
    }

    await this.users.deleteOne({ _id: id }).exec();
  }
}
