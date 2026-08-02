import { createHash, randomBytes, randomUUID } from "node:crypto";

import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { withImpliedReads } from "@kedland/types";

import { AuditService } from "../audit/audit.service";
import { UsersService } from "../users/users.service";

import { MfaService } from "./mfa.service";
import { RefreshToken, type RefreshTokenDocument } from "./schemas/refresh-token.schema";

import type { UserDocument } from "../users/schemas/user.schema";
import type { Permission } from "@kedland/types";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedResult extends TokenPair {
  /**
   * Includes `permissions`, because the dashboard needs them to decide what to
   * render — a route the signer-in cannot read is not shown at all, and a button
   * for an action they cannot take is absent rather than disabled. Sending them
   * with the session saves a second round trip before the first paint.
   */
  user: { id: string; email: string; displayName: string; roleSlug: string; permissions: Permission[] };
}

export interface RequestContext {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

/** Seven days, matching the default refresh TTL. */
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * How long a passed password check stays good for while the code is entered.
 *
 * Long enough to unlock a phone and find the app, short enough that a challenge
 * overheard or left in a log is worthless by the time anyone tries it.
 */
const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;

/** What `login` returns when the password was right but a code is still needed. */
export interface MfaChallenge {
  mfaRequired: true;
  /** Presented back to `completeMfa` with the code. Carries no claims. */
  challenge: string;
}

export function isMfaChallenge(result: AuthenticatedResult | MfaChallenge): result is MfaChallenge {
  return "mfaRequired" in result;
}

interface PendingChallenge {
  userId: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly audit: AuditService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectModel(RefreshToken.name) private readonly refreshTokens: Model<RefreshTokenDocument>,
    private readonly mfa: MfaService,
  ) {}

  /**
   * Half-finished sign-ins, held in memory.
   *
   * In memory rather than in Mongo because they live for five minutes, carry no
   * authority on their own — a challenge without the code is worth nothing — and
   * the cost of losing them to a restart is that somebody types their password
   * again. A collection with a TTL index would be more machinery than the
   * problem deserves at two or three members of staff.
   *
   * The honest limitation: with more than one API instance a challenge issued by
   * one is unknown to another. Render runs a single instance here; if that ever
   * changes this needs to move to the database, and that is the trigger.
   */
  private readonly pendingChallenges = new Map<string, PendingChallenge>();

  /**
   * Exchanges a challenge and a code for tokens.
   *
   * The challenge is spent whatever the outcome, so a wrong code costs the
   * password step again rather than granting unlimited attempts against a live
   * challenge.
   */
  async completeMfa(
    challenge: string,
    code: string,
    context: RequestContext = {},
  ): Promise<AuthenticatedResult> {
    const invalid = new UnauthorizedException("That code was not accepted — please sign in again.");

    const pending = this.pendingChallenges.get(challenge);
    this.pendingChallenges.delete(challenge);
    if (!pending || pending.expiresAt < Date.now()) throw invalid;

    // Opportunistic sweep: without it an abandoned challenge sits in the map
    // until the process restarts.
    for (const [key, value] of this.pendingChallenges) {
      if (value.expiresAt < Date.now()) this.pendingChallenges.delete(key);
    }

    if (!(await this.mfa.verify(pending.userId, code))) {
      await this.users.recordFailedAttempt(pending.userId);
      throw invalid;
    }

    const user = await this.users.findById(pending.userId);
    if (user?.status !== "active") throw invalid;

    await this.users.recordSuccessfulLogin(user.id);
    await this.audit.record({
      actorId: user.id,
      actorEmail: user.email,
      action: "login",
      entityType: "auth",
      changes: { secondFactor: true },
      ip: context.ip,
    });

    const tokens = await this.issueTokens(user, randomUUID(), context);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roleSlug: user.roleSlug,
        permissions: withImpliedReads(user.permissions),
      },
    };
  }

  private static hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  private static hashIp(ip: string | undefined): string | null {
    if (ip === undefined || ip.length === 0) return null;
    return createHash("sha256").update(ip).digest("hex").slice(0, 32);
  }

  /**
   * Signs in.
   *
   * Every failure — unknown email, wrong password, suspended, locked out —
   * returns the same message. Distinguishing them turns the sign-in form into
   * an oracle for which addresses have accounts.
   */
  async login(
    email: string,
    password: string,
    context: RequestContext = {},
  ): Promise<AuthenticatedResult | MfaChallenge> {
    const invalid = new UnauthorizedException("Those details did not match an account");

    const user = await this.users.findForAuthentication(email);

    if (!user) {
      // Still hash something, so a missing account is not measurably faster
      // than a wrong password.
      await UsersService.verifyPassword(
        "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000",
        password,
      );
      await this.audit.record({
        action: "login-failed",
        entityType: "auth",
        entityId: email.toLowerCase(),
        ip: context.ip,
      });
      throw invalid;
    }

    if (UsersService.isLocked(user)) {
      await this.audit.record({
        actorId: user.id,
        actorEmail: user.email,
        action: "login-failed",
        entityType: "auth",
        changes: { reason: "locked" },
        ip: context.ip,
      });
      throw invalid;
    }

    const passwordMatches = await UsersService.verifyPassword(user.passwordHash, password);

    if (!passwordMatches || user.status !== "active") {
      await this.users.recordFailedAttempt(user.id);
      await this.audit.record({
        actorId: user.id,
        actorEmail: user.email,
        action: "login-failed",
        entityType: "auth",
        changes: { reason: passwordMatches ? "suspended" : "bad-password" },
        ip: context.ip,
      });
      throw invalid;
    }

    /*
     * The password was right, and that is all it was.
     *
     * With two-factor on, no token is minted here — a challenge is returned
     * instead and the tokens wait behind `completeMfa`. Issuing them now and
     * asking for a code afterwards would make the second factor advisory: the
     * session would already exist, and anything holding the response would
     * already be signed in.
     *
     * `recordSuccessfulLogin` also waits, so a half-finished sign-in does not
     * clear the failed-attempt counter that limits guessing.
     */
    if (user.mfaEnabledAt) {
      const challenge = MfaService.challengeToken();
      this.pendingChallenges.set(challenge, {
        userId: user.id,
        expiresAt: Date.now() + MFA_CHALLENGE_TTL_MS,
      });

      await this.audit.record({
        actorId: user.id,
        actorEmail: user.email,
        action: "login-mfa-required",
        entityType: "auth",
        ip: context.ip,
      });

      return { mfaRequired: true, challenge };
    }

    await this.users.recordSuccessfulLogin(user.id);
    await this.audit.record({
      actorId: user.id,
      actorEmail: user.email,
      action: "login",
      entityType: "auth",
      ip: context.ip,
    });

    const tokens = await this.issueTokens(user, randomUUID(), context);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roleSlug: user.roleSlug,
        permissions: withImpliedReads(user.permissions),
      },
    };
  }

  /** Mints an access/refresh pair and persists the refresh token's hash. */
  private async issueTokens(user: UserDocument, family: string, context: RequestContext): Promise<TokenPair> {
    // Identity only — no permissions. A token lives fifteen minutes and a
    // permission revoked in that window must stop working immediately, so
    // `JwtAuthGuard` reads the account instead. See the note there.
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.getOrThrow<string>("auth.accessSecret"),
        // jsonwebtoken types this as a `"15m"`-shaped template literal; the
        // value is validated as a string by the env schema, so the assertion
        // is at the boundary between the two type systems, not a shortcut.
        expiresIn: this.config.getOrThrow<string>("auth.accessTtl") as `${number}${"s" | "m" | "h" | "d"}`,
      },
    );

    const refreshToken = randomBytes(48).toString("base64url");

    await this.refreshTokens.create({
      userId: new Types.ObjectId(user.id),
      tokenHash: AuthService.hash(refreshToken),
      family,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      userAgent: context.userAgent ?? null,
      ipHash: AuthService.hashIp(context.ip),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Exchanges a refresh token for a new pair.
   *
   * Presenting a token that has already been used means it was captured: the
   * legitimate holder rotated it, so the copy being replayed is a thief's. The
   * whole family is revoked, which signs out both parties. Losing a session is
   * a far smaller harm than leaving a stolen one alive.
   */
  async refresh(token: string, context: RequestContext = {}): Promise<TokenPair> {
    const invalid = new UnauthorizedException("Your session has expired — please sign in again");
    const tokenHash = AuthService.hash(token);

    const stored = await this.refreshTokens.findOne({ tokenHash }).exec();
    if (!stored) throw invalid;

    if (stored.revokedAt !== null) {
      this.logger.warn(`Refresh token reuse detected for family ${stored.family}; revoking it`);
      await this.revokeFamily(stored.family);
      await this.audit.record({
        actorId: stored.userId.toString(),
        action: "logout",
        entityType: "auth",
        changes: { reason: "refresh-token-reuse" },
        ip: context.ip,
      });
      throw invalid;
    }

    if (stored.expiresAt.getTime() <= Date.now()) throw invalid;

    const user = await this.users.findById(stored.userId.toString());
    if (user?.status !== "active") throw invalid;

    const tokens = await this.issueTokens(user, stored.family, context);

    await this.refreshTokens
      .updateOne(
        { _id: stored._id },
        { $set: { revokedAt: new Date(), replacedByHash: AuthService.hash(tokens.refreshToken) } },
      )
      .exec();

    return tokens;
  }

  /** Signs out one session. */
  async logout(token: string, context: RequestContext = {}): Promise<void> {
    const stored = await this.refreshTokens.findOne({ tokenHash: AuthService.hash(token) }).exec();
    if (!stored) return;

    await this.refreshTokens.updateOne({ _id: stored._id }, { $set: { revokedAt: new Date() } }).exec();
    await this.audit.record({
      actorId: stored.userId.toString(),
      action: "logout",
      entityType: "auth",
      ip: context.ip,
    });
  }

  async revokeFamily(family: string): Promise<void> {
    await this.refreshTokens
      .updateMany({ family, revokedAt: null }, { $set: { revokedAt: new Date() } })
      .exec();
  }

  /** Signs out every session for a user — used on password change. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokens
      .updateMany(
        { userId: new Types.ObjectId(userId), revokedAt: null },
        { $set: { revokedAt: new Date() } },
      )
      .exec();
  }

  async logoutAll(userId: string, context: RequestContext = {}): Promise<void> {
    await this.revokeAllForUser(userId);
    await this.audit.record({
      actorId: userId,
      action: "logout",
      entityType: "auth",
      changes: { scope: "all-sessions" },
      ip: context.ip,
    });
  }

  async updateProfile(
    userId: string,
    input: string | { displayName?: string | undefined; avatarUrl?: string | null | undefined },
  ): Promise<UserDocument> {
    const profile = typeof input === "string" ? { displayName: input } : input;
    const user = await this.users.updateProfile(userId, input);
    await this.audit.record({
      actorId: userId,
      actorEmail: user.email,
      action: "update",
      entityType: "profile",
      entityId: userId,
      changes: {
        ...(profile.displayName !== undefined ? { displayName: user.displayName } : {}),
        ...(profile.avatarUrl !== undefined ? { avatarUrl: user.avatarUrl } : {}),
      },
    });
    return user;
  }

  /**
   * Starts a password reset.
   *
   * Returns the raw token when the address matches an account, and `null` when
   * it does not. The controller answers identically either way — a reset form
   * that says "no such account" is an account-enumeration tool.
   */
  async startPasswordReset(email: string): Promise<{ token: string; user: UserDocument } | null> {
    const user = await this.users.findForAuthentication(email);
    if (user?.status !== "active") return null;

    const token = await this.users.createPasswordResetToken(user.id);
    await this.audit.record({
      actorId: user.id,
      actorEmail: user.email,
      action: "password-change",
      entityType: "auth",
      changes: { stage: "requested" },
    });

    return { token, user };
  }

  /** Completes a reset and signs out every existing session. */
  async completePasswordReset(token: string, newPassword: string): Promise<void> {
    const user = await this.users.findByResetToken(token);
    if (!user) {
      throw new UnauthorizedException("That reset link is invalid or has expired");
    }

    await this.users.setPassword(user.id, newPassword);
    await this.revokeAllForUser(user.id);

    await this.audit.record({
      actorId: user.id,
      actorEmail: user.email,
      action: "password-change",
      entityType: "auth",
      changes: { stage: "completed" },
    });
  }

  /** Changes a signed-in user's own password, after checking the current one. */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.users.findByIdOrFail(userId);
    const withHash = await this.users.findForAuthentication(user.email);

    if (!withHash || !(await UsersService.verifyPassword(withHash.passwordHash, currentPassword))) {
      throw new UnauthorizedException("Your current password is not correct");
    }

    await this.users.setPassword(userId, newPassword);
    await this.revokeAllForUser(userId);

    await this.audit.record({
      actorId: userId,
      actorEmail: user.email,
      action: "password-change",
      entityType: "auth",
      changes: { stage: "self-service" },
    });
  }
}
