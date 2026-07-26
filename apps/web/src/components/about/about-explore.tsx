import Link from "next/link";

import { Icon, Watermark } from "@kedland/ui";

import type { PageKey } from "@kedland/types";

const ABOUT_LINKS = [
  {
    page: "about/our-story",
    href: "/about/our-story",
    label: "Our Story",
    description: "From a summer school with a big heart to a growing community of Stars.",
    icon: "book",
    tone: "bg-blue/12 text-blue",
  },
  {
    page: "about/mission-vision-values",
    href: "/about/mission-vision-values",
    label: "Mission, Vision & Values",
    description: "The beliefs and seven promises that shape every day at Kedland.",
    icon: "heart",
    tone: "bg-pink/12 text-pink",
  },
  {
    page: "about/principal",
    href: "/about/principal",
    label: "Principal's Welcome",
    description: "A personal welcome from Mary to every child and every family.",
    icon: "user",
    tone: "bg-yellow/30 text-navy",
  },
  {
    page: "about/facilities",
    href: "/about/facilities",
    label: "Our Facilities",
    description: "Explore the calm, colourful spaces designed around young learners.",
    icon: "blocks",
    tone: "bg-green/15 text-green",
  },
] as const;

interface AboutExploreProps {
  current: PageKey;
}

/** A shared wayfinder that makes the five About routes feel like one story. */
export function AboutExplore({ current }: Readonly<AboutExploreProps>) {
  const links =
    current === "about"
      ? ABOUT_LINKS
      : [
          {
            page: "about" as const,
            href: "/about",
            label: "About overview",
            description: "Start with the people, purpose and spirit behind Kedland.",
            icon: "sparkle",
            tone: "bg-red/10 text-red-text",
          },
          ...ABOUT_LINKS.filter((item) => item.page !== current),
        ];

  return (
    <section className="relative overflow-hidden bg-sky/20 px-6 py-14 sm:py-16">
      <Icon
        name="sparkle"
        className="pointer-events-none absolute -left-16 -top-16 size-56 text-blue/[0.05]"
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="text-small font-bold uppercase tracking-[0.08em] text-red-text">
          {current === "about" ? "DISCOVER OUR SCHOOL" : "KEEP EXPLORING"}
        </p>
        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h2 className="max-w-2xl">
            {current === "about" ? "Get to know the heart of Kedland" : "More about Kedland"}
          </h2>
          <p className="max-w-md text-small leading-relaxed text-grey sm:text-right">
            Every part of our school begins with the same idea: children thrive when they feel known, safe and
            inspired.
          </p>
        </div>

        <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group relative flex h-full min-h-56 flex-col overflow-hidden rounded-[1.25rem] border border-navy/8 bg-white p-6 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-blue/30 hover:shadow-lift motion-reduce:transform-none motion-reduce:transition-none"
              >
                <Watermark
                  name={item.icon}
                  className="size-40 text-navy opacity-[0.045] transition-transform duration-300 group-hover:-translate-x-2 group-hover:-translate-y-2 motion-reduce:transform-none motion-reduce:transition-none"
                />
                <span className={`relative grid size-12 place-items-center rounded-[0.875rem] ${item.tone}`}>
                  <Icon name={item.icon} className="size-6" />
                </span>
                <h3 className="relative mt-7 text-[1.18rem]">{item.label}</h3>
                <p className="relative mt-2 text-small leading-relaxed text-grey">{item.description}</p>
                <span className="relative mt-auto pt-5 font-display font-bold text-blue">
                  Explore <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
