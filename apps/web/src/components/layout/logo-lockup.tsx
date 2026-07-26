import Image from "next/image";
import Link from "next/link";

/**
 * The header's left-hand lockup — the swept-panel logo from the supplied
 * navbar reference, in Kedland's palette.
 *
 * The reference is a compact, dark rounded slab with a long, level top and one
 * clean curve pulling inward toward the lower-right. Kedland keeps that visual
 * hierarchy in its own navy palette: quiet plaque, bright wordmark, muted
 * strapline and a smaller native crest.
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
      /*
       * No `overflow-hidden`.
       *
       * It was clipping the swept panel: the SVG is deliberately wider than the
       * link (the sweep has to finish outside the text's box), so a clip at the
       * link's boundary sliced the curve off flat — which is exactly the "right
       * side isn't sharp, something is cutting it off" symptom. The panel's own
       * rounded corners come from the shape itself, so nothing needs clipping.
       */
      className={`group relative flex shrink-0 items-center gap-2.5 py-1.5 pl-6 pr-10 sm:gap-3 sm:pl-7 sm:pr-14 ${className}`.trim()}
    >
      {/*
        The swept panel behind the crest and wordmark.

        The reference shape is a rounded slab with one clean concave sweep
        pulling in at the lower right — and it is drawn here by *subtracting a
        circle* from that corner rather than by approximating the curve with
        cubic control points. The circle sits just outside the canvas: its
        radius keeps the lower edge ending near 70% of the width while its arc
        exits cleanly through the top-right corner. That avoids the short blunt
        vertical tail left by a circle centred directly on the corner.

        `preserveAspectRatio="none"` lets the panel stretch to the lockup's
        width; the mask scales with it.

        That stretch is also why the panel's *left* corners are rounded in CSS
        rather than by `rx`. A viewBox radius is scaled by the same non-uniform
        factor as everything else, so `rx="16"` arrives on screen as roughly 24px
        horizontally by 12px vertically — an ellipse, and wider than the bar's own
        14px corner. The panel then sat inside the bar's corner instead of on it,
        leaving the curve visibly crossing the bar's edge. `rounded-l-lg` is a
        real 14px in both directions and matches the bar exactly, because it is
        the same token the bar uses.
      */}
      <svg
        aria-hidden="true"
        data-testid="logo-wave"
        viewBox="0 0 260 96"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 h-full w-[128%] overflow-hidden rounded-l-lg"
      >
        <defs>
          <linearGradient id="kedland-lockup-wave" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-navy-deep)" />
            <stop offset="72%" stopColor="var(--color-navy-deep)" />
            <stop offset="100%" stopColor="var(--color-navy)" />
          </linearGradient>

          <mask id="kedland-lockup-mask">
            {/* White keeps, black cuts — a mask channel is an opacity opcode,
                not a colour, which is why these are keywords and not tokens. */}
            <rect x="-16" width="276" height="96" rx="16" fill="white" />
            <circle cx="284" cy="96" r="99" fill="black" />
          </mask>
        </defs>

        {/*
          Shifted 16 left and 16 wider, so its two left rounded corners fall
          outside the viewBox and are clipped away. What is left inside the
          viewBox is square on the left — which is what lets the CSS radius above
          be the only thing rounding that edge — while the right corners keep
          their `rx` for the small step the sweep leaves at the top right.
        */}
        <rect
          data-testid="logo-panel-shape"
          x="-16"
          width="276"
          height="96"
          rx="16"
          fill="url(#kedland-lockup-wave)"
          mask="url(#kedland-lockup-mask)"
        />
      </svg>

      <Image
        src="/logo/kedland-logo-256.png"
        alt=""
        width={256}
        height={256}
        priority
        className="brand-sticker size-9 rounded-[0.6rem] bg-white/95 object-contain p-1 shadow-sm sm:size-10"
      />

      <span className="flex min-w-0 flex-col leading-none">
        <span className="font-display text-[1.2rem] font-extrabold tracking-[-0.025em] text-white sm:text-[1.35rem]">
          Kedland
        </span>
        <span className="mt-1 hidden text-[0.68rem] font-semibold tracking-[0.035em] text-sky/85 sm:block">
          The future begins here
        </span>
      </span>

      {/* The crest already spells the school's full name; the visible text is a
          shortening. This gives the link the whole name for a screen reader. */}
      <span className="sr-only">Kedland International School — home</span>
    </Link>
  );
}
