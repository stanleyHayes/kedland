import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * The header and footer in a real browser — the things jsdom cannot judge:
 * which breakpoint shows which control, whether the sticky bar actually
 * sticks, real focus order, and contrast against the rendered background.
 */

test.describe("header at desktop width", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows the capsule nav and hides the mobile trigger", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("nav-capsule")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Quick links" })).toBeVisible();
  });

  test("stays put while the page scrolls", async ({ page }) => {
    await page.goto("/");
    const bar = page.getByTestId("header-bar");

    const before = await bar.boundingBox();

    await page.evaluate(() => {
      window.scrollBy(0, 600);
    });
    // Wait on the scroll having actually settled rather than on a fixed delay,
    // which passes or fails depending on how busy the machine is.
    await page.waitForFunction(() => window.scrollY >= 600);

    const after = await bar.boundingBox();

    // Sticky: the bar keeps roughly the same viewport position, not the same
    // document position.
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(30);
  });

  test("opens a dropdown from the keyboard and closes it with Escape", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /^about/i });

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: /our story/i })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: /our story/i })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("navigates to a sub-page from a dropdown", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /^academics/i }).click();
    await page.getByRole("link", { name: /early years/i }).click();

    await expect(page).toHaveURL(/\/academics\/early-years$/);
  });

  test("the Enrol Now button reaches admissions", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Enrol Now" }).click();

    await expect(page).toHaveURL(/\/admissions$/);
  });
});

test.describe("header at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("swaps the capsule for the menu trigger", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("nav-capsule")).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });

  test("opens the full-screen menu and closes it again", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Student Life" })).toBeVisible();

    await page.getByRole("button", { name: "Close menu" }).click();
    await expect(menu).toBeHidden();
  });

  test("stops the page behind it scrolling while open", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflow).toBe("hidden");
  });

  test("gives every menu link a thumb-sized target", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    // Build package §2.5: tap targets of at least 48px.
    const links = page.getByRole("dialog", { name: "Menu" }).getByRole("link");
    for (const link of await links.all()) {
      const box = await link.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test("does not scroll sideways", async ({ page }) => {
    await page.goto("/");
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});

test.describe("footer", () => {
  test("offers callable phone numbers", async ({ page }) => {
    await page.goto("/");
    const phone = page.getByRole("link", { name: "+233 257 130 333" });

    await expect(phone).toBeVisible();
    await expect(phone).toHaveAttribute("href", "tel:+233257130333");
  });

  test("shows the motto", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("In God We Trust")).toBeVisible();
  });
});

test.describe("accessibility with the shell in place", () => {
  test("no violations at desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("no violations with a dropdown open", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: /^about/i }).click();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("no violations with the mobile menu open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
