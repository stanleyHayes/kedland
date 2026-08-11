import { afterEach, describe, expect, it, vi } from "vitest";

import { findSection, getGalleryTiles, getPageSections, pageTag, type Section } from "./api";

const SECTIONS: Section[] = [
  { key: "hero", type: "hero", order: 0, data: { heading: "Hello" } },
  { key: "welcome", type: "prose-strip", order: 1, data: {} },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pageTag", () => {
  it("namespaces the tag so a purge cannot collide with another cache", () => {
    expect(pageTag("home")).toBe("content:home");
  });

  it("keeps nested page keys distinct", () => {
    expect(pageTag("about/our-story")).not.toBe(pageTag("about"));
  });
});

describe("findSection", () => {
  it("finds a section by key", () => {
    expect(findSection(SECTIONS, "welcome")?.type).toBe("prose-strip");
  });

  it("returns undefined for a key that is not there", () => {
    expect(findSection(SECTIONS, "nope")).toBeUndefined();
  });
});

describe("getPageSections", () => {
  it("returns the sections the API sent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(SECTIONS) }));

    await expect(getPageSections("home")).resolves.toEqual(SECTIONS);
  });

  it("tags the request so publishing can purge exactly this page", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchMock);

    await getPageSections("admissions");

    const init = fetchMock.mock.calls[0]?.[1] as { next: { tags: string[] } };
    expect(init.next.tags).toEqual(["content:admissions"]);
  });

  it("sets a deadline, so an unreachable API cannot stall the build", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchMock);

    await getPageSections("home");

    const init = fetchMock.mock.calls[0]?.[1] as { signal?: AbortSignal };
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("encodes a nested page key into the query string", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchMock);

    await getPageSections("about/our-story");

    expect(fetchMock.mock.calls[0]?.[0]).toContain("about%2Four-story");
  });

  it("returns nothing rather than throwing when the API answers with an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve([]) }));

    await expect(getPageSections("home")).resolves.toEqual([]);
  });

  it("returns nothing rather than throwing when the API is unreachable", async () => {
    // A page rendering its shell is a bad day; a 500 shown to a prospective
    // parent is a worse one, and the header and phone numbers still work.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    await expect(getPageSections("home")).resolves.toEqual([]);
  });
});

/**
 * A deleted photograph has to actually disappear.
 *
 * The gallery used to fall back to bundled starter images whenever the tile
 * list was empty — and an empty list is exactly what the API returns once the
 * school has deleted every photograph. So clearing the gallery in the dashboard
 * changed nothing a visitor could see: six starter photographs stood in for the
 * ones that had just been removed, on the gallery page and on every page
 * carrying the showcase, with nothing in the dashboard to explain it.
 *
 * An unreachable API is a different thing and still gets the stand-in: a blank
 * rectangle on the home page over a transient outage helps nobody.
 */
describe("getGalleryTiles", () => {
  it("honours an empty gallery instead of substituting starter images", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }));

    await expect(getGalleryTiles()).resolves.toEqual([]);
  });

  it("returns the school's own tiles when there are some", async () => {
    const tiles = [{ id: "1", caption: "Sports day", href: "#", order: 0, media: null }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(tiles) }));

    await expect(getGalleryTiles()).resolves.toEqual(tiles);
  });

  it("stands in with starters only when the API cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const tiles = await getGalleryTiles();

    expect(tiles.length).toBeGreaterThan(0);
  });

  it("stands in with starters when the API answers with an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const tiles = await getGalleryTiles();

    expect(tiles.length).toBeGreaterThan(0);
  });
});
