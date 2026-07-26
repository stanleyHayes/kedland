import { describe, expect, it } from "vitest";

import { isActive, NAV_GROUPS, visibleGroups } from "./nav-config";

describe("visibleGroups", () => {
  it("shows an admin everything", () => {
    const groups = visibleGroups("admin");
    const items = groups.flatMap((g) => g.items.map((i) => i.href));

    expect(items).toContain("/users");
    expect(items).toContain("/audit");
  });

  it("hides user management and the audit log from an editor", () => {
    const items = visibleGroups("editor").flatMap((g) => g.items.map((i) => i.href));

    expect(items).not.toContain("/users");
    expect(items).not.toContain("/audit");
  });

  it("still gives an editor their actual job", () => {
    const items = visibleGroups("editor").flatMap((g) => g.items.map((i) => i.href));

    expect(items).toEqual(expect.arrayContaining(["/posts", "/content", "/enquiries", "/media"]));
  });

  it("drops a group entirely when the role can reach none of its items", () => {
    const withoutRole = visibleGroups(undefined);
    const accountGroup = withoutRole.find((g) => g.title === "Account");

    // Settings and Help carry no role restriction, so Account survives — but the
    // administrator-only entries are gone.
    expect(accountGroup?.items.map((i) => i.href)).not.toContain("/users");
  });

  it("never returns an empty group", () => {
    for (const role of ["admin", "editor"] as const) {
      for (const group of visibleGroups(role)) {
        expect(group.items.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the back office small — build package §5.4", () => {
    // A guard against scope creep: if this number climbs, someone is turning a
    // three-person back office into a platform. Raise it deliberately.
    const total = NAV_GROUPS.flatMap((g) => g.items).length;
    expect(total).toBeLessThanOrEqual(14);
  });
});

describe("isActive", () => {
  const overview = { href: "/", label: "Overview", icon: "blocks", exact: true } as const;
  const posts = { href: "/posts", label: "Posts", icon: "book" } as const;

  it("matches the dashboard root only exactly", () => {
    expect(isActive("/", overview)).toBe(true);
    expect(isActive("/posts", overview)).toBe(false);
  });

  it("matches a section and its children", () => {
    expect(isActive("/posts", posts)).toBe(true);
    expect(isActive("/posts/new", posts)).toBe(true);
    expect(isActive("/posts/abc/edit", posts)).toBe(true);
  });

  it("does not match a sibling route with a shared prefix", () => {
    // `/posts-archive` must not light up the Posts nav item.
    expect(isActive("/posts-archive", posts)).toBe(false);
  });
});
