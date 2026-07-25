/**
 * Decorative spot art — build package §2.5.
 *
 * Stars (the school calls its pupils "Stars", and the crest carries three),
 * organic blobs behind imagery, and crayon squiggles. Kept light: these sit
 * behind content, never on top of it, and every one is `aria-hidden`.
 */

export interface SpotProps {
  className?: string;
}

/** The brand's five-point star, matching the three on the crest. */
export function Star({ className = "" }: Readonly<SpotProps>) {
  return (
    <svg aria-hidden="true" data-testid="spot-star" viewBox="0 0 24 24" className={className}>
      <path
        d="M12 2.6 14.9 8.5 21.4 9.4 16.7 14 17.8 20.5 12 17.4 6.2 20.5 7.3 14 2.6 9.4 9.1 8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * An organic blob, for masking imagery or sitting behind a card.
 *
 * Four shapes so a page using several does not look stamped. Pick by index —
 * `Math.random()` would give a different mark on server and client and trip
 * React's hydration check.
 */
const BLOBS = [
  "M46.5 -60.3C58.9 -50.4 66.1 -33.9 68.9 -17.4C71.7 -0.9 70.1 15.7 63 29.7C55.9 43.7 43.3 55.1 28.8 61.6C14.3 68.1 -2.1 69.7 -18.6 65.9C-35.1 62.1 -51.7 52.9 -60.6 39.1C-69.5 25.3 -70.7 6.9 -66.9 -9.6C-63.1 -26.1 -54.3 -40.7 -42.1 -50.8C-29.9 -60.9 -14.9 -66.5 1.6 -68.4C18.1 -70.3 34.1 -70.2 46.5 -60.3Z",
  "M54.2 -57.4C69.1 -45.8 78.4 -26.4 78.6 -7.3C78.8 11.8 69.9 30.6 56.6 43.8C43.3 57 25.6 64.6 6.9 67.2C-11.8 69.8 -31.5 67.4 -46.9 57.5C-62.3 47.6 -73.4 30.2 -76.4 11.4C-79.4 -7.4 -74.3 -27.6 -62.6 -40.9C-50.9 -54.2 -32.6 -60.6 -14.9 -63.4C2.8 -66.2 20.9 -65.4 54.2 -57.4Z",
  "M41.3 -54.8C53.1 -45.6 61.5 -32.1 66.2 -17.2C70.9 -2.3 71.9 14 66.2 27.5C60.5 41 48.1 51.7 34.2 58.8C20.3 65.9 4.9 69.4 -10.9 68.2C-26.7 67 -42.9 61.1 -53.9 50C-64.9 38.9 -70.7 22.6 -71.4 6.1C-72.1 -10.4 -67.7 -27.1 -57.6 -38.6C-47.5 -50.1 -31.7 -56.4 -16.5 -60.1C-1.3 -63.8 13.3 -64.9 41.3 -54.8Z",
  "M48.9 -52.1C62.5 -40.4 72 -23.7 74.3 -5.8C76.6 12.1 71.7 31.2 60.4 45.2C49.1 59.2 31.4 68.1 12.6 71.2C-6.2 74.3 -26.1 71.6 -42.4 61.8C-58.7 52 -71.4 35.1 -75.2 16.4C-79 -2.3 -73.9 -22.8 -62.4 -37.2C-50.9 -51.6 -33 -59.9 -16 -62.4C1 -64.9 17.1 -61.6 48.9 -52.1Z",
] as const;

export interface BlobProps extends SpotProps {
  /** Which of the four shapes. Wraps, so any number is safe. */
  shape?: number;
}

export function Blob({ className = "", shape = 0 }: Readonly<BlobProps>) {
  const path = BLOBS[Math.abs(shape) % BLOBS.length] ?? BLOBS[0];
  return (
    <svg aria-hidden="true" data-testid="spot-blob" viewBox="-100 -100 200 200" className={className}>
      <path d={path} fill="currentColor" />
    </svg>
  );
}

/** A crayon squiggle, for underlining a word or filling a corner. */
export function Squiggle({ className = "" }: Readonly<SpotProps>) {
  return (
    <svg
      aria-hidden="true"
      data-testid="spot-squiggle"
      viewBox="0 0 120 20"
      fill="none"
      className={className}
    >
      <path
        d="M2 12C12 2 22 2 32 12S52 22 62 12s20-10 30 0 16 8 26-2"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Scattered dots — confetti behind a heading or a hero. */
export function Confetti({ className = "" }: Readonly<SpotProps>) {
  const dots = [
    { cx: 8, cy: 14, r: 3 },
    { cx: 30, cy: 6, r: 2 },
    { cx: 52, cy: 18, r: 2.5 },
    { cx: 74, cy: 9, r: 2 },
    { cx: 96, cy: 20, r: 3 },
    { cx: 20, cy: 30, r: 2 },
    { cx: 64, cy: 34, r: 2.5 },
  ];

  return (
    <svg aria-hidden="true" data-testid="spot-confetti" viewBox="0 0 110 42" className={className}>
      {dots.map((d) => (
        <circle key={`${String(d.cx)}-${String(d.cy)}`} cx={d.cx} cy={d.cy} r={d.r} fill="currentColor" />
      ))}
    </svg>
  );
}
