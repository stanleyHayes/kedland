import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { userRoleSchema } from "@kedland/types";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import type { Request } from "express";

/** The claims we put in an access token. Nothing sensitive — it is readable. */
export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: string;
}

/**
 * Verifies the bearer token on every request.
 *
 * Registered globally, so a route is private unless it carries `@Public()`.
 * The failure direction matters: a forgotten decorator makes an endpoint
 * unreachable (obvious in testing) rather than open to the world.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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

    const role = userRoleSchema.safeParse(claims.role);
    if (!role.success) {
      throw new UnauthorizedException("Token carries an unrecognised role");
    }

    request.user = { id: claims.sub, email: claims.email, role: role.data };
    return true;
  }
}

/** Pulls the token out of `Authorization: Bearer <token>`. */
export function extractBearerToken(header: string | undefined): string | null {
  if (header === undefined) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  if (token === undefined || token.length === 0) return null;

  return token;
}
