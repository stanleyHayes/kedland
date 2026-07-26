import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { can } from "@kedland/types";

import { PERMISSION_KEY, type RequiredPermission } from "../decorators/require-permission.decorator";

import type { AuthenticatedUser } from "../decorators/current-user.decorator";

/**
 * Enforces `@RequirePermission(...)`.
 *
 * Runs after the JWT guard, so a request reaching here is authenticated and
 * carries the permissions resolved for that account.
 *
 * A route with no `@RequirePermission` is open to any signed-in member of
 * staff. That is the right default for this API — reading the school's own
 * published content, the health check, signing out — but it does mean an
 * omission on a *write* route is an unguarded write. The guard cannot detect
 * that; `permissions.guard.spec.ts` asserts instead that every mutating
 * controller route declares one, which catches the omission at build time
 * rather than in production.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // `| undefined` on purpose: a route with no decorator has no metadata, and
    // claiming otherwise would make the guard clause below unreachable.
    const required = this.reflector.getAllAndOverride<RequiredPermission | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user || !can(user.permissions, required.resource, required.action)) {
      // Deliberately says what is missing. The alternative — a bare "forbidden"
      // — turns a permission an administrator simply has not granted yet into a
      // support conversation. It reveals nothing: the caller already knows which
      // endpoint they called.
      throw new ForbiddenException(
        `Your account does not have permission to ${required.action} ${required.resource}`,
      );
    }

    return true;
  }
}
