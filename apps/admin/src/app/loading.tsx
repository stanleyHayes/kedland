import { SkeletonGroup, SkeletonText } from "@kedland/ui";

export default function Loading() {
  return (
    <SkeletonGroup label="Loading dashboard" className="mx-auto max-w-4xl px-6 py-16">
      <SkeletonText lines={1} className="max-w-[16rem]" />
      <div className="mt-8 space-y-4">
        <SkeletonText lines={3} />
      </div>
    </SkeletonGroup>
  );
}
