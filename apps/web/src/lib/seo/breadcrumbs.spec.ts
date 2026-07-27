import { describe, expect, it } from "vitest";

import { breadcrumbList, breadcrumbsFor } from "./breadcrumbs";

import { SITE_URL } from "@/lib/site";

describe("breadcrumbsFor", () => {
  it("always starts at Home", () => {
    expect(breadcrumbsFor("/about/our-story")[0]).toEqual({ label: "Home", path: "/" });
  });

  it("labels known segments with the same words the pages use", () => {
    // Derived title-case would produce "Mission Vision Values" — the page says
    // "Mission, Vision & Values", and the two must agree.
    expect(breadcrumbsFor("/about/mission-vision-values")).toEqual([
      { label: "Home", path: "/" },
      { label: "About", path: "/about" },
      { label: "Mission, Vision & Values", path: "/about/mission-vision-values" },
    ]);
  });

  it("accumulates the path segment by segment", () => {
    const trail = breadcrumbsFor("/academics/early-years");

    expect(trail.map((item) => item.path)).toEqual(["/", "/academics", "/academics/early-years"]);
  });

  it("names the leaf from the supplied label, for post slugs", () => {
    const trail = breadcrumbsFor("/news/sports-day-2026", "Sports Day 2026");

    expect(trail.at(-1)).toEqual({ label: "Sports Day 2026", path: "/news/sports-day-2026" });
  });

  it("humanises an unknown segment rather than crashing", () => {
    expect(breadcrumbsFor("/news/sports-day-2026").at(-1)?.label).toBe("Sports Day 2026");
  });
});

describe("breadcrumbList", () => {
  it("declares a BreadcrumbList with one-based positions", () => {
    const data = breadcrumbList(breadcrumbsFor("/about/our-story"));

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("BreadcrumbList");
    const items = data["itemListElement"] as Record<string, unknown>[];
    expect(items.map((item) => item["position"])).toEqual([1, 2, 3]);
  });

  it("makes every item URL absolute", () => {
    const items = breadcrumbList(breadcrumbsFor("/about/our-story"))["itemListElement"] as Record<
      string,
      unknown
    >[];

    expect(items[2]).toEqual({
      "@type": "ListItem",
      position: 3,
      name: "Our Story",
      item: `${SITE_URL}/about/our-story`,
    });
  });
});
