import { Skeleton, SkeletonGroup } from "@kedland/ui";

import { Panel } from "@/components/ui/primitives";

/**
 * Route-level placeholder while a dashboard page's RSC payload is in flight.
 *
 * The shell (sidebar, top bar) stays mounted; only the main column swaps to
 * these shapes so the layout does not collapse into the full-page splash used
 * for the very first paint.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[92rem]">
      <SkeletonGroup label="Loading page" className="grid gap-6">
        <div className="min-w-0 max-w-3xl">
          <Skeleton className="h-3 w-28 rounded-pill" />
          <div className="mt-3 flex items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-md" />
            <Skeleton className="h-10 w-56 max-w-full rounded-md" />
          </div>
          <Skeleton className="mt-3 h-4 w-full max-w-xl rounded-pill" />
        </div>

        <Panel>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 min-w-[12rem] flex-1 rounded-md" />
            <Skeleton className="h-11 w-28 rounded-md" />
            <Skeleton className="h-11 w-24 rounded-md" />
          </div>
          <div className="mt-6 grid gap-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-md" />
            ))}
          </div>
        </Panel>
      </SkeletonGroup>
    </div>
  );
}
