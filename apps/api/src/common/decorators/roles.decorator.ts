import { SetMetadata } from "@nestjs/common";

import type { UserRole } from "@kedland/types";

export const ROLES_KEY = "roles";

/** Restricts a route to the listed roles. Enforced by RolesGuard. */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
