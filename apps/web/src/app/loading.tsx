import { SkeletonCard, SkeletonGroup, SkeletonText } from "@kedland/ui";

/**
 * Route-level loading state. Next renders this while the segment resolves.
 *
 * The shapes mirror the real page's layout so the frame never shifts when
 * content arrives — a spinner would tell the visitor nothing and cost CLS.
 */
export default function Loading() {
  return (
    <SkeletonGroup label="Loading page" className="mx-auto max-w-4xl px-6 py-16">
      <SkeletonText lines={1} className="max-w-[12rem]" />
      <div className="mt-6 space-y-3">
        <SkeletonText lines={2} />
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <SkeletonCard withMedia={false} />
        <SkeletonCard withMedia={false} />
      </div>
    </SkeletonGroup>
  );
}
