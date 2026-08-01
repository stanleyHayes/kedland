"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@kedland/ui";

import type { PublicGalleryTile } from "@kedland/types";

interface GalleryMosaicProps {
  tiles: PublicGalleryTile[];
}

// Hydration flips this once and never again, so there is nothing to subscribe
// to — the same idiom as the theme toggle's server snapshot.
const afterHydration = (): (() => void) => () => undefined;
const onClient = (): boolean => true;
const onServer = (): boolean => false;

export function GalleryMosaic({ tiles }: Readonly<GalleryMosaicProps>) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // Buttons stay disabled until hydration so a pre-React click cannot open a
  // lightbox with no listeners attached.
  const interactive = useSyncExternalStore(afterHydration, onClient, onServer);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const activeTrigger = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setActiveIndex(null);
    queueMicrotask(() => activeTrigger.current?.focus());
  }, []);
  const move = useCallback(
    (direction: -1 | 1) => {
      setActiveIndex((current) => {
        if (current === null) return null;
        return (current + direction + tiles.length) % tiles.length;
      });
    },
    [tiles.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
      if (event.key === "Tab") {
        const controls = dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!controls || controls.length === 0) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && first?.matches(":focus")) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && last?.matches(":focus")) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, close, move]);

  if (tiles.length === 0) return null;
  const active = activeIndex === null ? null : tiles[activeIndex];

  return (
    <>
      <ul className="gallery-mosaic mt-9" aria-label="Kedland photo gallery">
        {tiles.map((tile, index) => (
          <li key={tile.id} className={`gallery-tile gallery-tile-${String((index % 6) + 1)}`}>
            <button
              type="button"
              disabled={!interactive}
              className="group relative size-full overflow-hidden rounded-[1.4rem] text-left"
              onClick={(event) => {
                activeTrigger.current = event.currentTarget;
                setActiveIndex(index);
              }}
              aria-label={`Open photo ${String(index + 1)} of ${String(tiles.length)}: ${tile.caption}`}
            >
              {/*
                No `loading="eager"`. Every tile carried it, which loaded the
                whole mosaic up front — the opposite of what a gallery wants.
                `next/image` lazy-loads by default and still fetches anything in
                or near the viewport straight away, so the visible tiles appear
                exactly as before and the rest wait until they are scrolled to.
              */}
              <Image
                src={tile.media.url}
                alt={tile.media.alt}
                fill
                sizes="(min-width: 1024px) 38vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-500 ease-out group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy-deep/90 via-navy-deep/45 to-transparent px-5 pb-4 pt-16 text-white">
                <span className="block font-display text-[1.02rem] font-bold">{tile.caption}</span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-small font-semibold text-white/78">
                  <Icon name="images" className="size-4" />
                  View photo
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {active &&
        activeIndex !== null &&
        createPortal(
          <div
            ref={dialog}
            className="gallery-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Photo ${String(activeIndex + 1)} of ${String(tiles.length)}`}
          >
            <button
              ref={closeButton}
              type="button"
              className="gallery-control gallery-close"
              onClick={close}
              aria-label="Close gallery"
            >
              <Icon name="close" className="size-6" />
            </button>

            <button
              type="button"
              className="gallery-control gallery-previous"
              onClick={() => {
                move(-1);
              }}
              aria-label="Previous photo"
            >
              <Icon name="chevron-left" className="size-7" />
            </button>

            <figure className="gallery-stage">
              <div key={active.id} className="gallery-slide relative">
                <Image
                  src={active.media.url}
                  alt={active.media.alt}
                  fill
                  priority
                  sizes="94vw"
                  className="object-contain"
                />
              </div>
              <figcaption className="mt-4 text-center text-white">
                <p className="font-display text-h3 font-bold text-white">{active.caption}</p>
                <p className="mt-1 text-small text-white/65">
                  {String(activeIndex + 1)} / {String(tiles.length)}
                </p>
              </figcaption>
            </figure>

            <button
              type="button"
              className="gallery-control gallery-next"
              onClick={() => {
                move(1);
              }}
              aria-label="Next photo"
            >
              <Icon name="chevron-right" className="size-7" />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
