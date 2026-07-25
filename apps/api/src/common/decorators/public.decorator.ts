import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Opts a route out of authentication.
 *
 * The JWT guard is registered globally, so routes are private unless they say
 * otherwise. Forgetting this decorator makes an endpoint unreachable, which is
 * a loud failure; forgetting the opposite convention would silently expose one.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
