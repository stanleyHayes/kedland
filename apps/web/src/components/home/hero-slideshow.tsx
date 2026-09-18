"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonClasses } from "@kedland/ui";

import { AnimatedHeroCopy } from "./animated-hero-copy";

import type { HeroData } from "../sections/blocks";

export function HeroSlideshow({ data }: Readonly<{ data: HeroData }>) {
  const selected = (data.slides ?? []).map((slide) => slide.image).filter((image) => image.src);
  const images = selected.length > 0 ? selected : [data.image];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const current = active % images.length;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || hovered || images.length < 2) return;
    const timer = window.setInterval(() => {
      if (!motion.matches && !document.hidden) setActive((index) => (index + 1) % images.length);
    }, 6000);
    return () => {
      window.clearInterval(timer);
    };
  }, [images.length, paused, hovered]);

  return (
    // Carousel interaction pauses automatic rotation for keyboard and pointer users.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      aria-label="Welcome to Kedland"
      aria-roledescription="carousel"
      className="relative isolate flex min-h-[min(760px,85svh)] items-end overflow-hidden bg-navy text-white"
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
      onFocusCapture={() => {
        setPaused(true);
      }}
    >
      {images.map((image, index) => (
        <div
          key={`${image.mediaId}-${String(index)}`}
          aria-hidden={index !== current}
          className={`absolute inset-0 -z-20 transition-opacity duration-1000 motion-reduce:transition-none ${index === current ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={image.src ?? "/logo/kedland-logo-512.png"}
            alt={image.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className={image.src ? "object-cover" : "object-contain p-20"}
          />
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/30 to-black/10" />
      <div className="mx-auto w-full max-w-7xl px-6 pb-28 pt-32 sm:px-12 sm:pb-32">
        <div className="hero-photo-copy max-w-3xl">
          <AnimatedHeroCopy eyebrow={data.eyebrow} heading={data.heading} subheading={data.subheading} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={data.primaryCta.href} className={buttonClasses({ size: "lg" })}>
            {data.primaryCta.label}
          </Link>
          <Link
            href={data.secondaryCta.href}
            className={buttonClasses({
              variant: "outline",
              size: "lg",
              className: "border-white bg-white text-navy hover:bg-white/90",
            })}
          >
            {data.secondaryCta.label}
          </Link>
        </div>
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4 sm:left-12 sm:right-12">
          <div className="flex min-w-0 max-w-[22rem] flex-1 flex-wrap" aria-label="Choose a photograph">
            {images.map((image, index) => (
              <button
                key={`${image.mediaId}-${String(index)}`}
                type="button"
                aria-label={`Show photograph ${String(index + 1)}`}
                aria-pressed={index === current}
                onClick={() => {
                  setActive(index);
                  setPaused(true);
                }}
                className="grid h-11 w-8 shrink-0 place-items-center sm:w-11 rounded-full focus-visible:outline-2 focus-visible:outline-white"
              >
                <span
                  className={`h-1 w-4 rounded-full sm:w-6 ${index === current ? "bg-white" : "bg-white/40"}`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setPaused((value) => !value);
            }}
            className="min-h-11 shrink-0 rounded-full border border-white/60 bg-black/30 px-4 text-sm text-white"
          >
            {paused ? "Play slideshow" : "Pause slideshow"}
          </button>
        </div>
      )}
    </section>
  );
}
