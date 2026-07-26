import { type ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { extractBearerToken, isIssuedBefore, JwtAuthGuard } from "./jwt-auth.guard";
import { PermissionsGuard } from "./permissions.guard";

import type { UserDocument } from "../../modules/users/schemas/user.schema";
import type { UsersService } from "../../modules/users/users.service";

interface RequestShape {
  headers: { authorization?: string };
  user?: unknown;
}

/** Stand-ins for the route handler and controller the Reflector reads from. */
function noop(): void {
  /* a route handler with no metadata on it */
}
class FakeController {
  handle(): void {
    /* the controller the Reflector reads class-level metadata from */
  }
}

function contextFor(request: RequestShape): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => noop,
    getClass: () => FakeController,
  } as unknown as ExecutionContext;
}

const USER_ID = "507f1f77bcf86cd799439011";

/** Only the fields the guard reads. */
function accountLike(overrides: Partial<Record<string, unknown>> = {}): UserDocument {
  return {
    id: USER_ID,
    email: "a@b.c",
    roleSlug: "editor",
    permissions: ["posts:read", "posts:update"],
    status: "active",
    passwordChangedAt: null,
    permissionsChangedAt: null,
    ...overrides,
  } as unknown as UserDocument;
}

describe("JwtAuthGuard", () => {
  const secret = "test-access-secret-long-enough-for-the-schema";
  let guard: JwtAuthGuard;
  let jwt: JwtService;
  let reflector: Reflector;
  let findById: jest.Mock;

  beforeEach(() => {
    jwt = new JwtService({});
    reflector = new Reflector();
    const config = { getOrThrow: () => secret } as unknown as ConfigService;
    findById = jest.fn().mockResolvedValue(accountLike());
    const users = { findById } as unknown as UsersService;
    guard = new JwtAuthGuard(reflector, jwt, config, users);
  });

  const tokenFor = async (claims: Record<string, unknown> = {}, options: Record<string, unknown> = {}) =>
    jwt.signAsync({ sub: USER_ID, email: "a@b.c", ...claims }, { secret, ...options });

  it("lets a public route through with no token at all", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    await expect(guard.canActivate(contextFor({ headers: {} }))).resolves.toBe(true);
  });

  /** The whole point of reading the account: a public request costs no query. */
  it("does not touch the database for a public route", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    await guard.canActivate(contextFor({ headers: {} }));

    expect(findById).not.toHaveBeenCalled();
  });

  it("refuses a private route with no token", async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("accepts a valid token and attaches the account's current permissions", async () => {
    const request: RequestShape = { headers: { authorization: `Bearer ${await tokenFor()}` } };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toEqual({
      id: USER_ID,
      email: "a@b.c",
      roleSlug: "editor",
      permissions: ["posts:read", "posts:update"],
    });
  });

  /**
   * The permissions come from the account, not the token. A token minted while
   * the holder was an administrator must not still act like one.
   */
  it("ignores any permissions a token claims to carry", async () => {
    const token = await tokenFor({ permissions: ["users:delete", "roles:update"] });
    const request: RequestShape = { headers: { authorization: `Bearer ${token}` } };

    await guard.canActivate(contextFor(request));

    expect(request.user).toMatchObject({ permissions: ["posts:read", "posts:update"] });
  });

  it("completes an implied read missing from a stored list", async () => {
    // A list written by an older build, or by hand. Refusing the request the
    // holder is plainly entitled to make would be the wrong failure.
    findById.mockResolvedValue(accountLike({ permissions: ["posts:update"] }));
    const request: RequestShape = { headers: { authorization: `Bearer ${await tokenFor()}` } };

    await guard.canActivate(contextFor(request));

    expect(request.user).toMatchObject({ permissions: ["posts:read", "posts:update"] });
  });

  it("refuses a token for an account that has been deleted", async () => {
    findById.mockResolvedValue(null);

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${await tokenFor()}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refuses a token for a suspended account", async () => {
    findById.mockResolvedValue(accountLike({ status: "suspended" }));

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${await tokenFor()}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  /**
   * This is what `passwordChangedAt` was documented to do and did not. A
   * password changed after a suspected compromise has to end the sessions the
   * other party is holding.
   */
  it("refuses a token minted before the password changed", async () => {
    const token = await tokenFor();
    findById.mockResolvedValue(accountLike({ passwordChangedAt: new Date(Date.now() + 60_000) }));

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refuses a token minted before the permissions changed", async () => {
    const token = await tokenFor();
    findById.mockResolvedValue(accountLike({ permissionsChangedAt: new Date(Date.now() + 60_000) }));

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("keeps a token minted after the change", async () => {
    const token = await tokenFor();
    findById.mockResolvedValue(accountLike({ permissionsChangedAt: new Date(Date.now() - 60_000) }));

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).resolves.toBe(true);
  });

  it("refuses a token signed with a different key", async () => {
    const token = await jwt.signAsync({ sub: "1", email: "a@b.c" }, { secret: "another-secret-entirely-x" });

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refuses an expired token", async () => {
    const token = await tokenFor({}, { expiresIn: "-1s" });

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("gives the same message whether the token is bad or expired", async () => {
    const expired = await tokenFor({}, { expiresIn: "-1s" });
    const wrongKey = await jwt.signAsync({ sub: "1", email: "a@b.c" }, { secret: "different-secret-here" });

    const messages = await Promise.all(
      [expired, wrongKey].map(async (token) =>
        guard
          .canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } }))
          .catch((error: unknown) => (error as Error).message),
      ),
    );

    // Telling them apart would only help someone probing the API.
    expect(messages[0]).toBe(messages[1]);
  });

  /** A suspended account and a deleted one must not be distinguishable. */
  it("gives the same message for a suspended account as for a deleted one", async () => {
    const token = await tokenFor();
    const messageFor = async (account: UserDocument | null): Promise<string> => {
      findById.mockResolvedValue(account);
      return guard
        .canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } }))
        .then(() => "allowed")
        .catch((error: unknown) => (error as Error).message);
    };

    expect(await messageFor(null)).toBe(await messageFor(accountLike({ status: "suspended" })));
  });
});

describe("isIssuedBefore", () => {
  it("treats a null change timestamp as nothing to compare against", () => {
    expect(isIssuedBefore(1_700_000_000, null)).toBe(false);
  });

  /**
   * The floor-to-seconds case. `iat` is whole seconds and the timestamp is
   * milliseconds, so without flooring a token minted in the same second as the
   * change looks up to 999ms older than it — and the holder is signed out of the
   * session they just started, which is exactly the "change your own password"
   * path.
   */
  it("keeps a token minted in the same second as the change", () => {
    const changedAt = new Date(1_700_000_000_750);

    expect(isIssuedBefore(1_700_000_000, changedAt)).toBe(false);
  });

  it("rejects a token from the second before", () => {
    expect(isIssuedBefore(1_699_999_999, new Date(1_700_000_000_000))).toBe(true);
  });

  /** Every token this API signs has an `iat`; one without cannot be shown current. */
  it("rejects a token with no issued-at claim", () => {
    expect(isIssuedBefore(undefined, new Date(1_700_000_000_000))).toBe(true);
  });
});

describe("PermissionsGuard", () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const requiring = (resource: string, action: string): void => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue({ resource, action });
  };

  it("allows a route with no permission requirement", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    expect(guard.canActivate(contextFor({ headers: {} }))).toBe(true);
  });

  it("allows a user holding the required permission", () => {
    requiring("posts", "update");
    const request = { headers: {}, user: { id: "1", permissions: ["posts:read", "posts:update"] } };

    expect(guard.canActivate(contextFor(request))).toBe(true);
  });

  it("refuses a user without it", () => {
    requiring("posts", "delete");
    const request = { headers: {}, user: { id: "1", permissions: ["posts:read", "posts:update"] } };

    expect(() => guard.canActivate(contextFor(request))).toThrow(ForbiddenException);
  });

  /**
   * Reading a resource does not imply writing it. The implication runs one way
   * only — writes imply reads — and a guard that had it backwards would be the
   * most consequential possible bug in this file.
   */
  it("does not let a read permission satisfy a write requirement", () => {
    requiring("posts", "create");
    const request = { headers: {}, user: { id: "1", permissions: ["posts:read"] } };

    expect(() => guard.canActivate(contextFor(request))).toThrow(ForbiddenException);
  });

  it("refuses a user with no permissions at all", () => {
    requiring("posts", "read");
    expect(() => guard.canActivate(contextFor({ headers: {}, user: { id: "1", permissions: [] } }))).toThrow(
      ForbiddenException,
    );
  });

  it("refuses when there is no user on the request", () => {
    requiring("posts", "read");
    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(ForbiddenException);
  });

  it("says which permission is missing, so an administrator can grant it", () => {
    requiring("enquiries", "delete");
    const request = { headers: {}, user: { id: "1", permissions: [] } };

    expect(() => guard.canActivate(contextFor(request))).toThrow(/delete enquiries/);
  });
});

describe("extractBearerToken", () => {
  it("reads a bearer token", () => {
    expect(extractBearerToken("Bearer abc123")).toBe("abc123");
  });

  it("is case-insensitive about the scheme", () => {
    expect(extractBearerToken("bearer abc123")).toBe("abc123");
  });

  it("rejects another scheme", () => {
    expect(extractBearerToken("Basic abc123")).toBeNull();
  });

  it("rejects a missing header", () => {
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it("rejects a scheme with no token", () => {
    expect(extractBearerToken("Bearer")).toBeNull();
    expect(extractBearerToken("Bearer ")).toBeNull();
  });
});
