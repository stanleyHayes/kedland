import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("dashboard foundation", () => {
  test("routes a signed-out visitor to the branded staff sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back");
  });

  test("is excluded from search indexes", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  });

  test("refuses to be framed", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(response?.headers()["x-frame-options"]).toBe("DENY");
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
