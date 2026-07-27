import { describe, expect, it } from "vitest";

import { buildCsp } from "./csp";

/** Pulls one directive out of a policy string. */
function directive(csp: string, name: string): string {
  const found = csp.split("; ").find((part) => part.startsWith(`${name} `));
  return found ?? "";
}

const API = "https://api.kedland.edu.gh/api/v1";

describe("buildCsp", () => {
  /**
   * The regression this file exists for.
   *
   * The enquiry form posts from the browser to the API, which is a different
   * origin in every environment — Render for the API, Vercel for the site. A
   * `connect-src` without it means the browser refuses the request *before*
   * making it, so the API never sees anything and the parent gets "we could
   * not send that". Nothing but a real browser catches it: the build passes,
   * the types pass, and every unit test passes.
   */
  it("allows the browser to reach the API", () => {
    const csp = buildCsp({ apiUrl: API });

    expect(directive(csp, "connect-src")).toContain("https://api.kedland.edu.gh");
  });

  it("allows the origin, not the path", () => {
    // CSP sources are origins; leaving `/api/v1` on would not match.
    expect(directive(buildCsp({ apiUrl: API }), "connect-src")).not.toContain("/api/v1");
  });

  it("still allows Turnstile to be reached", () => {
    expect(directive(buildCsp({ apiUrl: API }), "connect-src")).toContain(
      "https://challenges.cloudflare.com",
    );
  });

  it("keeps 'self' as well", () => {
    expect(directive(buildCsp({ apiUrl: API }), "connect-src")).toContain("'self'");
  });

  describe("when the API URL is unusable", () => {
    it("omits it rather than emitting an empty source", () => {
      // A stray double space is a malformed directive, not a lenient one.
      const csp = buildCsp({ apiUrl: undefined });

      expect(csp).not.toContain("  ");
      expect(directive(csp, "connect-src")).toBe("connect-src 'self' https://challenges.cloudflare.com");
    });

    it("does not take the build down over a malformed value", () => {
      expect(() => buildCsp({ apiUrl: "not a url" })).not.toThrow();
      expect(directive(buildCsp({ apiUrl: "not a url" }), "connect-src")).not.toContain("not a url");
    });
  });

  describe("the rest of the policy", () => {
    it("refuses to be framed", () => {
      expect(buildCsp()).toContain("frame-ancestors 'none'");
    });

    it("keeps production preview framing pinned to the configured dashboard", () => {
      expect(
        directive(
          buildCsp({ frameableBy: "https://dashboard.kedland.edu.gh", isDev: false }),
          "frame-ancestors",
        ),
      ).toBe("frame-ancestors https://dashboard.kedland.edu.gh");
    });

    it("permits alternate HTTP hosts only for the local development preview", () => {
      expect(
        directive(buildCsp({ frameableBy: "http://localhost:3101", isDev: true }), "frame-ancestors"),
      ).toBe("frame-ancestors http://localhost:3101 http:");
    });

    it("allows Cloudinary images and nothing else remote", () => {
      expect(directive(buildCsp(), "img-src")).toBe("img-src 'self' data: blob: https://res.cloudinary.com");
    });

    it("serves fonts only from this origin", () => {
      // `next/font` self-hosts Euclid Circular A and Outfit; nothing should be
      // fetched from Google at runtime.
      expect(directive(buildCsp(), "font-src")).toBe("font-src 'self'");
    });

    /**
     * React's development build uses `eval()`; the production build never
     * does. Allowing it in production would weaken the policy for nothing.
     */
    it("permits the development build's eval, and only in development", () => {
      expect(directive(buildCsp({ isDev: true }), "script-src")).toContain("'unsafe-eval'");
      expect(directive(buildCsp({ isDev: false }), "script-src")).not.toContain("'unsafe-eval'");
    });

    it("defaults to the production policy", () => {
      expect(directive(buildCsp(), "script-src")).not.toContain("'unsafe-eval'");
    });

    it("blocks plugins outright", () => {
      expect(buildCsp()).toContain("object-src 'none'");
    });
  });
});
