import { describe, expect, it } from "vitest";

import { articleJsonLd } from "./article";

import type { Post } from "@kedland/types";

import { SITE_NAME, SITE_URL } from "@/lib/site";

const POST: Post = {
  id: "1",
  title: "Sports Day 2026",
  slug: "sports-day-2026",
  category: "events",
  excerpt: "A morning of races, ribbons and very proud Stars.",
  body: "The whole school gathered…",
  coverImage: null,
  status: "published",
  publishedAt: "2026-03-14T09:00:00.000Z",
  seoTitle: null,
  seoDescription: null,
  readingMinutes: 3,
  createdAt: "2026-03-10T09:00:00.000Z",
  updatedAt: "2026-03-15T09:00:00.000Z",
  authorId: null,
};

describe("articleJsonLd", () => {
  it("declares an Article with the post's headline and dates", () => {
    const data = articleJsonLd(POST, null);

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("Article");
    expect(data["headline"]).toBe("Sports Day 2026");
    expect(data["datePublished"]).toBe("2026-03-14T09:00:00.000Z");
    expect(data["dateModified"]).toBe("2026-03-15T09:00:00.000Z");
  });

  it("names the school, not a dashboard account, as author and publisher", () => {
    const data = articleJsonLd(POST, null);

    expect(data["author"]).toMatchObject({ "@type": "Organization", name: SITE_NAME, url: SITE_URL });
    expect(data["publisher"]).toMatchObject({ "@type": "Organization", name: SITE_NAME });
  });

  it("points back at the post's canonical URL", () => {
    expect(articleJsonLd(POST, null)["mainEntityOfPage"]).toBe(`${SITE_URL}/news/sports-day-2026`);
  });

  it("uses the cover as the article image when the post has one", () => {
    expect(articleJsonLd(POST, "https://res.cloudinary.com/x/cover.webp")["image"]).toEqual([
      "https://res.cloudinary.com/x/cover.webp",
    ]);
  });

  it("omits the image entirely when the post has no cover", () => {
    // An invented image is worse than none — Google would show a logo where a
    // reader expects the story's photograph.
    expect(articleJsonLd(POST, null)).not.toHaveProperty("image");
  });

  it("falls back to createdAt when a post has never been published", () => {
    expect(articleJsonLd({ ...POST, publishedAt: null }, null)["datePublished"]).toBe(
      "2026-03-10T09:00:00.000Z",
    );
  });
});
