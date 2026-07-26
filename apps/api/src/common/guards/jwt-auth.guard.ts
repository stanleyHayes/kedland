import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { withImpliedReads } from "@kedland/types";

import { UsersService } from "../../modules/users/users.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import type { Request } from "express";

/**
 * The claims we put in an access token.
 *
 * Identity only. Permissions are deliberately **not** in here: a token is
 * issued for fifteen minutes, and a permission an administrator has just
 * revoked must not keep working for the rest of them. See the note in
 * `canActivate`.
 */
export interface AccessTokenClaims {
  sub: string;
  email: string;
  /** Seconds since the epoch, set by the signer. */
  iat?: number;
}

/**
 * Verifies the bearer token on every request, then reads the account.
 *
 * Registered globally, so a route is private unless it carries `@Public()`.
 * The failure direction matters: a forgotten decorator makes an endpoint
 * unreachable (obvious in testing) rather than open to the world.
 *
 * **This guard reads the database.** That is a deliberate reversal of the usual
 * stateless-JWT advice, and it is worth being clear about why:
 *
 *  - Authority has to be current. Revoking a permission, suspending an account
 *    or changing a password after a suspected compromise must take effect on
 *    the next request — not whenever a fifteen-minute token happens to lapse.
 *    `passwordChangedAt` previously claimed to do this in a comment while
 *    nothing enforced it; that is now true rather than aspirational.
 *  - The cost is nothing here. Public traffic — the whole school website —
 *    returns at the `@Public()` check above without touching Mongo. The only
 *    requests that reach this line are back-office requests from the two or
 *    three people the build package describes (§5.4), against an indexed
 *    primary key.
 *
 * A busier product would pay for the same guarantee with a revocation list and
 * a cache. At this scale that machinery would be the more expensive choice.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic === true) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = extractBearerToken(request.headers.authorization);

    if (token === null) {
      throw new UnauthorizedException("Missing bearer token");
    }

    let claims: AccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(token, {
        secret: this.config.getOrThrow<string>("auth.accessSecret"),
      });
    } catch {
      // Expired, tampered with, or signed by the refresh key — all the same
      // answer to the caller. Distinguishing them helps only an attacker.
      throw new UnauthorizedException("Invalid or expired token");
    }

    // One message for every rejection below, for the same reason: a valid token
    // for a suspended account and a valid token for a deleted one should not be
    // distinguishable from outside.
    const rejected = new UnauthorizedException("Your session is no longer valid — please sign in again");

    const user = await this.users.findById(claims.sub);
    if (user?.status !== "active") throw rejected;

    if (
      isIssuedBefore(claims.iat, user.passwordChangedAt) ||
      isIssuedBefore(claims.iat, user.permissionsChangedAt)
    ) {
      throw rejected;
    }

    request.user = {
      id: user.id,
      email: user.email,
      roleSlug: user.roleSlug,
      // Completed on read as well as on write. A list stored by an older build
      // may hold `posts:create` with no `posts:read`, and a guard that trusted
      // it would refuse a request the holder is plainly entitled to make.
      permissions: withImpliedReads(user.permissions),
    };
    return true;
  }
}

/**
 * Whether a token predates a security-relevant change to the account.
 *
 * `iat` is in whole seconds and the timestamps are milliseconds, so the
 * comparison is floored to seconds on both sides. Without that, a token minted
 * in the same second as the change looks older than it by up to 999ms and the
 * holder is signed out of the session they just started — which is exactly what
 * happens on the "change your own password" path.
 */
export function isIssuedBefore(issuedAt: number | undefined, changedAt: Date | null): boolean {
  if (changedAt === null) return false;
  // No `iat` means we cannot establish the token is current, so we do not
  // assume it is. Every token this API signs has one.
  if (issuedAt === undefined) return true;

  return issuedAt < Math.floor(changedAt.getTime() / 1000);
}

/** Pulls the token out of `Authorization: Bearer <token>`. */
export function extractBearerToken(header: string | undefined): string | null {
  if (header === undefined) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  if (token === undefined || token.length === 0) return null;

  return token;
}
