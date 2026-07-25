/**
 * This file *is* the token definition — the single place in the repo where a
 * colour literal may appear (the `brand/no-raw-color` rule is switched off for
 * it in `eslint.config.mjs`). Every other module reads from here, or from the
 * CSS custom properties in `styles/tokens.css` that mirror it.
 */

/**
 * The Kedland palette.
 *
 * Sampled from the school logo and admission flyers, and reproduced verbatim
 * from the build package §2.3 / `assets/brand/brand-tokens.css`. Navy is the
 * anchor; the brights are the personality.
 *
 * These values and `tokens.css` must agree — `tokens.spec.ts` asserts it, so a
 * hex changed in one place and not the other fails the build rather than
 * quietly splitting the brand in two.
 */
export const COLOURS = {
  navy: "#0B4A6D",
  navyDeep: "#08334C",
  yellow: "#F7CE46",
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
  blue: "#3D9BE9",
  sky: "#BBD5EF",
  green: "#4CB782",
  orange: "#F59331",
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
];
