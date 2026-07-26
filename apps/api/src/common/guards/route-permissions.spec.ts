import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";

import { AuditController } from "../../modules/audit/audit.controller";
import { AuthController } from "../../modules/auth/auth.controller";
import { AdminContentController, ContentController } from "../../modules/content/content.controller";
import { AdminEnquiriesController, EnquiriesController } from "../../modules/enquiries/enquiries.controller";
import { AdminFaqsController, PublicFaqsController } from "../../modules/faqs/faqs.controller";
import { HealthController } from "../../modules/health/health.controller";
import {
  AdminInstagramController,
  PublicInstagramController,
} from "../../modules/instagram/instagram.controller";
import { MediaController, PublicMediaController } from "../../modules/media/media.controller";
import { AdminPostsController, PostsController } from "../../modules/posts/posts.controller";
import { RolesController } from "../../modules/roles/roles.controller";
import {
  AdminSettingsController,
  PublicSettingsController,
} from "../../modules/settings/settings.controller";
import { UsersController } from "../../modules/users/users.controller";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { PERMISSION_KEY, type RequiredPermission } from "../decorators/require-permission.decorator";

/**
 * Every route that changes something declares a permission.
 *
 * `PermissionsGuard` treats a route with no `@RequirePermission` as open to any
 * signed-in member of staff, which is the right default for reading the
 * school's own content but is emphatically wrong for a write. The guard cannot
 * tell the difference between "deliberately unguarded" and "somebody forgot",
 * so this test does — at build time, across every controller, rather than after
 * the fact in production.
 *
 * The list below has to be complete, and the last test in this file is what
 * makes that true: it reads every `*.controller.ts` on disk and fails if one
 * exports a controller the list does not import. Without that check, adding a
 * controller and forgetting to register it here would make this whole file pass
 * vacuously for exactly the new code most likely to need it.
 */

/** Nest's `RequestMethod` enum, by the numbers it actually stores. */
const MUTATING_METHODS = new Set([1, 2, 3, 4, 5]); // POST, PUT, DELETE, PATCH, ALL
const METHOD_NAMES: Record<number, string> = {
  0: "GET",
  1: "POST",
  2: "PUT",
  3: "DELETE",
  4: "PATCH",
  5: "ALL",
};

const CONTROLLERS = [
  AuthController,
  AuditController,
  ContentController,
  AdminContentController,
  EnquiriesController,
  AdminEnquiriesController,
  HealthController,
  PublicFaqsController,
  AdminFaqsController,
  PublicInstagramController,
  AdminInstagramController,
  PublicMediaController,
  MediaController,
  PostsController,
  AdminPostsController,
  RolesController,
  PublicSettingsController,
  AdminSettingsController,
  UsersController,
];

interface RouteInfo {
  controller: string;
  handler: string;
  method: string;
  path: string;
  isPublic: boolean;
  permission: RequiredPermission | undefined;
  mutating: boolean;
}

function routesOf(controller: (new (...args: never[]) => unknown) & { name: string }): RouteInfo[] {
  const prototype = controller.prototype as Record<string, unknown>;
  const classPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller) === true;

  return Object.getOwnPropertyNames(prototype)
    .filter((name) => name !== "constructor" && typeof prototype[name] === "function")
    .map((name) => {
      const handler = prototype[name] as object;
      const method = Reflect.getMetadata(METHOD_METADATA, handler) as number | undefined;

      return {
        controller: controller.name,
        handler: name,
        method: METHOD_NAMES[method ?? 0] ?? String(method),
        path: String(Reflect.getMetadata(PATH_METADATA, handler) ?? ""),
        // A handler may be public in its own right or by its controller being so.
        isPublic: classPublic || Reflect.getMetadata(IS_PUBLIC_KEY, handler) === true,
        permission: Reflect.getMetadata(PERMISSION_KEY, handler) as RequiredPermission | undefined,
        mutating: MUTATING_METHODS.has(method ?? 0),
      };
    })
    .filter((route) => route.method !== "undefined");
}

const ALL_ROUTES = CONTROLLERS.flatMap((controller) => routesOf(controller));

/**
 * Routes anyone may call, signed in or not.
 *
 * Each is here because the caller cannot hold a permission at the time they call
 * it: they are signing in, or proving they own an email address, or they are a
 * parent using the contact form. Every one is rate-limited, and the contact form
 * additionally sits behind Turnstile. Adding to this list should feel
 * uncomfortable.
 */
const PUBLIC_BY_DESIGN = new Set([
  "AuthController.login",
  "AuthController.refresh",
  "AuthController.logout",
  "AuthController.forgotPassword",
  "AuthController.resetPassword",
  "EnquiriesController.submit",
]);

/**
 * Routes that require a signed-in caller but no particular permission.
 *
 * A different category from the above, and the distinction is the point: these
 * are things every account may do *about itself*. Gating them by permission
 * would mean an account with none could not learn who it is or change its own
 * password — locked out of the dashboard by the permission system rather than by
 * a decision anyone made.
 */
const SELF_SERVICE = new Set([
  // Authorised by the current password, which is the stronger check anyway.
  "AuthController.changePassword",
  "AuthController.me",
  "AuthController.updateProfile",
  "AuthController.logoutAll",
]);

const UNGATED = new Set([...PUBLIC_BY_DESIGN, ...SELF_SERVICE]);

describe("route permissions", () => {
  it("finds routes to check, so a broken reflection does not pass silently", () => {
    // Without this, a change to Nest's metadata keys would empty the list and
    // every assertion below would trivially pass.
    expect(ALL_ROUTES.length).toBeGreaterThan(25);
    expect(ALL_ROUTES.filter((route) => route.mutating).length).toBeGreaterThan(10);
  });

  it("gates every mutating route", () => {
    const ungated = ALL_ROUTES.filter(
      (route) =>
        route.mutating &&
        route.permission === undefined &&
        !UNGATED.has(`${route.controller}.${route.handler}`),
    ).map((route) => `${route.controller}.${route.handler} (${route.method} ${route.path})`);

    expect(ungated).toEqual([]);
  });

  it("gates every route on the admin surface, reads included", () => {
    // An admin route with no permission is readable by anyone signed in, which
    // defeats "if they cannot read it, do not show it".
    const ungated = ALL_ROUTES.filter(
      (route) =>
        !route.isPublic &&
        route.permission === undefined &&
        !UNGATED.has(`${route.controller}.${route.handler}`),
    ).map((route) => `${route.controller}.${route.handler} (${route.method} ${route.path})`);

    expect(ungated).toEqual([]);
  });

  it("never asks for a write permission on a plain read", () => {
    const wrong = ALL_ROUTES.filter(
      (route) => !route.mutating && route.permission !== undefined && route.permission.action !== "read",
    ).map((route) => `${route.controller}.${route.handler} wants ${route.permission?.action ?? "?"}`);

    // A GET that demanded `update` would hide a page from someone entitled to
    // see it — the failure mode that looks like a bug in the dashboard.
    expect(wrong).toEqual([]);
  });

  it("never asks for a read permission on a route that changes something", () => {
    const wrong = ALL_ROUTES.filter((route) => route.mutating && route.permission?.action === "read").map(
      (route) => `${route.controller}.${route.handler}`,
    );

    // The direction that actually matters: a write gated only by `read` is a
    // write available to every reader.
    expect(wrong).toEqual([]);
  });

  it("keeps the exemption lists honest", () => {
    // An entry that no longer matches a real route is stale, and a stale
    // exemption is how a real one gets waved through later — a renamed handler
    // silently loses its gate while the list still looks accounted for. This is
    // exactly what happened when the list said `EnquiriesController.create` and
    // the handler was called `submit`.
    const known = new Set(ALL_ROUTES.map((route) => `${route.controller}.${route.handler}`));
    const stale = [...UNGATED].filter((entry) => !known.has(entry));

    expect(stale).toEqual([]);
  });

  it("keeps the public routes actually public", () => {
    const routes = ALL_ROUTES.filter((route) => PUBLIC_BY_DESIGN.has(`${route.controller}.${route.handler}`));

    expect(routes).not.toHaveLength(0);
    for (const route of routes) {
      expect(route.isPublic).toBe(true);
    }
  });

  /** The distinction between the two lists has to be real, not decorative. */
  it("keeps the self-service routes behind authentication", () => {
    const routes = ALL_ROUTES.filter((route) => SELF_SERVICE.has(`${route.controller}.${route.handler}`));

    expect(routes).not.toHaveLength(0);
    for (const route of routes) {
      expect(route.isPublic).toBe(false);
    }
  });

  /**
   * The list of controllers above is complete.
   *
   * Everything else in this file checks the controllers it was given, so a
   * controller nobody registered here is a controller nobody checks — and it
   * would pass silently, for exactly the new code most likely to have a missing
   * decorator. This reads the module directory instead of trusting the list.
   */
  it("checks every controller the API actually has", () => {
    const modulesDir = join(__dirname, "..", "..", "modules");

    const declared = readdirSync(modulesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const dir = join(modulesDir, entry.name);
        return readdirSync(dir)
          .filter((file) => file.endsWith(".controller.ts"))
          .flatMap((file) =>
            [...readFileSync(join(dir, file), "utf8").matchAll(/export class (\w*Controller)\b/g)].map(
              (match) => match[1],
            ),
          );
      });

    // Guards against the glob silently matching nothing.
    expect(declared.length).toBeGreaterThan(5);

    const checked = new Set(CONTROLLERS.map((controller) => controller.name));
    const unchecked = declared.filter((name) => !checked.has(name!));

    expect(unchecked).toEqual([]);
  });
});
