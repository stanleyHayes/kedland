import Link from "next/link";

import { Icon, Star, Watermark } from "@kedland/ui";

import type { Metadata } from "next";

import { GalleryMosaic } from "@/components/gallery/gallery-mosaic";
import { getGalleryTiles } from "@/lib/api";

export const metadata: Metadata = {
  title: "Gallery | Kedland International School",
  description:
    "Explore classrooms, creative corners, outdoor play and everyday moments from Kedland International School.",
  alternates: { canonical: "/gallery" },
};

export default async function Page() {
  const tiles = await getGalleryTiles();

  return (
    <>
      <section className="relative overflow-hidden bg-navy px-6 pb-24 pt-16 text-white sm:pb-28 sm:pt-20">
        <Star className="pointer-events-none absolute -right-12 top-8 size-64 text-yellow/[0.07]" />
        <span className="pointer-events-none absolute -left-32 -top-40 size-[30rem] rounded-pill bg-blue/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-end gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
          <div>
            <p className="text-small font-bold uppercase tracking-[0.16em] text-yellow">
              Life inside Kedland
            </p>
            <h1 className="mt-5 max-w-4xl text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.98] text-white">
              Bright moments, beautifully remembered
            </h1>
          </div>
          <div className="border-l border-white/20 pl-6 lg:mb-1">
            <p className="text-[1.08rem] leading-relaxed text-white/72">
              Step into the classrooms, creative corners and outdoor spaces where our Stars learn, play and
              grow together.
            </p>
            <p className="mt-5 flex items-center gap-2 text-small font-bold uppercase tracking-[0.1em] text-white/45">
              <Icon name="camera" className="size-4 text-yellow" />
              Curated by the Kedland team
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 -mt-12 px-6 pb-20">
        <section className="mx-auto max-w-6xl rounded-lg bg-cream p-5 shadow-lift sm:p-8 lg:p-10">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-small font-bold uppercase tracking-[0.12em] text-red-text">
                Kedland moments
              </p>
              <h2 className="mt-2">A closer look at every school day</h2>
            </div>
            <p className="max-w-2xl text-ink/72 lg:justify-self-end">
              Select any photograph to open the gallery. Use the arrow keys to move between moments, and
              Escape to return to the page.
            </p>
          </div>

          <GalleryMosaic tiles={tiles} />
        </section>

        <aside className="relative mx-auto mt-14 max-w-6xl overflow-hidden rounded-lg bg-sky/35 p-8 sm:flex sm:items-center sm:justify-between sm:gap-10 sm:p-10">
          <Watermark name="star" className="text-navy" />
          <div className="relative">
            <p className="text-small font-bold uppercase tracking-[0.11em] text-red-text">
              Come and see for yourself
            </p>
            <h2 className="mt-2 text-h3">Picture your child at Kedland</h2>
            <p className="mt-2 max-w-2xl text-small text-grey">
              Explore a typical day, then contact the school team when you are ready to visit.
            </p>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-3 sm:mt-0 sm:justify-end">
            <Link
              href="/student-life"
              className="inline-flex min-h-12 items-center rounded-pill border-2 border-navy px-6 py-3 font-display font-bold text-navy transition-colors hover:bg-navy hover:text-white"
            >
              Explore student life
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center rounded-pill bg-navy px-6 py-3 font-display font-bold text-white transition-colors hover:bg-navy-deep"
            >
              Arrange a visit
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
