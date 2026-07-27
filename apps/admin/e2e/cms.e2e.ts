import { expect, test } from "@playwright/test";

const EMAIL = process.env["E2E_ADMIN_EMAIL"] ?? "admin@kedland.edu.gh";

/**
 * The seeded administrator's password is a secret even locally — it is read
 * from the environment, never written into the repository. Run the suite with
 * `E2E_ADMIN_PASSWORD` set to the same value `SEED_ADMIN_PASSWORD` had when
 * the database was seeded.
 */
function adminPassword(): string {
  const password = process.env["E2E_ADMIN_PASSWORD"];
  if (!password) {
    throw new Error("E2E_ADMIN_PASSWORD is not set — point it at the seeded administrator's password.");
  }
  return password;
}

test.describe("content-first CMS editor", () => {
  test("shows current content and a working live preview before edits", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/login");
    await page.getByLabel("Email address").fill(EMAIL);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(adminPassword());
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    await expect(page.getByText("Loading dashboard")).toBeHidden({ timeout: 20_000 });

    await page.goto("/content?page=home");
    const openSection = page.locator("details[open]");
    await expect(openSection.getByText("Current public content")).toBeVisible();
    await expect(openSection.getByText("Available")).toBeVisible();

    const skipTour = page.getByRole("button", { name: "Skip tour" });
    if (await skipTour.isVisible()) await skipTour.click();

    await openSection.getByRole("button", { name: "Edit section" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Preview", { exact: true })).toBeVisible();

    const preview = dialog.frameLocator('iframe[title^="Preview of"]');
    await expect(
      preview.getByRole("heading", {
        level: 1,
        name: "Where little Stars learn, play, and shine.",
      }),
    ).toBeVisible({ timeout: 35_000 });
    await expect(dialog.getByText("Updates as you type")).toBeVisible();

    await dialog.getByRole("button", { name: /close edit/i }).click();
    await openSection.getByRole("button", { name: "Change image" }).click();

    const imageDialog = page.getByRole("dialog");
    const picker = imageDialog.getByRole("group", { name: /approved media/i });
    await expect(picker).toBeVisible();
    await expect(picker.locator("img")).toHaveCount(7);
    await expect(picker.getByRole("radio", { checked: true })).toHaveCount(1);
  });
});
