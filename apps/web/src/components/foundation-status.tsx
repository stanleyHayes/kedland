import { SkeletonCard, SkeletonGroup, SkeletonText } from "@kedland/ui";

interface Check {
  readonly label: string;
  readonly detail: string;
}

const CHECKS: readonly Check[] = [
  { label: "Brand tokens", detail: "Palette, radii and type scale from the build package" },
  { label: "Typography", detail: "Baloo 2 and Nunito, self-hosted with swap" },
  { label: "Skeletons", detail: "Shape-stable loading, no spinners" },
  { label: "Accessibility", detail: "Skip link, focus rings, reduced motion" },
];

/**
 * Phase 0 placeholder.
 *
 * The real home page is built section-by-section from the CMS registry in
 * Phase 4 (agent_plan §8). This stands in until then and earns its place by
 * proving the foundation actually wires together: tokens resolve, both fonts
 * load, `@kedland/ui` imports across the workspace boundary, and the skeleton
 * primitives render with their accessibility contract intact.
 */
export function FoundationStatus() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-small font-bold uppercase tracking-[0.06em] text-red-text">The future begins here</p>

      <h1 className="mt-3">Kedland International School</h1>

      <p className="mt-4 max-w-2xl text-grey">
        Foundation scaffold. The public site is built page-by-page from the content registry in Phase 4 — this
        placeholder exists to prove the design system, fonts and shared packages are wired end to end.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {CHECKS.map((check) => (
          <li key={check.label} className="rounded-lg bg-white p-5 shadow-card">
            <h2 className="text-h3">{check.label}</h2>
            <p className="mt-1 text-small text-grey">{check.detail}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-h3">Loading states</h2>
      <p className="mt-1 text-small text-grey">
        Every pending state on this site is a shape-stable skeleton, so nothing moves when content lands.
      </p>

      <SkeletonGroup label="Loading example content" className="mt-5 grid gap-4 sm:grid-cols-2">
        <SkeletonCard />
        <div className="rounded-lg bg-white p-5 shadow-card">
          <SkeletonText lines={4} />
        </div>
      </SkeletonGroup>
    </section>
  );
}
