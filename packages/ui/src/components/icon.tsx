import type { SVGProps } from "react";

/**
 * The school's icon set.
 *
 * Keyed by the `iconName` values the content registry allows, so an editor
 * choosing "music" for a subject gets a music icon without anyone touching
 * code. Every glyph is drawn on the same 24×24 grid with the same 1.75 stroke
 * and round caps, which is what stops a row of them looking like clip-art
 * collected from five different sets.
 *
 * An unknown name renders the star rather than nothing. A missing icon should
 * degrade to the school's own motif, not to a hole in the layout — and never
 * to a thrown error, because the name comes from the CMS.
 */

const PATHS: Record<string, string> = {
  // ── People and care ──────────────────────────────────────────────────────
  baby: "M9 12h.01M15 12h.01M10 16c.5.5 1.2.8 2 .8s1.5-.3 2-.8M12 3a9 9 0 100 18 9 9 0 000-18z",
  heart: "M12 20s-7-4.5-7-9.5A4 4 0 0112 7a4 4 0 017 3.5c0 5-7 9.5-7 9.5z",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z",

  // ── Play and making ──────────────────────────────────────────────────────
  blocks: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  palette:
    "M12 3a9 9 0 000 18c1.1 0 1.7-.9 1.4-1.8-.3-.9.3-1.7 1.2-1.7H17a4 4 0 004-4c0-5.2-4-10.5-9-10.5zM7.5 10.5h.01M10.5 7.5h.01M14 8h.01",
  music: "M9 18V5l10-2v13M9 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 16a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",

  // ── Learning ─────────────────────────────────────────────────────────────
  book: "M4 5a2 2 0 012-2h11v18H6a2 2 0 01-2-2V5zM17 3h1a2 2 0 012 2v14a2 2 0 01-2 2h-1M8 7h5M8 11h5",
  calculator: "M6 3h12v18H6zM9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01",
  monitor: "M3 5h18v11H3zM9 20h6M12 16v4",
  globe:
    "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z",

  // ── Day and time ─────────────────────────────────────────────────────────
  sun: "M12 6a6 6 0 100 12 6 6 0 000-12zM12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z",
  utensils: "M5 3v8a2 2 0 002 2h0a2 2 0 002-2V3M7 13v8M17 3c-1.5 1.5-2 3.5-2 6v3h3V3M18 12v9",

  // ── Motif ────────────────────────────────────────────────────────────────
  star: "M12 3l2.6 5.7 6.4.7-4.8 4.3 1.3 6.3L12 17l-5.5 3 1.3-6.3L3 9.4l6.4-.7L12 3z",
  sparkle:
    "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM18 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z",

  // ── Media ────────────────────────────────────────────────────────────────
  camera:
    "M4 8h3l1.5-2.5h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1zM12 16.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
  images: "M8 3h13v13H8zM3 8v13h13M12 11l2 2 3-3.5",

  // ── Contact ──────────────────────────────────────────────────────────────
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM5 21a7 7 0 0114 0",
  mail: "M3 5h18v14H3zM3 7l9 6 9-6",
  message: "M4 4h16v12H8l-4 4V4zM8 8h8M8 12h5",
  phone:
    "M4 5c0-1 .8-2 1.8-2h2c.8 0 1.5.6 1.7 1.4l.7 3a1.8 1.8 0 01-.5 1.7l-1.3 1.3a13 13 0 005.2 5.2l1.3-1.3a1.8 1.8 0 011.7-.5l3 .7c.8.2 1.4.9 1.4 1.7v2c0 1-1 1.8-2 1.8A16 16 0 014 5z",
  "map-pin": "M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3.5 2",
  "chevron-down": "M6 9l6 6 6-6",
};

/** Every name this set draws. Used by the test that checks CMS coverage. */
export const ICON_NAMES = Object.keys(PATHS);

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  name: string;
  /** Give a meaning-bearing icon a label; leave it off and it is hidden. */
  title?: string;
}

export function Icon({ name, title, className = "", ...rest }: Readonly<IconProps>) {
  const path = PATHS[name] ?? PATHS["star"];

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Decorative unless it was given a label. Most icons on this site sit
      // beside the words they illustrate, and announcing them twice is noise.
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
      {...rest}
    >
      {title && <title>{title}</title>}
      <path d={path} />
    </svg>
  );
}

/**
 * A large, faint icon in the corner of a card.
 *
 * Set at 6% so it reads as texture rather than content — it must never compete
 * with the words, and it must never sit behind text at a contrast that makes
 * the text harder to read. Always decorative: the card already says in words
 * what the watermark is illustrating.
 */
export function Watermark({ name, className = "" }: Readonly<{ name: string; className?: string }>) {
  return (
    <Icon
      name={name}
      strokeWidth={1.25}
      className={`pointer-events-none absolute -bottom-6 -right-5 size-32 opacity-[0.06] ${className}`.trim()}
    />
  );
}
