import { SetMetadata } from "@nestjs/common";

import type { Action, Resource } from "@kedland/types";

export const PERMISSION_KEY = "requiredPermission";

export interface RequiredPermission {
  resource: Resource;
  action: Action;
}

/**
 * Restricts a route to holders of one permission. Enforced by
 * `PermissionsGuard`.
 *
 * One permission rather than a list: every endpoint in this API is one action on
 * one resource, and a route that genuinely needed "either of these" would be
 * two routes. Keeping it singular means the guard has no policy to decide —
 * no any-of versus all-of question that a reader has to look up.
 *
 * Takes `Resource` and `Action` separately rather than a `"posts:read"` string
 * so a typo is a compile error. A misspelled permission string would otherwise
 * be a permission nobody holds, and the route would 403 for everyone including
 * the administrator — a lockout that looks like a data problem.
 */
export const RequirePermission = (resource: Resource, action: Action): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSION_KEY, { resource, action } satisfies RequiredPermission);
