import { type ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { extractBearerToken, JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";

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

describe("extractBearerToken", () => {
  it("reads a well-formed header", () => {
    expect(extractBearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("accepts any casing of the scheme", () => {
    expect(extractBearerToken("bearer abc")).toBe("abc");
    expect(extractBearerToken("BEARER abc")).toBe("abc");
  });

  it("rejects a missing header", () => {
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it("rejects another scheme", () => {
    expect(extractBearerToken("Basic dXNlcjpwYXNz")).toBeNull();
  });

  it("rejects a scheme with no token", () => {
    expect(extractBearerToken("Bearer")).toBeNull();
    expect(extractBearerToken("Bearer ")).toBeNull();
  });
});

describe("JwtAuthGuard", () => {
  const secret = "test-access-secret-long-enough-for-the-schema";
  let guard: JwtAuthGuard;
  let jwt: JwtService;
  let reflector: Reflector;

  beforeEach(() => {
    jwt = new JwtService({});
    reflector = new Reflector();
    const config = { getOrThrow: () => secret } as unknown as ConfigService;
    guard = new JwtAuthGuard(reflector, jwt, config);
  });

  it("lets a public route through with no token at all", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    await expect(guard.canActivate(contextFor({ headers: {} }))).resolves.toBe(true);
  });

  it("refuses a private route with no token", async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("accepts a valid token and attaches the user", async () => {
    const token = await jwt.signAsync(
      { sub: "507f1f77bcf86cd799439011", email: "a@b.c", role: "admin" },
      { secret },
    );
    const request: RequestShape = { headers: { authorization: `Bearer ${token}` } };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: "507f1f77bcf86cd799439011", email: "a@b.c", role: "admin" });
  });

  it("refuses a token signed with a different key", async () => {
    const token = await jwt.signAsync(
      { sub: "1", email: "a@b.c", role: "admin" },
      { secret: "another-secret-entirely-x" },
    );

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refuses an expired token", async () => {
    const token = await jwt.signAsync(
      { sub: "1", email: "a@b.c", role: "admin" },
      { secret, expiresIn: "-1s" },
    );

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refuses a token carrying a role we do not recognise", async () => {
    // A token minted before a role was removed, or one that has been tampered
    // with, must not be treated as if it carried a valid role.
    const token = await jwt.signAsync({ sub: "1", email: "a@b.c", role: "superuser" }, { secret });

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("gives the same message whether the token is bad or expired", async () => {
    const expired = await jwt.signAsync(
      { sub: "1", email: "a@b.c", role: "admin" },
      { secret, expiresIn: "-1s" },
    );
    const wrongKey = await jwt.signAsync(
      { sub: "1", email: "a@b.c", role: "admin" },
      { secret: "different-secret-value-here" },
    );

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
});

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it("allows a route with no role requirement", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    expect(guard.canActivate(contextFor({ headers: {} }))).toBe(true);
  });

  it("allows a route whose requirement list is empty", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([]);
    expect(guard.canActivate(contextFor({ headers: {} }))).toBe(true);
  });

  it("allows a user holding a required role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"]);
    const request = { headers: {}, user: { id: "1", email: "a@b.c", role: "admin" } };

    expect(guard.canActivate(contextFor(request))).toBe(true);
  });

  it("refuses a user without it", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"]);
    const request = { headers: {}, user: { id: "1", email: "a@b.c", role: "editor" } };

    expect(() => guard.canActivate(contextFor(request))).toThrow(ForbiddenException);
  });

  it("refuses when there is no user on the request", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"]);
    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(ForbiddenException);
  });
});
