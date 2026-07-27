import { describe, expect, it } from "vitest";

import { resolveSiteUrl, SITE_URL } from "./site";

describe("resolveSiteUrl", () => {
  it("keeps a well-formed origin as it is", () => {
    expect(resolveSiteUrl("https://kedland.edu.gh")).toBe("https://kedland.edu.gh");
  });

  it("strips a trailing slash, so consumers appending paths never produce '//'", () => {
    expect(resolveSiteUrl("https://kedland.edu.gh/")).toBe("https://kedland.edu.gh");
  });

  it("strips repeated trailing slashes", () => {
    expect(resolveSiteUrl("https://kedland.edu.gh///")).toBe("https://kedland.edu.gh");
  });

  it("ignores surrounding whitespace", () => {
    expect(resolveSiteUrl("  https://kedland.edu.gh  ")).toBe("https://kedland.edu.gh");
  });

  it("falls back to localhost when the variable is unset", () => {
    // A missing variable is a misconfiguration to fix in Vercel, not a reason
    // the site cannot render locally.
    expect(resolveSiteUrl(undefined)).toBe("http://localhost:3000");
  });

  it("falls back to localhost when the variable is blank", () => {
    expect(resolveSiteUrl("   ")).toBe("http://localhost:3000");
  });
});

describe("SITE_URL", () => {
  it("resolves to a usable origin with no trailing slash", () => {
    expect(SITE_URL).toMatch(/^https?:\/\//);
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});
