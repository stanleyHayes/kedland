import { expect, test } from "@playwright/test";

test.describe("CMS photo gallery", () => {
  test("opens the mosaic as a keyboard-controlled carousel", async ({ page }) => {
    await page.goto("/gallery");

    const gallery = page.getByRole("list", { name: "Kedland photo gallery" });
    await expect(gallery).toBeVisible();
    const photos = gallery.getByRole("button");
    await expect(photos).toHaveCount(7);

    await expect(photos.first()).toBeEnabled();
    await photos.first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName("Photo 1 of 7");

    await page.keyboard.press("ArrowRight");
    await expect(dialog).toHaveAccessibleName("Photo 2 of 7");

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
