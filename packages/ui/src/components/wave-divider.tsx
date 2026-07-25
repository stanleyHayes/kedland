/**
 * Wavy section dividers.
 *
 * Build package §2.5 asks for organic edges between coloured bands rather than
 * straight rules — it is a school for young children, and a hard horizontal
 * line reads as a spreadsheet.
 *
 * The wave is filled with the colour of the section it flows *into*, so it
 * belongs at the bottom of the outgoing band. All of it is `aria-hidden`:
 * decoration that a screen reader should never mention.
 */

/** Tailwind fill utilities, so the palette stays in the token layer. */
export type WaveFill = "cream" | "white" | "sky" | "navy" | "navyDeep" | "yellow";

const FILLS: Record<WaveFill, string> = {
  cream: "fill-cream",
  white: "fill-white",
  sky: "fill-sky",
  navy: "fill-navy",
  navyDeep: "fill-navy-deep",
  yellow: "fill-yellow",
};

export type WaveVariant = "gentle" | "deep" | "double";

/** Drawn on a 1440×120 grid and stretched — the curve keeps its character at any width. */
const PATHS: Record<WaveVariant, string> = {
  gentle: "M0 60 C240 10 480 10 720 45 C960 80 1200 100 1440 60 L1440 120 L0 120 Z",
  deep: "M0 30 C180 100 420 110 720 70 C1020 30 1260 20 1440 75 L1440 120 L0 120 Z",
  double: "M0 55 C160 15 320 15 480 50 C640 85 800 95 960 65 C1120 35 1280 30 1440 60 L1440 120 L0 120 Z",
};

export interface WaveDividerProps {
  /** The colour of the section below — the wave flows into it. */
  fill: WaveFill;
  variant?: WaveVariant;
  /** Mirrors the curve vertically, for a wave at the top of a band. */
  flip?: boolean;
  className?: string;
}

export function WaveDivider({
  fill,
  variant = "gentle",
  flip = false,
  className = "",
}: Readonly<WaveDividerProps>) {
  return (
    <svg
      aria-hidden="true"
      data-testid="wave-divider"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={`block h-[clamp(2.5rem,6vw,5rem)] w-full ${flip ? "rotate-180" : ""} ${className}`.trim()}
    >
      <path d={PATHS[variant]} className={FILLS[fill]} />
    </svg>
  );
}
