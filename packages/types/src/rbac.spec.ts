import { describe, expect, it } from "vitest";

import {
  ACTIONS,
  ALL_PERMISSIONS,
  can,
  canSee,
  hasImpliedReads,
  parsePermission,
  permissionsSchema,
  RESOURCES,
  roleInputSchema,
  roleSlugSchema,
  SYSTEM_ROLES,
  withImpliedReads,
} from "./rbac";

describe("the permission vocabulary", () => {
  it("covers every resource and action", () => {
    expect(ALL_PERMISSIONS).toHaveLength(RESOURCES.length * ACTIONS.length);
  });

  it("parses a well-formed permission", () => {
    expect(parsePermission("posts:create")).toEqual({ resource: "posts", action: "create" });
  });

  it.each(["posts", "posts:", ":read", "nonsense:read", "posts:publish", "posts:read:extra", ""])(
    "refuses %s",
    (value) => {
      expect(parsePermission(value)).toBeNull();
    },
  );
});

/**
 * The rule that shapes everything else: writing implies reading.
 *
 * `posts:create` without `posts:read` is not a coherent state — the holder
 * could create a post and then not be able to see it, and every surface would
 * have to decide what to do about that. There is exactly one sensible
 * completion, so the model completes it rather than rejecting it and making
 * somebody tick a box they cannot see the point of.
 */
describe("withImpliedReads", () => {
  it.each(["create", "update", "delete"] as const)("adds the read that %s implies", (action) => {
    expect(withImpliedReads([`posts:${action}`])).toContain("posts:read");
  });

  it("leaves a read alone", () => {
    expect(withImpliedReads(["posts:read"])).toEqual(["posts:read"]);
  });

  it("only implies a read on the same resource", () => {
    // Being able to delete a post says nothing about seeing staff accounts.
    expect(withImpliedReads(["posts:delete"])).not.toContain("users:read");
  });

  it("de-duplicates", () => {
    expect(withImpliedReads(["posts:read", "posts:read", "posts:create"])).toEqual([
      "posts:create",
      "posts:read",
    ]);
  });

  it("sorts, so an equivalent set is an equal array", () => {
    // Otherwise ticking the same boxes in a different order writes a different
    // document and shows up in the audit trail as a change.
    expect(withImpliedReads(["posts:update", "media:read"])).toEqual(
      withImpliedReads(["media:read", "posts:update"]),
    );
  });

  it("drops anything it does not recognise rather than storing it", () => {
    expect(withImpliedReads(["posts:read", "made:up"])).toEqual(["posts:read"]);
  });

  it("is idempotent", () => {
    const once = withImpliedReads(["posts:delete", "users:update"]);
    expect(withImpliedReads(once)).toEqual(once);
  });
});

describe("hasImpliedReads", () => {
  it("accepts a completed set", () => {
    expect(hasImpliedReads(["posts:read", "posts:create"])).toBe(true);
  });

  it("rejects a write with no read — a set that bypassed the model", () => {
    expect(hasImpliedReads(["posts:create"])).toBe(false);
  });
});

describe("can", () => {
  const permissions = ["posts:read", "posts:create"];

  it("allows what was granted", () => {
    expect(can(permissions, "posts", "create")).toBe(true);
  });

  it("refuses what was not", () => {
    expect(can(permissions, "posts", "delete")).toBe(false);
    expect(can(permissions, "users", "read")).toBe(false);
  });

  /**
   * The direction of failure that matters. Everything in the dashboard is
   * hidden or shown by this function, so an absent list must mean "nothing",
   * never "everything".
   */
  it("refuses everything when the list is missing", () => {
    expect(can(undefined, "posts", "read")).toBe(false);
    expect(can([], "posts", "read")).toBe(false);
  });

  it("canSee is read access — whether the route renders at all", () => {
    expect(canSee(permissions, "posts")).toBe(true);
    expect(canSee(permissions, "users")).toBe(false);
  });
});

describe("permissionsSchema", () => {
  it("completes implied reads on the way in", () => {
    expect(permissionsSchema.parse(["posts:delete"])).toEqual(["posts:delete", "posts:read"]);
  });

  it("refuses a permission that does not exist", () => {
    expect(permissionsSchema.safeParse(["posts:publish"]).success).toBe(false);
  });

  it("accepts an empty list — a role that grants nothing is valid", () => {
    expect(permissionsSchema.parse([])).toEqual([]);
  });
});

describe("roleInputSchema", () => {
  it("accepts a role", () => {
    expect(
      roleInputSchema.safeParse({ name: "Front office", permissions: ["enquiries:update"] }).success,
    ).toBe(true);
  });

  it("completes the permissions it is given", () => {
    const parsed = roleInputSchema.parse({ name: "Front office", permissions: ["enquiries:update"] });
    expect(parsed.permissions).toContain("enquiries:read");
  });

  it("requires a name", () => {
    expect(roleInputSchema.safeParse({ name: "  ", permissions: [] }).success).toBe(false);
  });

  it("refuses a field the contract does not declare", () => {
    expect(roleInputSchema.safeParse({ name: "Sneaky", permissions: [], isSystem: true }).success).toBe(
      false,
    );
  });
});

describe("roleSlugSchema", () => {
  it.each(["administrator", "front-office"])("accepts %s", (slug) => {
    expect(roleSlugSchema.safeParse(slug).success).toBe(true);
  });

  it.each(["Administrator", "front office", "-leading", "trailing-", ""])("rejects %s", (slug) => {
    expect(roleSlugSchema.safeParse(slug).success).toBe(false);
  });
});

describe("the roles the school starts with", () => {
  it("gives the administrator everything", () => {
    const admin = SYSTEM_ROLES.find((role) => role.slug === "administrator");
    expect(admin?.permissions).toHaveLength(ALL_PERMISSIONS.length);
  });

  it("every seeded role is internally coherent", () => {
    for (const role of SYSTEM_ROLES) {
      expect(hasImpliedReads(role.permissions)).toBe(true);
    }
  });

  /**
   * Deleting is the one dashboard action with no undo, and editing is the
   * school's daily work — so an editor gets the latter and not the former.
   */
  it("lets an editor publish but not delete", () => {
    const editor = SYSTEM_ROLES.find((role) => role.slug === "editor");

    expect(can(editor?.permissions, "posts", "update")).toBe(true);
    expect(can(editor?.permissions, "posts", "delete")).toBe(false);
  });

  it("keeps staff accounts, roles and settings to the administrator", () => {
    const editor = SYSTEM_ROLES.find((role) => role.slug === "editor");

    for (const resource of ["users", "roles", "settings", "audit"] as const) {
      expect(canSee(editor?.permissions, resource)).toBe(false);
    }
  });

  it("gives an organisation reading and nothing else", () => {
    const organisation = SYSTEM_ROLES.find((role) => role.slug === "organisation");

    for (const permission of organisation?.permissions ?? []) {
      expect(permission.endsWith(":read")).toBe(true);
    }
  });

  it("has a unique slug per role", () => {
    const slugs = SYSTEM_ROLES.map((role) => role.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
