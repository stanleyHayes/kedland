import { afterEach, describe, expect, it, vi } from "vitest";

import { findSection, getPageSections, pageTag, type Section } from "./api";

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
