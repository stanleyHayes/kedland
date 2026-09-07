/**
 * WCAG 2.1 relative-luminance and contrast-ratio maths.
 *
 * Small enough to own outright, and owning it means the accessibility gate has
 * no dependency that could change under it. Formulae per WCAG 2.1 §1.4.3.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parses `#rgb`, `#rrggbb` or `#rrggbbaa`. Alpha is ignored — contrast is
 *  computed against composited colours, which the caller must supply. Use
 *  `composite` to build one. */
export function hexToRgb(hex: string): Rgb {
  const cleaned = hex.trim().replace(/^#/, "");

  if (!/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cleaned)) {
    throw new Error(`Not a hex colour: "${hex}"`);
  }

  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned.slice(0, 6);

  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

/**
 * Flattens a translucent colour onto an opaque one, returning the colour that
 * actually reaches the screen.
 *
 * Tailwind's `/NN` suffix (`bg-sky/20`) paints a *blend*, not a token, and it
 * is the blend that text has to be legible against. Measuring against the
 * underlying token instead reports a panel as passing when the rendered pixels
 * fail — which is exactly how a 4.19:1 eyebrow shipped.
 *
 * `alpha` is the foreground's opacity, 0 to 1.
 */
export function composite(foreground: Rgb | string, background: Rgb | string, alpha: number): Rgb {
  if (!(alpha >= 0 && alpha <= 1)) {
    throw new Error(`Alpha must be between 0 and 1, got ${String(alpha)}`);
  }

  const fg = typeof foreground === "string" ? hexToRgb(foreground) : foreground;
  const bg = typeof background === "string" ? hexToRgb(background) : background;
  const mix = (f: number, b: number): number => Math.round(alpha * f + (1 - alpha) * b);

  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b) };
}

/** sRGB channel → linear-light value. */
function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(colour: Rgb | string): number {
  const { r, g, b } = typeof colour === "string" ? hexToRgb(colour) : colour;
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/** Contrast ratio between two colours, from 1:1 to 21:1. Order-independent. */
export function contrastRatio(a: Rgb | string, b: Rgb | string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = "AA" | "AAA";

/** The ratio a pairing must reach. Large text is ≥24px, or ≥18.66px bold. */
export function requiredRatio(level: WcagLevel, large: boolean): number {
  if (level === "AAA") return large ? 4.5 : 7;
  return large ? 3 : 4.5;
}

export function meetsContrast(
  foreground: string,
  background: string,
  { level = "AA", large = false }: { level?: WcagLevel; large?: boolean } = {},
): boolean {
  return contrastRatio(foreground, background) >= requiredRatio(level, large);
}
