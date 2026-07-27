import { describe, expect, it } from "vitest";

import robots from "./robots";

import { SITE_URL } from "@/lib/site";

describe("robots", () => {
  it("welcomes crawlers to the site as a whole", () => {
    const rules = robots().rules;

    expect(rules).toMatchObject({ userAgent: "*", allow: "/" });
  });

  it("keeps the preview surface and the webhook out of every index", () => {
    const rules = robots().rules;
    const disallow = Array.isArray(rules) ? [] : (rules.disallow ?? []);

    expect(disallow).toContain("/preview");
    expect(disallow).toContain("/api/");
  });

  it("points at the sitemap on the site's own origin", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
