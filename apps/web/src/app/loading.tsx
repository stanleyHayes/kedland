import Image from "next/image";

import { Icon } from "@kedland/ui";

/**
 * A short branded interstitial while a public route resolves. The crest and
 * stars are real Kedland assets, and motion is disabled by the shared
 * reduced-motion rule.
 */
export default function Loading() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="kedland-splash relative grid min-h-[calc(100dvh-5.5rem)] place-items-center overflow-hidden px-6 py-16"
    >
      <Icon
        name="star"
        strokeWidth={1}
        className="pointer-events-none absolute -left-16 top-16 size-48 text-yellow/15"
      />
      <Icon
        name="star"
        strokeWidth={1}
        className="pointer-events-none absolute -bottom-20 right-[8%] size-64 text-blue/10"
      />

      <div className="relative text-center">
        <div className="kedland-splash-mark neu-surface mx-auto grid size-28 place-items-center rounded-lg bg-cream p-3 sm:size-32">
          <Image
            src="/logo/kedland-logo-256.png"
            alt=""
            width={256}
            height={256}
            priority
            className="size-full object-contain"
          />
          <span className="kedland-splash-orbit" aria-hidden="true">
            <Icon name="star" className="size-5" />
          </span>
        </div>

        <p className="mt-8 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-red-text">
          Kedland International School
        </p>
        <h1 className="mt-3 text-[clamp(2rem,5vw,3.25rem)]">A bright moment is on its way</h1>
        <p className="mx-auto mt-3 max-w-md text-grey">Preparing the next part of your Kedland journey.</p>

        <div className="mt-7 flex justify-center gap-2 text-blue" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Icon
              key={index}
              name="star"
              className="kedland-splash-pulse size-4"
              style={{ animationDelay: `${String(index * 160)}ms` }}
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading page</span>
    </section>
  );
}
