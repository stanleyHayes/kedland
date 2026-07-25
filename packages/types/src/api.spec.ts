import { describe, expect, it } from "vitest";

import { paginate, paginationQuerySchema } from "./api";

describe("paginationQuerySchema", () => {
  it("applies the defaults a bare list request implies", () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 12 });
  });

  it("coerces the query-string values, which arrive as text", () => {
    expect(paginationQuerySchema.parse({ page: "3", pageSize: "24" })).toEqual({
      page: 3,
      pageSize: 24,
    });
  });

  it("rejects a page below one", () => {
    expect(paginationQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ page: "-1" }).success).toBe(false);
  });

  it("caps pageSize so a request cannot ask for the whole collection", () => {
    expect(paginationQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: "100" }).success).toBe(true);
  });

  it("rejects a fractional page", () => {
    expect(paginationQuerySchema.safeParse({ page: "1.5" }).success).toBe(false);
  });
});

describe("paginate", () => {
  const items = ["a", "b", "c"];

  it("wraps the items with their position in the whole set", () => {
    expect(paginate(items, 30, 2, 10)).toEqual({
      items,
      total: 30,
      page: 2,
      pageSize: 10,
      totalPages: 3,
    });
  });

  it("rounds a partial last page up", () => {
    expect(paginate(items, 31, 1, 10).totalPages).toBe(4);
  });

  it("reports one page when everything fits", () => {
    expect(paginate(items, 3, 1, 12).totalPages).toBe(1);
  });

  it("reports zero pages for an empty collection", () => {
    // The news list before the school's first post — a real state, and the
    // public page shows its own empty message for it.
    expect(paginate([], 0, 1, 12).totalPages).toBe(0);
  });

  it("does not divide by zero when pageSize is zero", () => {
    expect(paginate([], 10, 1, 0).totalPages).toBe(0);
  });

  it("preserves the item type", () => {
    const posts = [{ slug: "welcome" }];
    const result = paginate(posts, 1, 1, 12);
    expect(result.items[0]?.slug).toBe("welcome");
  });
});
