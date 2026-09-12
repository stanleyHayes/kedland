/**
 * This file *is* the token definition — the single place in the repo where a
 * colour literal may appear (the `brand/no-raw-color` rule is switched off for
 * it in `eslint.config.mjs`). Every other module reads from here, or from the
 * CSS custom properties in `styles/tokens.css` that mirror it.
 */

import { composite, type Rgb } from "./contrast";

/** September 2026: coral-peach sampled from the school update PDF.
 * Legacy navy/blue/sky keys are warm aliases so existing CMS colour choices
 * and dashboard components inherit the palette without invalidating content.
 * Bright peach is a surface; its dark companion is used for text and focus.
 */
export const COLOURS = {
  navy: "#542923",
  navyDeep: "#351C18",
  yellow: "#FFCC00",
  red: "#E0322C",
  redText: "#C4221D",
  pink: "#E5388A",
  blue: "#F17B77",
  blueText: "#983D37",
  sky: "#F9D6CE",
  green: "#4CB782",
  peach: "#F17B77",
  peachText: "#983D37",
  cream: "#FFFBF2",
  ink: "#301B18",
  white: "#FFFFFF",
  grey: "#75635E",
  greyLight: "#B8A29B",
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
  card: "0 10px 30px rgba(84, 41, 35, 0.10)",
  lift: "0 16px 40px rgba(84, 41, 35, 0.16)",
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

/**
 * Pairings whose background is a *blend* rather than a token.
 *
 * `COLOUR_PAIRINGS` above can only describe token-on-token, which quietly
 * assumes every surface is one of the flat palette colours. The design does not
 * work that way: panels are tinted with Tailwind's opacity suffix (`bg-sky/20`,
 * `bg-red/10`), and the composited result is what text is actually read
 * against. An eyebrow measured 4.51:1 on bare cream and 4.19:1 on the sky-tinted
 * panel it usually sits on — passing the gate while failing on screen.
 *
 * These entries close that gap for the surfaces eyebrows genuinely land on.
 */
export const TINTED_SURFACE_PAIRINGS: readonly {
  name: string;
  fg: ColourToken;
  surface: Rgb;
  large?: boolean;
}[] = [
  // Cream is the ground rather than white throughout: it is the darker of the
  // two page backgrounds, so a tint over cream is the worse case and covers the
  // same tint over white.
  {
    name: "eyebrow text on a sky-tinted panel",
    fg: "redText",
    surface: composite(COLOURS.sky, COLOURS.cream, 0.2),
  },
  {
    name: "eyebrow text on a red-tinted panel",
    fg: "redText",
    surface: composite(COLOURS.red, COLOURS.cream, 0.1),
  },
  // `Chip` tints at 12%, not the 10% the panels use. Gating only the lighter of
  // the two is how the first attempt at this fix still shipped a 4.42:1 chip.
  {
    name: "chip label on a red-tinted chip",
    fg: "redText",
    surface: composite(COLOURS.red, COLOURS.cream, 0.12),
  },
];
