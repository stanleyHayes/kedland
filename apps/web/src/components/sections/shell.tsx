import type { ReactNode } from "react";

/**
 * The one content rail every section sits on.
 *
 * Sections used to each pick their own `max-w-*` and centre it, which meant a
 * page with a 6xl card grid above a 3xl prose block had two different left
 * edges — the eye reads that as things sliding around rather than as a
 * deliberate change of width. One rail fixes the alignment; `Measure` keeps
 * long prose readable *inside* it rather than by shrinking the rail.
 *
 * Anything that needs to break out (full-bleed colour bands) should render its
 * own `<section>` rather than widening this.
 */
export function Shell({
  children,
  space = "normal",
  className = "",
}: Readonly<{
  children: ReactNode;
  /** Vertical rhythm. `tight` follows a page intro; `loose` opens a page. */
  space?: "tight" | "normal" | "loose";
  className?: string;
}>) {
  const padding = { tight: "py-8", normal: "py-12", loose: "py-14" }[space];

  return (
    <section className={`px-6 ${padding} ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/**
 * A comfortable reading measure, left-aligned to the rail.
 *
 * Deliberately not `mx-auto`: centring a narrow column inside a wide rail is
 * exactly the misalignment `Shell` exists to remove.
 */
export function Measure({
  children,
  size = "prose",
  className = "",
}: Readonly<{
  children: ReactNode;
  /** `prose` for text a parent reads end to end; `wide` for stacked cards. */
  size?: "prose" | "wide";
  className?: string;
}>) {
  const width = size === "wide" ? "max-w-4xl" : "max-w-3xl";
  return <div className={`${width} ${className}`}>{children}</div>;
}
