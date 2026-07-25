import type { ReactNode } from "react";

/**
 * Cards and chips — build package §2.5.
 *
 * White on cream, the large radius, a soft navy-tinted shadow, and a lift on
 * hover. The optional coloured top border is the "colourful top border or icon
 * chip" the package calls for.
 */

export type AccentColour = "red" | "pink" | "blue" | "yellow" | "green" | "orange" | "navy";

const TOP_BORDERS: Record<AccentColour, string> = {
  red: "before:bg-red",
  pink: "before:bg-pink",
  blue: "before:bg-blue",
  yellow: "before:bg-yellow",
  green: "before:bg-green",
  orange: "before:bg-orange",
  navy: "before:bg-navy",
};

export interface CardProps {
  children: ReactNode;
  /** Adds the coloured strip across the top of the card. */
  accent?: AccentColour;
  /** Lifts on hover. Off for cards that are not themselves a link. */
  interactive?: boolean;
  className?: string;
}

export function Card({ children, accent, interactive = false, className = "" }: Readonly<CardProps>) {
  const accentClasses =
    accent === undefined
      ? ""
      : `relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:content-[''] ${TOP_BORDERS[accent]}`;

  const hover = interactive
    ? "transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lift motion-reduce:transform-none motion-reduce:transition-none"
    : "";

  return (
    <div className={`rounded-lg bg-white p-6 shadow-card ${accentClasses} ${hover} ${className}`.trim()}>
      {children}
    </div>
  );
}

const CHIP_TONES: Record<AccentColour | "sky", string> = {
  red: "bg-red/12 text-red-text",
  pink: "bg-pink/12 text-pink",
  blue: "bg-blue/15 text-navy",
  yellow: "bg-yellow/25 text-ink",
  green: "bg-green/15 text-navy",
  orange: "bg-orange/15 text-ink",
  navy: "bg-navy text-white",
  sky: "bg-sky/45 text-navy",
};

export interface ChipProps {
  children: ReactNode;
  tone?: AccentColour | "sky";
  className?: string;
}

/** A small rounded label — the trust chips under the hero, category tags. */
export function Chip({ children, tone = "sky", className = "" }: Readonly<ChipProps>) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3.5 py-1.5 text-small font-semibold ${CHIP_TONES[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
