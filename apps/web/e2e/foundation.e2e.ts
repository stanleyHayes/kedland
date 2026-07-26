import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Browser-level checks that a jsdom test cannot make: real fonts, real CSS,
 * real focus order, real headers.
 */
test.describe("public site foundation", () => {
  test("renders the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("exposes a working skip link as the first tab stop", async ({ page, browserName }) => {
    await page.goto("/");
    if (browserName === "webkit") {
      // WebKit headless does not enable macOS full keyboard access, so Tab
      // intentionally skips links. Focus the same control directly there;
      // Chromium still verifies that it is the first keyboard stop.
      await page.locator(".skip-link").focus();
    } else {
      await page.keyboard.press("Tab");
    }

    const focused = page.locator(":focus");
    await expect(focused).toHaveText(/skip to content/i);

    await focused.press("Enter");
    await expect(page.locator("#main")).toBeVisible();
  });

  test("serves the security headers the CSP policy defines", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("does not advertise the framework version", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.headers()["x-powered-by"]).toBeUndefined();
  });

  test("has no accessibility violations on the full page", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("honours prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // The loading skeleton can disappear before a fast production build is
    // observable. Mount the shared class directly so this remains a
    // deterministic CSS test rather than a network timing test.
    await page.evaluate(() => {
      const skeleton = document.createElement("div");
      skeleton.className = "kedland-skeleton";
      skeleton.setAttribute("data-testid", "motion-skeleton");
      skeleton.style.width = "8rem";
      skeleton.style.height = "2rem";
      document.body.append(skeleton);
    });
    const skeleton = page.getByTestId("motion-skeleton");
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toHaveCSS("animation-name", "none");
  });

  test("renders legibly at a phone viewport without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});

/**
 * Covers `src/lib/fonts.ts`, which unit tests cannot reach — `next/font/google`
 * only exists after the Next compiler has rewritten it. A real browser is the
 * only place the claim "the brand fonts load" can actually be tested.
 */
test.describe("typography", () => {
  test("renders headings in Euclid Circular A and body in Outfit", async ({ page }) => {
    await page.goto("/");

    const heading = await page
      .getByRole("heading", { level: 1 })
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(heading).toMatch(/Euclid/i);

    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body).toMatch(/Outfit/i);
  });

  test("self-hosts the fonts rather than fetching them from Google", async ({ page }) => {
    // The CSP has no font-src for a third-party origin, so a runtime request to
    // fonts.gstatic.com would fail silently and fall back. Assert none is made.
    const external: string[] = [];
    page.on("request", (r) => {
      const url = r.url();
      if (/fonts\.(googleapis|gstatic)\.com/.test(url)) external.push(url);
    });

    await page.goto("/", { waitUntil: "networkidle" });
    expect(external).toEqual([]);
  });
});
