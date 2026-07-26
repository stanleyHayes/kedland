import { GalleryMosaic } from "./gallery-mosaic";

import { getGalleryTiles } from "@/lib/api";

/** Reuses the dashboard-curated gallery wherever the public story needs visual evidence. */
export async function CmsGallerySection() {
  const tiles = await getGalleryTiles();

  return (
    <section className="bg-sky/18 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-small font-bold uppercase tracking-[0.1em] text-red-text">Inside Kedland</p>
        <div className="mt-2 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <h2>Spaces made for bright beginnings</h2>
          <p className="max-w-2xl text-ink/72 lg:justify-self-end">
            Explore the classrooms, creative corners and outdoor spaces that shape each school day.
          </p>
        </div>
        <GalleryMosaic tiles={tiles} />
      </div>
    </section>
  );
}
