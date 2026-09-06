/**
 * This file *is* the token definition — the single place in the repo where a
 * colour literal may appear (the `brand/no-raw-color` rule is switched off for
 * it in `eslint.config.mjs`). Every other module reads from here, or from the
 * CSS custom properties in `styles/tokens.css` that mirror it.
 */

/**
 * The Kedland palette.
 *
 * Navy is the anchor; the brights are the personality.
 *
 * The 2026 refresh replaced three accents — the yellow, the blue and the
 * orange — with a warmer, brighter set supplied by the school. The structural
 * colours (navy, ink, cream, white, red, pink, green, sky) are unchanged.
 *
 * All three new accents are *lighter* than what they replaced, which moves
 * them decisively into background-only territory: none of them clears 2:1 as
 * text on cream. Where the old palette got away with a bright as a link colour
 * — marginally, and below AA even then — the new one cannot, so `blueText` and
 * `peachText` exist alongside them. See the note on `redText`, which
 * established the pattern.
 *
 * These values and `tokens.css` must agree — `tokens.spec.ts` asserts it, so a
 * hex changed in one place and not the other fails the build rather than
 * quietly splitting the brand in two.
 */
export const COLOURS = {
  navy: "#0B4A6D",
  navyDeep: "#08334C",
  /** MTN yellow. Backgrounds, and text on navy (6.27:1) — never text on light. */
  yellow: "#FFCC00",
  /** CTA and alert **backgrounds**, with white text. Not for text itself — see `redText`. */
  red: "#E0322C",
  /**
   * `--red` used as text.
   *
   * The build package's own `brand-tokens.css` colours `.eyebrow` with `--red`
   * on `--cream`, which measures **4.36:1** — below the 4.5:1 the same section
   * (§2.3) mandates. A real browser caught this; jsdom cannot, because
   * axe's contrast rule needs canvas.
   *
   * Hue (2°) and saturation (74.4%) are unchanged; lightness drops 1.6%
   * (0.525 → 0.509), giving 4.51:1 on cream and 4.66:1 on white. Indistinguishable
   * beside the original, and it passes.
   *
   * Splitting the token rather than darkening `--red` outright keeps CTA
   * buttons on the exact brand red the school signed off.
   */
  redText: "#DF2B25",
  pink: "#E5388A",
  /**
   * Light blue. A **background** colour: 1.98:1 as text on white, and white on
   * *it* is 1.98:1 too, so it takes `ink` on top, never `white`.
   *
   * The blue it replaced (`#3D9BE9`) was used as a link colour in ~20 places
   * at 2.97:1 — already below AA, just not badly enough to be obvious. This
   * one would take those links to 1.98:1, so they move to `blueText`.
   */
  blue: "#4FC3FF",
  /**
   * `--blue` used as *text* — links, and icon tints on a pale blue chip.
   *
   * Same hue (200.5°) and saturation (100%) as `blue`; lightness drops from
   * 65.5% to 36.4%. 4.53:1 on cream, 4.67:1 on white. Splitting the token
   * rather than darkening `--blue` keeps the bright the school chose for
   * panels and tints exactly as supplied.
   */
  blueText: "#007ABA",
  sky: "#BBD5EF",
  green: "#4CB782",
  /** Peach. Backgrounds and tints; `ink` on top is 8.14:1. */
  peach: "#FFAA80",
  /**
   * `--peach` used as *text*, on the same reasoning as `blueText`.
   *
   * Hue (19.8°) and saturation (100%) unchanged; lightness 75.1% → 40.6%.
   * 4.54:1 on cream, 4.69:1 on white.
   */
  peachText: "#CF4400",
  cream: "#FFFBF2",
  ink: "#12283A",
  white: "#FFFFFF",
  /**
   * ACCESSIBILITY CORRECTION — build package specifies `#6B7A88`.
   *
   * That value renders muted text at **4.27:1 on `--cream`** and 4.41:1 on
   * `--white`, both below the 4.5:1 the same section (§2.3) mandates for body
   * text. The package's two instructions contradict each other; the contrast
   * floor is the one with legal weight and the one it calls "enforced".
   *
   * `#687684` is the minimal correction: hue (209°) and saturation (11.9%)
   * are identical, lightness drops 1.4% (0.476 → 0.462). The result is
   * 4.51:1 on cream and 4.65:1 on white — visually indistinguishable, and it
   * passes. Raise with the client at sign-off; reverting reopens the failure.
   *
   * Note it is 3.07:1 on `--sky`, so muted text must never sit on a sky tint.
   * `contrast.spec.ts` asserts both facts.
   */
  grey: "#687684",
  /**
   * The refresh's grey — borders, dividers, rules, disabled states.
   *
   * Supplied as a palette colour, and it is a good one, but it is Tailwind's
   * `gray-400` and it measures **2.54:1 on white**. That is fine for a hairline
   * and nowhere near enough for words, so it is deliberately a *separate*
   * token from `grey` above rather than a replacement for it: muted body copy
   * keeps the darker value and stays readable.
   *
   * `contrast.spec.ts` asserts both halves of that split.
   */
  greyLight: "#9CA3AF",
} as const;

export type ColourToken = keyof typeof COLOURS;

/** Corner radii. Build package §2.5: roundness everywhere, no sharp corners. */
export const RADII = {
  sm: "12px",
  md: "20px",
  lg: "32px",
  pill: "999px",
} as const;

export const SHADOWS = {
  card: "0 10px 30px rgba(11, 74, 109, 0.10)",
  lift: "0 16px 40px rgba(11, 74, 109, 0.16)",
} as const;

/** Fluid type scale (build package §2.4). */
export const TYPE_SCALE = {
  h1: "clamp(2.2rem, 5vw, 3.6rem)",
  h2: "clamp(1.6rem, 3.5vw, 2.4rem)",
  h3: "1.25rem",
  body: "1.05rem",
  small: "0.9rem",
} as const;

/**
 * Foreground/background pairings the design actually uses.
 *
 * Every entry is asserted against WCAG in `contrast.spec.ts`. `large: true`
 * means the pairing is only ever used at ≥24px (or ≥18.66px bold), which lowers
 * the required ratio from 4.5 to 3.
 *
 * Build package §2.3 bans some combinations outright — white or yellow text on
 * yellow, light text on sky. Those pairings are absent here by construction and
 * the test suite has an explicit case proving they would fail if reintroduced.
 */
export const COLOUR_PAIRINGS: readonly {
  name: string;
  fg: ColourToken;
  bg: ColourToken;
  large?: boolean;
}[] = [
  { name: "body text on cream", fg: "ink", bg: "cream" },
  { name: "body text on white", fg: "ink", bg: "white" },
  { name: "heading on cream", fg: "navy", bg: "cream" },
  { name: "heading on white", fg: "navy", bg: "white" },
  { name: "muted text on cream", fg: "grey", bg: "cream" },
  { name: "reversed text on navy", fg: "white", bg: "navy" },
  { name: "reversed text on deep navy", fg: "white", bg: "navyDeep" },
  { name: "primary CTA label", fg: "white", bg: "red", large: true },
  { name: "eyebrow text on cream", fg: "redText", bg: "cream" },
  { name: "eyebrow text on white", fg: "redText", bg: "white" },
  { name: "tertiary CTA label on yellow", fg: "ink", bg: "yellow" },
  { name: "heading on yellow band", fg: "navy", bg: "yellow" },
  { name: "text on sky tint", fg: "ink", bg: "sky" },
  { name: "heading on sky tint", fg: "navy", bg: "sky" },

  // The 2026 accents. Each bright is a *surface*, carrying ink or navy; the
  // matching `*Text` token is what the same hue looks like when it has to be
  // read on cream or white.
  { name: "link text on cream", fg: "blueText", bg: "cream" },
  { name: "link text on white", fg: "blueText", bg: "white" },
  { name: "peach eyebrow on cream", fg: "peachText", bg: "cream" },
  { name: "peach eyebrow on white", fg: "peachText", bg: "white" },
  { name: "text on light-blue panel", fg: "ink", bg: "blue" },
  { name: "heading on light-blue panel", fg: "navy", bg: "blue" },
  { name: "text on peach panel", fg: "ink", bg: "peach" },
  { name: "heading on peach panel", fg: "navy", bg: "peach" },
  // Hero and footer eyebrows: the yellow is only ever read against navy.
  { name: "yellow eyebrow on navy", fg: "yellow", bg: "navy" },
  { name: "yellow eyebrow on deep navy", fg: "yellow", bg: "navyDeep" },
];
