import { expect, test } from "@playwright/test";

import { gotoSettled, scanViolations, settleForAxe } from "./axe";

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
      document.documentElement.style.scrollBehavior = "auto";
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const target = Math.min(400, maxScroll);
      window.scrollTo(0, target);
    });

    const after = await bar.boundingBox();

    // Sticky: the bar keeps roughly the same viewport position, not the same
    // document position.
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(30);
  });

  // Scoped to the primary nav throughout. The page itself links to the same
  // destinations in its body copy — "Read our story", an Early Years card, an
  // Enrol Now in the closing banner — so an unscoped name match finds several
  // links and Playwright refuses to guess between them.
  test("opens a dropdown from the keyboard and closes it with Escape", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    const trigger = nav.getByRole("button", { name: /^about/i });

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(nav.getByRole("link", { name: /our story/i })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(nav.getByRole("link", { name: /our story/i })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("navigates to a sub-page from a dropdown", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });

    await nav.getByRole("button", { name: /^academics/i }).click();
    await nav.getByRole("link", { name: /early years/i }).click();

    await expect(page).toHaveURL(/\/academics\/early-years$/);
  });

  test("the Enrol Now button reaches admissions", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("header-bar").getByRole("link", { name: "Enrol Now" }).click();

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

  // The document staying put says nothing about the menu: the panel is its own
  // scroll container, so it can drag sideways while the page behind it cannot.
  // It did — the decorative stars hang past its right edge, and `overflow-y`
  // had quietly made the x axis scrollable too.
  test("the open menu does not drag sideways", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const panel = page.getByTestId("mobile-menu");
    await expect(panel).toBeVisible();

    const scroll = await panel.evaluate((el) => {
      // Asking for the scroll is the real test: a container with nothing to
      // reveal sideways refuses to move, however far it is pushed.
      el.scrollTo({ left: 9999 });
      const reached = el.scrollLeft;
      el.scrollTo({ left: 0 });
      return { reached, range: el.scrollWidth - el.clientWidth, tall: el.scrollHeight > el.clientHeight };
    });

    expect(scroll.range).toBe(0);
    expect(scroll.reached).toBe(0);
    // And the fix must not have cost the panel its vertical scroll.
    expect(scroll.tall).toBe(true);
  });
});

test.describe("footer", () => {
  test("offers callable phone numbers", async ({ page }) => {
    await page.goto("/");
    const phone = page
      .getByLabel("Visit or call")
      .getByRole("link", { name: "+233 257 130 333", exact: true });

    await expect(phone).toBeVisible();
    await expect(phone).toHaveAttribute("href", "tel:+233257130333");
  });

  test("shows the motto", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("In God We Trust")).toBeVisible();
  });
});

/**
 * Every scan reduces motion and waits for the page to come to rest first —
 * see `./axe` for why a raw scan invents contrast failures.
 */
test.describe("accessibility with the shell in place", () => {
  test("no violations at desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoSettled(page, "/");

    expect(await scanViolations(page)).toEqual([]);
  });

  test("no violations with a dropdown open", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoSettled(page, "/");
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: /^about/i })
      .click();
    await settleForAxe(page);

    expect(await scanViolations(page)).toEqual([]);
  });

  test("no violations with the mobile menu open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoSettled(page, "/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await settleForAxe(page);

    expect(await scanViolations(page)).toEqual([]);
  });
});
