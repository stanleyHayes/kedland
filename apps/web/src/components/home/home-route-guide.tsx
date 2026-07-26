import Link from "next/link";

import { Icon, Watermark } from "@kedland/ui";

const HOME_ROUTES = [
  {
    href: "/academics/early-years",
    eyebrow: "STARTING SMALL",
    title: "Early Years",
    description: "Play, discovery and strong first foundations.",
    icon: "baby",
    tone: "bg-pink/12 text-pink",
  },
  {
    href: "/academics/primary",
    eyebrow: "GROWING CURIOUS",
    title: "Primary",
    description: "Cambridge learning built around questions and ideas.",
    icon: "book",
    tone: "bg-blue/12 text-blue",
  },
  {
    href: "/student-life",
    eyebrow: "BEYOND LESSONS",
    title: "School Life",
    description: "A joyful day of learning, play, art and friendship.",
    icon: "sun",
    tone: "bg-yellow/30 text-navy",
  },
  {
    href: "/about/facilities",
    eyebrow: "ROOM TO THRIVE",
    title: "Our Facilities",
    description: "Purposeful spaces made for young learners.",
    icon: "blocks",
    tone: "bg-green/15 text-green",
  },
  {
    href: "/news",
    eyebrow: "WHAT'S HAPPENING",
    title: "Latest News",
    description: "Stories and updates from our community of Stars.",
    icon: "message",
    tone: "bg-orange/15 text-orange",
  },
  {
    href: "/admissions",
    eyebrow: "YOUR NEXT STEP",
    title: "Join Kedland",
    description: "See how to begin your child's journey with us.",
    icon: "sparkle",
    tone: "bg-red/10 text-red-text",
  },
] as const;

/** Short, visual onward journeys for parents who are ready to explore. */
export function HomeRouteGuide() {
  return (
    <section className="relative overflow-hidden bg-sky/20 px-6 py-16 sm:py-20">
      <Icon name="star" className="pointer-events-none absolute -left-20 -top-20 size-72 text-blue/[0.045]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-small font-bold uppercase tracking-[0.1em] text-red-text">EXPLORE KEDLAND</p>
            <h2 className="mt-3">Where would you like to go next?</h2>
          </div>
          <p className="max-w-xl text-ink/75 lg:justify-self-end">
            Find the part of school life that matters most to your family—then step straight in.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_ROUTES.map((route) => (
            <li key={route.href}>
              <Link
                href={route.href}
                className="group relative flex min-h-48 overflow-hidden rounded-[1.25rem] border border-navy/8 bg-white p-6 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-blue/30 hover:shadow-lift motion-reduce:transform-none motion-reduce:transition-none"
              >
                <Watermark
                  name={route.icon}
                  className="size-44 text-navy opacity-[0.045] transition-transform duration-300 group-hover:-translate-x-2 group-hover:-translate-y-2 motion-reduce:transform-none motion-reduce:transition-none"
                />
                <div className="relative flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className={`grid size-11 place-items-center rounded-[0.8rem] ${route.tone}`}>
                      <Icon name={route.icon} className="size-5" />
                    </span>
                    <span
                      aria-hidden="true"
                      className="grid size-9 place-items-center rounded-pill border border-sky text-blue transition-colors group-hover:bg-blue group-hover:text-white"
                    >
                      →
                    </span>
                  </div>
                  <p className="mt-6 text-[0.7rem] font-bold tracking-[0.1em] text-red-text">
                    {route.eyebrow}
                  </p>
                  <h3 className="mt-1.5">{route.title}</h3>
                  <p className="mt-2 max-w-[15rem] text-small leading-relaxed text-grey">
                    {route.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
