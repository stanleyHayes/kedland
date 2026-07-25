import { contrastRatio, requiredRatio, type WcagLevel } from "@kedland/ui";

export interface ContrastMatcherOptions {
  level?: WcagLevel;
  large?: boolean;
}

export interface MatcherResult {
  pass: boolean;
  message: () => string;
}

/**
 * `expect(fg).toMeetContrastAgainst(bg)`.
 *
 * Registered by the app-level vitest setup files. The failure message carries
 * the actual ratio and the required one, because "expected true, got false" is
 * useless when the fix is "darken it a little".
 */
export function toMeetContrastAgainst(
  received: string,
  background: string,
  { level = "AA", large = false }: ContrastMatcherOptions = {},
): MatcherResult {
  const ratio = contrastRatio(received, background);
  const required = requiredRatio(level, large);
  const pass = ratio >= required;

  const size = large ? "large" : "normal";
  const pairing = `${received} on ${background}`;
  const actual = `${ratio.toFixed(2)}:1`;
  const needed = `${required.toString()}:1`;

  const failure = `Expected ${pairing} to meet WCAG ${level} (${size} text): got ${actual}, needs ${needed}.`;
  const inverted = `Expected ${pairing} NOT to meet WCAG ${level} (${size} text), but it reached ${actual} against a ${needed} requirement.`;

  return { pass, message: () => (pass ? inverted : failure) };
}

export const contrastMatchers = { toMeetContrastAgainst };

/**
 * Registers the matcher's type with Vitest.
 *
 * The augmentation lives here rather than in a standalone `.d.ts` so that any
 * module importing `contrastMatchers` picks up the types automatically — a
 * separate declaration file would need each consumer to reference it, and the
 * first one to forget gets an untyped `expect` with no warning.
 */
declare module "vitest" {
  // The type parameter list must mirror Vitest's own `Matchers<T = any>`
  // exactly — TypeScript rejects an augmentation whose defaults differ
  // (TS2428). This is the one place `any` is unavoidable: it is their
  // signature, not ours.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Matchers<T = any> {
    /**
     * Asserts a foreground colour meets WCAG contrast against a background.
     *
     * @example expect(COLOURS.grey).toMeetContrastAgainst(COLOURS.cream)
     */
    toMeetContrastAgainst(background: string, options?: ContrastMatcherOptions): T;
  }
}
