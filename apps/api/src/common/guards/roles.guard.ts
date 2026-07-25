import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ROLES_KEY } from "../decorators/roles.decorator";

import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import type { UserRole } from "@kedland/types";

/**
 * Enforces `@Roles(...)`.
 *
 * Runs after the JWT guard, so a request reaching here is already
 * authenticated. A route with no `@Roles` is open to any signed-in staff
 * member, which is right for most of the back office — only user management
 * and the audit log are admin-only.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // `| undefined` on purpose: a route with no `@Roles` has no metadata, and
    // claiming otherwise would make the guard clause below unreachable.
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException("Your account does not have access to this");
    }

    return true;
  }
}
