import AxeBuilder from "@axe-core/playwright";
import { type Page } from "@playwright/test";

/**
 * Helpers for accessibility scans that measure the page a visitor actually sees.
 *
 * axe reads the colour a pixel *currently* has. Scanned while the shell is still
 * fading in, muted grey body copy part-way through an opacity ramp measures
 * `#7c8792` rather than `#687684` — 3.63:1 instead of 4.65:1 — and the run
 * reports contrast failures nobody can ever encounter. A settled navy heading
 * mid-fade reads as a pale wash at 1.78:1, which is worse: eight invented
 * failures bury the one real one in the list.
 *
 * Worse still, whether the scan catches a frame mid-ramp depends on how fast the
 * machine is, so the suite fails intermittently and teaches people to re-run it
 * rather than read it.
 */

/** The WCAG levels the build package commits to (§2.3). */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/**
 * Waits for the page to stop moving.
 *
 * The condition is the page's own animation set, not a guessed duration.
 * Looping animations — the splash orbit, the hero mantra pulse — never reach
 * `finished`, so they are excluded: they decorate elements axe is not judging,
 * and waiting on them would simply hang.
 */
export async function settleForAxe(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
      .every((animation) => animation.playState === "finished" || animation.playState === "idle"),
  );
}

/**
 * Navigates with motion reduced, then waits for the page to come to rest.
 *
 * Motion is reduced *before* the navigation so the entrance animations never
 * start, rather than being interrupted part-way.
 */
export async function gotoSettled(page: Page, url: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  await settleForAxe(page);
}

/** Runs axe and returns the violations as readable `id: help` lines. */
export async function scanViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}
