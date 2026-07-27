import { beforeEach, describe, expect, it, vi } from "vitest";

import sitemap from "./sitemap";

import { getPostSlugs } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

vi.mock("@/lib/api", () => ({
  getPostSlugs: vi.fn(),
}));

const getPostSlugsMock = vi.mocked(getPostSlugs);

beforeEach(() => {
  getPostSlugsMock.mockResolvedValue([]);
});

describe("sitemap", () => {
  it("lists every public route with an absolute URL", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    for (const path of [
      "/",
      "/about",
      "/about/our-story",
      "/about/principal",
      "/about/facilities",
      "/about/mission-vision-values",
      "/academics",
      "/academics/early-years",
      "/academics/primary",
      "/admissions",
      "/student-life",
      "/faqs",
      "/news",
      "/gallery",
      "/contact",
      "/privacy",
    ]) {
      expect(urls).toContain(`${SITE_URL}${path}`);
    }
  });

  it("never advertises the preview surface or the webhook", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.some((url) => url.includes("/preview"))).toBe(false);
    expect(urls.some((url) => url.includes("/api/"))).toBe(false);
  });

  it("merges published posts with their last-modified dates", async () => {
    getPostSlugsMock.mockResolvedValue([{ slug: "sports-day-2026", updatedAt: "2026-03-15T09:00:00.000Z" }]);

    const entries = await sitemap();

    expect(entries).toContainEqual({
      url: `${SITE_URL}/news/sports-day-2026`,
      lastModified: "2026-03-15T09:00:00.000Z",
    });
  });

  it("falls back to the static routes when the API is unreachable at build time", async () => {
    // The same contract the news pages rely on: an API outage costs the
    // sitemap its post entries, not the build.
    getPostSlugsMock.mockResolvedValue([]);

    const entries = await sitemap();

    expect(entries).toHaveLength(16);
    expect(entries.some((entry) => entry.url.includes("/news/"))).toBe(false);
  });
});
