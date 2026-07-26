import Image from "next/image";

import { Icon } from "@kedland/ui";

export default function Loading() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="admin-splash relative grid min-h-dvh place-items-center overflow-hidden px-6 py-14 text-center"
    >
      <Icon
        name="shield"
        strokeWidth={1}
        className="pointer-events-none absolute -bottom-28 -left-24 size-[26rem] text-blue/[0.07]"
      />
      <Icon
        name="star"
        strokeWidth={1}
        className="pointer-events-none absolute -right-24 top-8 size-80 text-yellow/[0.08]"
      />

      <div className="relative">
        <div className="admin-splash-mark mx-auto grid size-28 place-items-center rounded-lg bg-cream p-3 sm:size-32">
          <Image
            src="/logo/kedland-logo-256.png"
            alt=""
            width={256}
            height={256}
            priority
            className="size-full object-contain"
          />
          <span className="admin-splash-orbit" aria-hidden="true">
            <Icon name="shield" className="size-5" />
          </span>
        </div>

        <p className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.17em] text-yellow">
          Kedland workspace
        </p>
        <h1 className="mt-3 text-[clamp(2rem,5vw,3rem)] !text-white">Preparing your dashboard</h1>
        <p className="mx-auto mt-3 max-w-md text-white/55">
          Bringing school operations, enquiries and publishing tools into view.
        </p>

        <div className="mt-7 flex justify-center gap-2 text-blue" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Icon
              key={index}
              name="star"
              className="admin-splash-pulse size-4"
              style={{ animationDelay: `${String(index * 160)}ms` }}
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading dashboard</span>
    </section>
  );
}
