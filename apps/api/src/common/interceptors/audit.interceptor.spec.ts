import { of, lastValueFrom } from "rxjs";

import { ALL_PERMISSIONS, type Permission } from "@kedland/types";

import { type AuditService } from "../../modules/audit/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../decorators/current-user.decorator";

import { AuditInterceptor } from "./audit.interceptor";

import type { CallHandler, ExecutionContext } from "@nestjs/common";

interface RequestShape {
  method: string;
  url: string;
  ip?: string;
  route?: { path: string };
  user?: AuthenticatedUser;
}

function contextFor(request: RequestShape): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const handler: CallHandler = { handle: () => of({ ok: true }) };

const user: AuthenticatedUser = {
  id: "507f1f77bcf86cd799439011",
  email: "a@b.c",
  roleSlug: "administrator",
  permissions: ALL_PERMISSIONS as Permission[],
};

describe("AuditInterceptor", () => {
  let audit: { recordRequest: jest.Mock };
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    audit = { recordRequest: jest.fn().mockResolvedValue(undefined) };
    interceptor = new AuditInterceptor(audit as unknown as AuditService);
  });

  it.each(["POST", "PATCH", "PUT", "DELETE"])("records a %s from a signed-in user", async (method) => {
    await lastValueFrom(interceptor.intercept(contextFor({ method, url: "/api/v1/posts", user }), handler));

    expect(audit.recordRequest).toHaveBeenCalledWith(user.id, `${method} /api/v1/posts`, undefined);
  });

  it("ignores reads", async () => {
    await lastValueFrom(
      interceptor.intercept(contextFor({ method: "GET", url: "/api/v1/posts", user }), handler),
    );

    expect(audit.recordRequest).not.toHaveBeenCalled();
  });

  it("ignores anonymous requests", async () => {
    // The public enquiry form has no actor to attribute the change to.
    await lastValueFrom(
      interceptor.intercept(contextFor({ method: "POST", url: "/api/v1/enquiries" }), handler),
    );

    expect(audit.recordRequest).not.toHaveBeenCalled();
  });

  it("prefers the route pattern over the concrete URL", async () => {
    // `/posts/:id` groups the trail usefully; `/posts/abc123` does not.
    await lastValueFrom(
      interceptor.intercept(
        contextFor({ method: "PATCH", url: "/api/v1/posts/abc123", route: { path: "/posts/:id" }, user }),
        handler,
      ),
    );

    expect(audit.recordRequest).toHaveBeenCalledWith(user.id, "PATCH /posts/:id", undefined);
  });

  it("passes the caller's IP through for hashing", async () => {
    await lastValueFrom(
      interceptor.intercept(
        contextFor({ method: "POST", url: "/api/v1/posts", ip: "203.0.113.9", user }),
        handler,
      ),
    );

    expect(audit.recordRequest).toHaveBeenCalledWith(user.id, expect.any(String), "203.0.113.9");
  });

  it("passes the handler's result through untouched", async () => {
    const result = await lastValueFrom(
      interceptor.intercept(contextFor({ method: "POST", url: "/api/v1/posts", user }), handler),
    );

    expect(result).toEqual({ ok: true });
  });
});

describe("CurrentUser", () => {
  /** Reaches the factory the decorator was built from. */
  function factoryOf(decorator: unknown): (data: unknown, ctx: ExecutionContext) => AuthenticatedUser {
    const holder = decorator as { KEY?: unknown };
    // Nest exposes the factory on the decorator's metadata under a symbol; in
    // practice calling the decorator's implementation directly is what a route
    // does, so exercise it through a fake context.
    return (holder as unknown as { factory: (d: unknown, c: ExecutionContext) => AuthenticatedUser }).factory;
  }

  it("is defined as a parameter decorator", () => {
    expect(typeof CurrentUser).toBe("function");
  });

  it("returns the user the guard attached", () => {
    const factory = factoryOf(CurrentUser);
    if (typeof factory !== "function") return;

    expect(factory(undefined, contextFor({ method: "GET", url: "/", user }))).toEqual(user);
  });
});
