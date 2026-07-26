import { describe, expect, it } from "vitest";

import {
  postInputSchema,
  postQuerySchema,
  postUpdateSchema,
  readingMinutes,
  slugify,
  slugSchema,
} from "./post";

const VALID = {
  title: "Our first sports day",
  category: "events",
  excerpt: "A morning of races, laughter and a great many medals.",
  body: "It was a wonderful morning.",
};

describe("slugify", () => {
  it("turns a headline into a URL", () => {
    expect(slugify("Our First Sports Day")).toBe("our-first-sports-day");
  });

  it("collapses runs of punctuation into a single dash", () => {
    expect(slugify("Reception  —  what's new?!")).toBe("reception-what-s-new");
  });

  it("leaves no leading or trailing dash", () => {
    expect(slugify("  ...Hello!  ")).toBe("hello");
  });

  /**
   * Ghanaian and British school copy both carry accents — "Crèche" is a real
   * word on this site. Losing the letter entirely would give "cr-che".
   */
  it("folds accents to their base letter", () => {
    expect(slugify("Crèche open day")).toBe("creche-open-day");
    expect(slugify("Café morning")).toBe("cafe-morning");
  });

  it("returns an empty string when there is nothing usable", () => {
    // The caller decides what to do about it; silently inventing a slug here
    // would hide a title that is entirely punctuation.
    expect(slugify("!!!")).toBe("");
  });

  it("keeps digits", () => {
    expect(slugify("Primary 3 results 2026")).toBe("primary-3-results-2026");
  });

  it("produces something the slug schema accepts", () => {
    for (const title of [
      "Our First Sports Day",
      "Reception  —  what's new?!",
      "Crèche open day",
      "Primary 3 results 2026",
    ]) {
      expect(slugSchema.safeParse(slugify(title)).success).toBe(true);
    }
  });

  describe("when the title is very long", () => {
    const long = `${"word ".repeat(60)}end`;

    it("stays within the schema's limit", () => {
      const slug = slugify(long);

      expect(slug.length).toBeLessThanOrEqual(140);
      expect(slugSchema.safeParse(slug).success).toBe(true);
    });

    it("cuts back to a whole word rather than leaving a half one", () => {
      // A slug ending mid-word reads as broken, and a trailing dash would be
      // rejected by the schema outright.
      const slug = slugify(long);

      expect(slug.endsWith("-")).toBe(false);
      expect(slug.split("-").every((word) => word === "word")).toBe(true);
    });

    it("handles a single unbroken word longer than the limit", () => {
      const slug = slugify("a".repeat(200));

      expect(slug).toHaveLength(140);
      expect(slugSchema.safeParse(slug).success).toBe(true);
    });
  });
});

describe("slugSchema", () => {
  it.each(["hello", "our-first-sports-day", "primary-3"])("accepts %s", (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(true);
  });

  it.each(["-leading", "trailing-", "double--dash", "Upper", "has space", "under_score", ""])(
    "rejects %s",
    (slug) => {
      expect(slugSchema.safeParse(slug).success).toBe(false);
    },
  );
});

describe("readingMinutes", () => {
  it("rounds to the nearest minute at 200 words a minute", () => {
    expect(readingMinutes("word ".repeat(400))).toBe(2);
  });

  it("never reports zero minutes", () => {
    // "0 min read" would be a strange thing to print under a headline.
    expect(readingMinutes("Short.")).toBe(1);
  });

  it("ignores the whitespace an editor leaves behind", () => {
    expect(readingMinutes("  one   two \n\n three  ")).toBe(1);
  });
});

describe("postInputSchema", () => {
  it("accepts a complete post", () => {
    expect(postInputSchema.safeParse(VALID).success).toBe(true);
  });

  it("treats the slug as optional, because the API derives one", () => {
    expect(postInputSchema.safeParse(VALID).success).toBe(true);
    expect(postInputSchema.safeParse({ ...VALID, slug: "chosen-by-hand" }).success).toBe(true);
  });

  it("rejects a hand-written slug that is not URL-safe", () => {
    expect(postInputSchema.safeParse({ ...VALID, slug: "Not A Slug" }).success).toBe(false);
  });

  it("requires an excerpt", () => {
    // A post with no summary lists as a bare headline, which reads unfinished.
    const { excerpt: _excerpt, ...withoutExcerpt } = VALID;
    expect(postInputSchema.safeParse(withoutExcerpt).success).toBe(false);
  });

  it("rejects a category outside the fixed set", () => {
    expect(postInputSchema.safeParse({ ...VALID, category: "gossip" }).success).toBe(false);
  });

  /**
   * Publishing is a separate action on purpose. If `status` were an input
   * field, an editor could publish by typo — and there would be no single
   * place to hang the cache revalidation that publishing has to trigger.
   */
  it("does not let an editor set the status directly", () => {
    expect(postInputSchema.safeParse({ ...VALID, status: "published" }).success).toBe(false);
  });

  it("does not let an editor backdate publication", () => {
    expect(postInputSchema.safeParse({ ...VALID, publishedAt: "2020-01-01" }).success).toBe(false);
  });

  it("caps the body so a paste cannot fill the database", () => {
    expect(postInputSchema.safeParse({ ...VALID, body: "x".repeat(50_001) }).success).toBe(false);
  });

  it("requires alt text with a cover image", () => {
    expect(postInputSchema.safeParse({ ...VALID, coverImage: { mediaId: "abc" } }).success).toBe(false);
    expect(
      postInputSchema.safeParse({ ...VALID, coverImage: { mediaId: "abc", alt: "Children racing" } }).success,
    ).toBe(true);
  });
});

describe("postUpdateSchema", () => {
  it("accepts a single field", () => {
    expect(postUpdateSchema.safeParse({ title: "A new title" }).success).toBe(true);
  });

  it("still refuses a field the contract does not declare", () => {
    expect(postUpdateSchema.safeParse({ status: "published" }).success).toBe(false);
  });

  it("still validates the fields it is given", () => {
    expect(postUpdateSchema.safeParse({ slug: "Not A Slug" }).success).toBe(false);
  });
});

describe("postQuerySchema", () => {
  it("defaults to the first page", () => {
    expect(postQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 9 });
  });

  it("coerces the query string's numbers", () => {
    // Query parameters arrive as strings; a page of "2" must not become NaN.
    expect(postQuerySchema.parse({ page: "2" }).page).toBe(2);
  });

  it("caps the page size so one request cannot ask for everything", () => {
    expect(postQuerySchema.safeParse({ pageSize: "500" }).success).toBe(false);
  });

  it("rejects a page of zero", () => {
    expect(postQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });
});
