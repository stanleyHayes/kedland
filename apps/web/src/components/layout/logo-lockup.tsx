import Image from "next/image";
import Link from "next/link";

/**
 * The header's left-hand lockup — the swept-panel logo from the supplied
 * navbar reference, in Kedland's palette.
 *
 * The reference is a rounded slab with a long, level top and one clean curve
 * pulling inward toward the lower-right. Here that panel is a sky→blue
 * gradient, preserving the reference geometry in Kedland's palette.
 *
 * The crest carries "KEDLAND INTERNATIONAL SCHOOL" in its own artwork, but at
 * header size that text is a few pixels tall and reads as texture. So the crest
 * acts as the mark and the name is set beside it in Euclid Circular A, where
 * it is legible. The logo itself is only ever scaled — never recoloured, cropped or
 * redrawn (build package §2.2).
 */
export function LogoLockup({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <Link
      href="/"
      className={`group relative flex shrink-0 items-center gap-3 overflow-hidden rounded-l-[0.75rem] py-1.5 pl-3 pr-10 sm:gap-3.5 sm:pr-14 ${className}`.trim()}
    >
      {/*
        The swept panel behind the crest and wordmark.

        `preserveAspectRatio="none"` lets it stretch to the lockup's width.
        Its right edge deliberately uses one continuous cubic sweep. The old
        two-curve edge changed direction near the bottom and produced a bulb;
        the supplied reference does not. The SVG runs beyond the lockup at the
        top, while its lower edge finishes at roughly 72% of the visible width.
      */}
      <svg
        aria-hidden="true"
        data-testid="logo-wave"
        viewBox="0 0 260 96"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 h-full w-[132%]"
      >
        <defs>
          <linearGradient id="kedland-lockup-wave" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-sky)" />
            <stop offset="55%" stopColor="var(--color-sky)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--color-blue)" stopOpacity="0.28" />
          </linearGradient>
        </defs>
        <path
          data-testid="logo-panel-shape"
          d="M18 0 H260 C218 7 202 22 190 48 C178 74 170 96 140 96 H18 C8 96 0 88 0 78 V18 C0 8 8 0 18 0 Z"
          fill="url(#kedland-lockup-wave)"
        />
      </svg>

      <Image
        src="/logo/kedland-logo-256.png"
        alt=""
        width={256}
        height={256}
        priority
        className="h-10 w-auto sm:h-12"
      />

      <span className="flex min-w-0 flex-col leading-none">
        <span className="font-display text-[1.35rem] font-extrabold tracking-tight text-navy sm:text-[1.5rem]">
          Kedland
        </span>
        <span className="mt-1 hidden text-[0.74rem] font-semibold tracking-wide text-navy/75 sm:block">
          The future begins here
        </span>
      </span>

      {/* The crest already spells the school's full name; the visible text is a
          shortening. This gives the link the whole name for a screen reader. */}
      <span className="sr-only">Kedland International School — home</span>
    </Link>
  );
}
