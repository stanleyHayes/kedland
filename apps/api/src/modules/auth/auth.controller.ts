import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { withImpliedReads } from "@kedland/types";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { UsersService } from "../users/users.service";

import {
  AuthService,
  type AuthenticatedResult,
  type MfaChallenge,
  type RequestContext,
  type TokenPair,
} from "./auth.service";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  MfaDisableDto,
  MfaEnableDto,
  MfaVerifyDto,
  RefreshDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from "./dto/auth.dto";
import { MfaService } from "./mfa.service";

import type { Permission, UserStatus } from "@kedland/types";
import type { Request } from "express";

/**
 * The login rate limit.
 *
 * Read from the environment at module load because `@Throttle` is a decorator
 * and cannot reach the ConfigService. The env schema supplies and validates the
 * default; this only parses what it already guaranteed.
 */
const LOGIN_LIMIT = Number(process.env["THROTTLE_LOGIN_LIMIT"] ?? 8);

/** What `GET /auth/me` returns — the account, without anything sensitive. */
export interface AccountSummary {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  /** Where the permissions came from. A label — never used to authorise. */
  roleSlug: string;
  /** What this account may do. The dashboard renders from these. */
  permissions: Permission[];
  /** Whether an authenticator app is enrolled. The dashboard renders from this. */
  mfaEnabled: boolean;
  status: UserStatus;
  lastLoginAt: Date | null;
}

/** Pulls the caller's fingerprint for the audit trail. */
function contextOf(request: Request): RequestContext {
  return { ip: request.ip, userAgent: request.get("user-agent") };
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly mfa: MfaService,
  ) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  // Tighter than the global ceiling: this is the endpoint worth brute-forcing,
  // and staff sign in a few times a day, not a few times a minute. The number
  // is `THROTTLE_LOGIN_LIMIT`, resolved at request time so the integration
  // suite — where every call shares one IP — can raise it.
  @Throttle({ default: { limit: LOGIN_LIMIT, ttl: 60_000 } })
  @ApiOperation({ summary: "Sign in — returns tokens, or a challenge when two-factor is on" })
  async login(@Body() dto: LoginDto, @Req() request: Request): Promise<AuthenticatedResult | MfaChallenge> {
    // Two shapes, deliberately. An account with two-factor enabled gets
    // `{ mfaRequired: true, challenge }` and no tokens at all — see the note in
    // `AuthService.login` for why nothing is minted before the code.
    return this.auth.login(dto.email, dto.password, contextOf(request));
  }

  /**
   * Second step of a two-factor sign-in.
   *
   * Public and rate-limited for the same reason `login` is: the caller has no
   * token yet, and this is the other endpoint worth guessing at. A six-digit
   * code is a million possibilities, which is a lot for a person and not many
   * for a script — the limiter is what makes the difference.
   */
  @Public()
  @Post("mfa/verify")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LOGIN_LIMIT, ttl: 60_000 } })
  @ApiOperation({ summary: "Complete a two-factor sign-in" })
  async verifyMfa(@Body() dto: MfaVerifyDto, @Req() request: Request): Promise<AuthenticatedResult> {
    return this.auth.completeMfa(dto.challenge, dto.code, contextOf(request));
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: "Exchange a refresh token for a new pair" })
  async refresh(@Body() dto: RefreshDto, @Req() request: Request): Promise<TokenPair> {
    return this.auth.refresh(dto.refreshToken, contextOf(request));
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke a refresh token" })
  async logout(@Body() dto: RefreshDto, @Req() request: Request): Promise<void> {
    await this.auth.logout(dto.refreshToken, contextOf(request));
  }

  @Public()
  @Post("password/forgot")
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @ApiOperation({ summary: "Begin a password reset" })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.auth.startPasswordReset(dto.email);

    // Always the same answer. Saying "no such account" would turn this into a
    // way to discover which staff addresses exist. Delivery is wired to Resend
    // in Phase 5; until then the token is only ever written to the database.
    return { message: "If that address matches an account, a reset link is on its way." };
  }

  @Public()
  @Post("password/reset")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @ApiOperation({ summary: "Complete a password reset" })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.completePasswordReset(dto.token, dto.password);
  }

  @Post("password/change")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Change your own password" })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  /* ── Two-factor authentication ─────────────────────────────────────── */

  /**
   * Starts an enrolment. Stores nothing.
   *
   * An interrupted enrolment — the tab closed, the phone flat — must leave the
   * account exactly as it was, so the secret only becomes real at `enable`, and
   * only once a code from it has been shown to work.
   */
  @Post("mfa/setup")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Begin two-factor enrolment" })
  setupMfa(@CurrentUser() user: AuthenticatedUser): { secret: string; uri: string } {
    return this.mfa.begin(user.email);
  }

  /**
   * @returns the recovery codes, the only time they exist in readable form.
   */
  @Post("mfa/enable")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm and switch two-factor on" })
  async enableMfa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaEnableDto,
  ): Promise<{ recoveryCodes: string[] }> {
    return { recoveryCodes: await this.mfa.enable(user.id, dto.secret, dto.code) };
  }

  @Post("mfa/disable")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Switch two-factor off — requires the password" })
  async disableMfa(@CurrentUser() user: AuthenticatedUser, @Body() dto: MfaDisableDto): Promise<void> {
    await this.mfa.disable(user.id, dto.password);
  }

  @Get("me")
  @ApiOperation({ summary: "The signed-in account" })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AccountSummary> {
    const account = await this.users.findByIdOrFail(user.id);

    return accountSummary(account);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update your own profile" })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<AccountSummary> {
    return accountSummary(await this.auth.updateProfile(user.id, dto));
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke every active session for your account" })
  async logoutAll(@CurrentUser() user: AuthenticatedUser, @Req() request: Request): Promise<void> {
    await this.auth.logoutAll(user.id, contextOf(request));
  }
}

function accountSummary(account: Awaited<ReturnType<UsersService["findByIdOrFail"]>>): AccountSummary {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    avatarUrl: account.avatarUrl,
    roleSlug: account.roleSlug,
    permissions: withImpliedReads(account.permissions),
    mfaEnabled: account.mfaEnabledAt !== null,
    status: account.status,
    lastLoginAt: account.lastLoginAt,
  };
}
