import Image from "next/image";
import Link from "next/link";

import { Icon } from "@kedland/ui";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-cream px-6 py-16 sm:py-24">
      <Icon
        name="star"
        strokeWidth={1}
        className="pointer-events-none absolute -right-20 top-8 size-72 text-yellow/20"
      />
      <Icon
        name="map-pin"
        strokeWidth={1}
        className="pointer-events-none absolute -bottom-24 -left-16 size-72 text-blue/[0.08]"
      />

      <div className="neu-surface relative mx-auto grid min-h-[32rem] max-w-5xl overflow-hidden rounded-lg p-8 sm:p-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-14">
        <div className="relative mx-auto grid size-52 place-items-center sm:size-64">
          <span className="absolute font-display text-[9rem] font-extrabold leading-none text-sky/35 sm:text-[12rem]">
            404
          </span>
          <span className="neu-icon relative grid size-28 place-items-center rounded-lg bg-cream p-3">
            <Image
              src="/logo/kedland-logo-256.png"
              alt=""
              width={256}
              height={256}
              className="size-full object-contain"
            />
          </span>
        </div>

        <div className="relative mt-8 text-center lg:mt-0 lg:text-left">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-red-text">
            This star wandered off course
          </p>
          <h1 className="mt-3">We could not find that page</h1>
          <p className="mx-auto mt-4 max-w-xl text-grey lg:mx-0">
            The page may have moved, or the link may have a typo. Choose a safe path below and we will get you
            back to Kedland.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              href="/"
              className="neu-button neu-button-primary inline-flex min-h-12 items-center gap-2 rounded-pill bg-red px-7 py-3 font-display font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              <Icon name="star" className="size-4" />
              Back to the home page
            </Link>
            <Link
              href="/contact"
              className="neu-button neu-button-outline inline-flex min-h-12 items-center gap-2 rounded-pill border-2 border-navy px-7 py-3 font-display font-bold text-navy transition-transform hover:-translate-y-0.5"
            >
              <Icon name="message" className="size-4" />
              Contact the school
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
