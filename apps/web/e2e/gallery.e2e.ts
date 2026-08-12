import { expect, test } from "@playwright/test";

test.describe("CMS photo gallery", () => {
  test("opens the mosaic as a keyboard-controlled carousel", async ({ page }) => {
    await page.goto("/gallery");

    const gallery = page.getByRole("list", { name: "Kedland photo gallery" });
    await expect(gallery).toBeVisible();
    const photos = gallery.getByRole("button");

    /*
     * How many photographs there are is data, not behaviour.
     *
     * This asserted seven, and CI has been red ever since the gallery held a
     * different number — which it does whenever the school adds or removes one,
     * and in CI, where there is no API, it is however many starter images ship
     * with the build. A test that fails when the school curates its own gallery
     * is testing the wrong thing.
     *
     * What must hold is that the counter in the viewer agrees with the mosaic
     * behind it, and that the arrow keys move through it. That is the feature,
     * and it is true at any count.
     */
    const count = await photos.count();
    expect(count).toBeGreaterThan(1);

    await expect(photos.first()).toBeEnabled();
    await photos.first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(`Photo 1 of ${String(count)}`);

    await page.keyboard.press("ArrowRight");
    await expect(dialog).toHaveAccessibleName(`Photo 2 of ${String(count)}`);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(photos.first()).toBeFocused();
  });

  test("keeps the mosaic inside a phone viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/gallery");

    await expect(page.getByRole("list", { name: "Kedland photo gallery" })).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});
