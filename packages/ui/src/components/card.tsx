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
  /**
   * The card's own padding. Set false when the content reaches its edges — a
   * cover image, a full-bleed band — and supply your own spacing inside.
   *
   * A prop rather than `className="p-0"`, because that does not reliably win;
   * see the note where it is used.
   */
  padded?: boolean;
  className?: string;
}

export function Card({
  children,
  accent,
  interactive = false,
  padded = true,
  className = "",
}: Readonly<CardProps>) {
  const accentClasses =
    accent === undefined
      ? ""
      : `relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:content-[''] ${TOP_BORDERS[accent]}`;

  /*
   * `neu-interactive` rather than a flat shadow swap.
   *
   * The recipe carries both the lift and the deeper double shadow, so a card
   * that rises also casts further — which is the whole point of the effect and
   * the part a `hover:shadow-lift` cannot express. It disables its own motion
   * under `prefers-reduced-motion` in the stylesheet.
   */
  const hover = interactive ? "neu-interactive" : "";

  /*
   * `padded={false}` rather than `className="p-0"`.
   *
   * Passing a padding utility from a call site cannot be relied on: Tailwind
   * resolves competing utilities by their order in the generated stylesheet, not
   * by the order they appear in a class string, and `p-0` is generated before
   * `p-6`. So a card asking for no padding silently kept 24px of it — which is
   * what put a visible inset around the news cards' cover images. Not emitting
   * the class is the only version of this that always works.
   */
  const padding = padded ? "p-6" : "";

  return (
    <div className={`neu-surface rounded-lg ${padding} ${accentClasses} ${hover} ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * A small raised square or circle holding an icon or a number.
 *
 * One component for what had become five near-identical hand-rolled squares —
 * the nav dropdown rows, the quick-links panel, the contact card, the subject
 * cards and the numbered EYFS areas. Neumorphism only reads as deliberate when
 * every raised element shares a light source, and that is impossible to hold by
 * hand across five files.
 */
export type BadgeTone = "cool" | "warm" | "solid";
export type BadgeShape = "square" | "circle";

const BADGE_TONES: Record<BadgeTone, string> = {
  cool: "neu-icon text-navy",
  warm: "neu-icon-warm text-ink",
  // Filled, for the current item or a step's number — depth from the button
  // recipe so it matches the controls rather than the surfaces.
  solid: "neu-button neu-button-secondary bg-navy text-white",
};

export interface IconBadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  shape?: BadgeShape;
  /** A Tailwind size utility. Defaults to a 2rem badge. */
  size?: string;
  className?: string;
}

export function IconBadge({
  children,
  tone = "cool",
  shape = "square",
  size = "size-8",
  className = "",
}: Readonly<IconBadgeProps>) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center ${size} ${
        shape === "circle" ? "rounded-pill" : "rounded-md"
      } ${BADGE_TONES[tone]} ${className}`.trim()}
    >
      {children}
    </span>
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
