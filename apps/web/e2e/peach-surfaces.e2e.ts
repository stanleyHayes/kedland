/* eslint-disable brand/no-raw-color -- Regression assertions inspect browser-computed colours. */
import { expect, test } from "@playwright/test";

import { gotoSettled, scanViolations } from "./axe";

test("peach panels remain readable at desktop and mobile widths", async ({ page }, testInfo) => {
  await gotoSettled(page, "/academics");
  const panel = page.getByTestId("learning-path");
  // Pin the actual painted surface: axe cannot always resolve gradient backgrounds.
  await expect(panel).toHaveCSS("background-color", "rgb(249, 214, 206)");
  await expect(panel).toHaveCSS("background-image", "none");
  await expect(panel.locator("li")).toHaveCount(3);
  await expect(panel.getByText("Play, language & belonging")).toHaveCSS("color", "rgb(65, 9, 7)");
  const stops = page.locator("#kedland-lockup-wave stop");
  await expect(stops.first()).toHaveCSS("stop-color", "rgb(241, 123, 119)");
  await expect(stops.last()).toHaveCSS("stop-color", "rgb(249, 214, 206)");
  expect(await scanViolations(page)).toEqual([]);
  await page.getByTestId("header-bar").screenshot({ path: testInfo.outputPath("peach-header.png") });
  await panel.scrollIntoViewIfNeeded();
  await panel.screenshot({ path: testInfo.outputPath("peach-learning-path.png") });
  await expect(panel).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
