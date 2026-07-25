import type { CSSProperties, ReactNode } from "react";

/**
 * Skeleton loading primitives.
 *
 * The rule for this project is: **no spinners** (agent_plan §7.5). Every
 * loading state is a shape-stable placeholder matching the final layout's
 * dimensions, so nothing moves when the content arrives — which is also how the
 * CLS < 0.1 budget is met rather than merely hoped for.
 *
 * Accessibility contract: the *group* announces itself once via a live region
 * with a meaningful label; the individual shapes are `aria-hidden`. A screen
 * reader hears "Loading news", not thirty empty rectangles.
 */

export type SkeletonTone = "surface" | "dark";

export interface SkeletonProps {
  className?: string;
  tone?: SkeletonTone;
  style?: CSSProperties;
}

/** One decorative placeholder shape. Always wrap groups in `SkeletonGroup`. */
export function Skeleton({ className = "", tone = "surface", style }: Readonly<SkeletonProps>) {
  const toneClass = tone === "dark" ? "kedland-skeleton--dark" : "";
  return (
    <span
      aria-hidden="true"
      data-testid="skeleton"
      className={`kedland-skeleton block ${toneClass} ${className}`.trim()}
      style={style}
    />
  );
}

export interface SkeletonGroupProps {
  children: ReactNode;
  /** What is loading, in words a person would use. Announced to screen readers. */
  label: string;
  /**
   * Layout classes for the children.
   *
   * Applied to the wrapper the children actually sit in, not to the outer live
   * region. The live region also holds the visually-hidden label, so a grid or
   * flex class placed there would lay out *that* instead — the children would
   * collapse into a single track. Putting it here keeps `sm:grid-cols-2`
   * meaning what the caller expects.
   */
  className?: string;
}

/** Accessible wrapper for a set of skeleton shapes. */
export function SkeletonGroup({ children, label, className = "" }: Readonly<SkeletonGroupProps>) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    </div>
  );
}

/** Widths cycle so stacked lines look like prose rather than a solid block. */
const LINE_WIDTHS = ["w-full", "w-11/12", "w-10/12", "w-9/12"] as const;

export interface SkeletonTextProps {
  lines?: number;
  tone?: SkeletonTone;
  className?: string;
}

/** A paragraph-shaped placeholder. */
export function SkeletonText({ lines = 3, tone = "surface", className = "" }: Readonly<SkeletonTextProps>) {
  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={`line-${String(i)}`}
          tone={tone}
          className={`h-3 rounded-pill ${LINE_WIDTHS[i % LINE_WIDTHS.length] ?? "w-full"}`}
        />
      ))}
    </div>
  );
}

export interface SkeletonCardProps {
  /** Mirrors the real card, which leads with a rounded cover image. */
  withMedia?: boolean;
  lines?: number;
  className?: string;
}

/** Stands in for a news/post card while the grid loads. */
export function SkeletonCard({ withMedia = true, lines = 2, className = "" }: Readonly<SkeletonCardProps>) {
  return (
    <div className={`rounded-lg bg-white p-4 shadow-card ${className}`.trim()}>
      {withMedia && <Skeleton className="mb-4 aspect-[16/10] w-full rounded-md" />}
      <Skeleton className="mb-3 h-5 w-3/4 rounded-pill" />
      <SkeletonText lines={lines} />
    </div>
  );
}

export interface BusyLabelProps {
  /** Describes the pending action, e.g. "Publishing post". */
  label: string;
  tone?: SkeletonTone;
  className?: string;
}

/**
 * In-place pending state for a button or row action. The control keeps its
 * width, so a toolbar never jumps while something saves.
 */
export function BusyLabel({ label, tone = "surface", className = "" }: Readonly<BusyLabelProps>) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex min-h-4 items-center gap-2 ${className}`.trim()}
    >
      <span className="sr-only">{label}</span>
      <Skeleton tone={tone} className="size-2.5 shrink-0 rounded-pill" />
      <Skeleton tone={tone} className="h-2.5 w-16 rounded-pill" />
    </span>
  );
}
