import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { Permission } from "@kedland/types";

/** What the JWT guard attaches to the request once a token verifies. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  /** Where their permissions came from originally. Never used to authorise. */
  roleSlug: string;
  /** Read fresh from the account on every request, and already completed. */
  permissions: Permission[];
}

/** Injects the signed-in user, so controllers never reach into the raw request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user) {
      // The guard runs first, so this only fires if a route is misconfigured.
      throw new Error("CurrentUser used on a route with no authentication guard");
    }
    return request.user;
  },
);
