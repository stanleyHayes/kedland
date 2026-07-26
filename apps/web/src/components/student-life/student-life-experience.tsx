import Image from "next/image";
import Link from "next/link";

import { buttonClasses, Icon, Star, Watermark } from "@kedland/ui";

import type {
  CtaBannerData,
  InstagramData,
  PageIntroData,
  ProseBandData,
  ProseStripData,
} from "@/components/sections/blocks";
import type { ChipsBandData, TimelineData, TrioData } from "@/components/sections/blocks-extra";
import type { PublicGalleryTile } from "@kedland/types";

import { GalleryMosaic } from "@/components/gallery/gallery-mosaic";

interface StudentLifeExperienceProps {
  intro: PageIntroData | undefined;
  day: TimelineData | undefined;
  clubs: ChipsBandData | undefined;
  arts: TrioData | undefined;
  care: ProseStripData | undefined;
  safeguarding: ProseBandData | undefined;
  gallery?: PublicGalleryTile[];
  galleryCopy?: InstagramData | undefined;
  cta: CtaBannerData | undefined;
}

const FALLBACK = {
  intro: {
    eyebrow: "Life at Kedland",
    heading: "Life at Kedland",
    standfirst: "A vibrant, inclusive community where children learn, create, play and belong.",
  },
  day: {
    heading: "A day in the life of a Star",
    intro: "Every part of the day is thoughtfully designed around our Stars and their bright futures.",
    moments: [
      { icon: "sun", title: "Warm welcome", body: "A smile, a song and a calm start to the day." },
      {
        icon: "book",
        title: "Circle & story time",
        body: "Language, listening and belonging through stories.",
      },
      {
        icon: "sparkle",
        title: "Learning through play",
        body: "Hands-on exploration, questions and discovery.",
      },
      { icon: "utensils", title: "Snack & outdoor play", body: "Healthy snacks, movement and friendship." },
      { icon: "palette", title: "Creative time", body: "Art, music, movement and making." },
      { icon: "moon", title: "Rest & reflect", body: "A gentle pause and time to look back." },
      { icon: "heart", title: "Home time", body: "Safe pickup or our after-school programme." },
    ],
  },
  clubs: {
    heading: "Beyond the classroom",
    body: "Every Star has room to explore interests, develop new skills and build lasting friendships.",
    chips: [
      "Sports & games",
      "Art & craft",
      "Music",
      "Dance",
      "Reading club",
      "Creative play",
      "Field trips",
    ],
  },
  arts: {
    heading: "Arts, music & sport",
    cards: [
      { icon: "palette", title: "Art & design", body: "Space to make, imagine and try." },
      { icon: "music", title: "Music", body: "Instruments, rhythm and joyful expression." },
      { icon: "sun", title: "Active play & sport", body: "Room to run, climb and grow healthy habits." },
    ],
  },
  care: {
    heading: "Care for busy families",
    body: "After-school service and weekend drop-off offer a safe and caring place with people children know.",
    link: { label: "Ask about hours", href: "/contact" },
  },
  safeguarding: {
    heading: "Your child's safety comes first",
    body: "A secure, child-friendly environment with caring supervision and a safe, orderly pickup process.",
  },
  cta: {
    heading: "Ready to begin your child's journey?",
    body: "Come and experience the warmth, energy and care of a day at Kedland.",
    primaryCta: { label: "Enrol Now", href: "/admissions" },
    secondaryCta: { label: "Book a Tour", href: "/contact" },
  },
} satisfies {
  intro: PageIntroData;
  day: TimelineData;
  clubs: ChipsBandData;
  arts: TrioData;
  care: ProseStripData;
  safeguarding: ProseBandData;
  cta: CtaBannerData;
};

const DAY_TONES = [
  "bg-yellow text-ink",
  "bg-sky text-navy",
  "bg-pink text-white",
  "bg-green text-white",
  "bg-orange text-ink",
  "bg-blue text-white",
  "bg-white text-navy",
] as const;

const CLUB_TONES = ["bg-red", "bg-blue", "bg-yellow", "bg-green", "bg-pink", "bg-orange", "bg-navy"] as const;

export function StudentLifeExperience(props: Readonly<StudentLifeExperienceProps>) {
  const intro: PageIntroData = props.intro ?? FALLBACK.intro;
  const day = props.day ?? FALLBACK.day;
  const clubs = props.clubs ?? FALLBACK.clubs;
  const arts = props.arts ?? FALLBACK.arts;
  const care = props.care ?? FALLBACK.care;
  const safeguarding = props.safeguarding ?? FALLBACK.safeguarding;
  const cta = props.cta ?? FALLBACK.cta;

  return (
    <>
      <section className="relative overflow-hidden px-6 pb-20 pt-14 sm:pb-24 sm:pt-20">
        <span className="pointer-events-none absolute -right-32 -top-28 -z-10 size-[32rem] rounded-pill bg-yellow/20 blur-3xl" />
        <Star className="pointer-events-none absolute left-[46%] top-12 -z-10 size-16 rotate-12 text-pink/15" />

        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <p className="text-small font-bold uppercase tracking-[0.16em] text-red">{intro.eyebrow}</p>
            <h1 className="mt-5 max-w-3xl text-[clamp(3rem,7vw,5.8rem)] leading-[0.95]">
              Big days for <span className="text-pink">little Stars.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-[1.12rem] leading-relaxed text-ink/72">{intro.standfirst}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#a-day-at-kedland" className={buttonClasses({ size: "lg", className: "pr-3" })}>
                Explore their day <span aria-hidden="true">↓</span>
              </Link>
              <Link href="/contact" className={buttonClasses({ variant: "outline", size: "lg" })}>
                Book a tour
              </Link>
            </div>
          </div>

          <div className="relative pb-8 sm:pr-8">
            <div className="neu-surface neu-interactive relative aspect-[4/3] overflow-hidden rounded-[2rem]">
              {/* The CMS image wins; the bundled starter keeps the page visual
                  until staff choose its replacement in the media library. */}
              <Image
                src={intro.image?.src ?? "/images/cms-starter/creative-table.webp"}
                alt={intro.image?.alt ?? "A creative learning table ready for a day of making"}
                fill
                priority
                sizes="(min-width: 1024px) 42vw, 92vw"
                className="object-cover"
              />
            </div>
            <div className="neu-surface absolute bottom-0 right-0 max-w-52 rounded-[1.25rem] p-4">
              <p className="font-display text-h3 font-extrabold text-navy">Create. Discover. Belong.</p>
              <p className="mt-1 text-small text-grey">Every day makes room for all three.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="a-day-at-kedland" className="scroll-mt-28 bg-navy px-6 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-16">
            <div>
              <p className="text-small font-bold uppercase tracking-[0.14em] text-yellow">
                From hello to home time
              </p>
              <h2 className="mt-3 text-white">{day.heading}</h2>
            </div>
            <p className="max-w-2xl text-white/65 lg:justify-self-end">{day.intro}</p>
          </div>

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {day.moments.map((moment, index) => (
              <li
                key={moment.title}
                className={`public-tone-card relative min-h-56 overflow-hidden rounded-lg p-6 ${DAY_TONES[index % DAY_TONES.length] ?? DAY_TONES[0]} ${
                  index === 2 || index === 6 ? "lg:col-span-2" : ""
                }`}
              >
                <span className="absolute right-5 top-4 font-display text-5xl font-extrabold opacity-[0.08]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="grid size-11 place-items-center rounded-pill bg-white/65 text-navy">
                  <Icon name={moment.icon} className="size-5" />
                </span>
                <h3 className="relative mt-7">{moment.title}</h3>
                <p className="relative mt-3 text-small leading-relaxed opacity-70">{moment.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-small font-bold uppercase tracking-[0.13em] text-red">Room to explore</p>
              <h2 className="mt-3">{clubs.heading}</h2>
              <p className="mt-5 leading-relaxed text-ink/72">{clubs.body}</p>

              <ul className="mt-8 flex flex-wrap gap-2.5">
                {clubs.chips.map((chip, index) => (
                  <li
                    key={chip}
                    className={`rounded-pill px-4 py-2 text-small font-bold ${CLUB_TONES[index % CLUB_TONES.length] ?? "bg-navy"} ${
                      index === 2 ? "text-ink" : "text-white"
                    }`}
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-small font-bold uppercase tracking-[0.13em] text-grey">{arts.heading}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {arts.cards.map((card, index) => (
                  <article
                    key={card.title}
                    className={`public-tone-card relative overflow-hidden rounded-lg p-6 sm:p-7 lg:grid lg:grid-cols-[auto_1fr] lg:items-center lg:gap-6 ${
                      ["bg-pink/12", "bg-blue/15", "bg-green/15"][index % 3] ?? "bg-sky/30"
                    }`}
                  >
                    <Watermark name={card.icon} className="text-navy" />
                    <span className="relative grid size-12 place-items-center rounded-pill bg-white text-navy shadow-card">
                      <Icon name={card.icon} className="size-6" />
                    </span>
                    <div className="relative mt-5 lg:mt-0">
                      <h3>{card.title}</h3>
                      <p className="mt-2 text-small leading-relaxed text-grey">{card.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sky/18 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-small font-bold uppercase tracking-[0.13em] text-red">Stars in action</p>
            <h2 className="mt-3">{props.galleryCopy?.heading ?? "Kedland moments"}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink/72">
              Learning, friendship, creativity and play—captured in a gallery curated by the school team.
            </p>
          </div>
          <GalleryMosaic tiles={props.gallery ?? []} />
        </div>
      </section>

      <section className="px-6 pb-20 sm:pb-24">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg shadow-lift lg:grid-cols-2">
          <div className="public-tone-panel public-tone-panel-warm relative overflow-hidden bg-yellow/35 p-8 sm:p-10 lg:p-12">
            <Watermark name="heart" className="text-navy" />
            <div className="relative">
              <span className="grid size-12 place-items-center rounded-pill bg-white text-navy">
                <Icon name="heart" className="size-6" />
              </span>
              <h2 className="mt-7">{care.heading}</h2>
              <p className="mt-4 max-w-xl leading-relaxed text-ink/72">{care.body}</p>
              <Link
                href={care.link.href}
                className="mt-7 inline-flex items-center gap-2 font-display font-bold text-navy"
              >
                {care.link.label} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden bg-navy p-8 text-white sm:p-10 lg:p-12">
            <Watermark name="shield" className="text-white" />
            <div className="relative">
              <span className="grid size-12 place-items-center rounded-pill bg-white/10 text-yellow">
                <Icon name="shield" className="size-6" />
              </span>
              <h2 className="mt-7 text-white">{safeguarding.heading}</h2>
              <p className="mt-4 max-w-xl leading-relaxed text-white/68">{safeguarding.body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="public-cta-banner relative mx-auto max-w-6xl overflow-hidden rounded-lg bg-sky/35 px-8 py-12 text-center sm:px-12 sm:py-16">
          <Star className="pointer-events-none absolute -left-7 -top-8 size-32 text-white/65" />
          <Star className="pointer-events-none absolute -bottom-8 -right-5 size-36 text-white/55" />
          <div className="relative">
            <p className="text-small font-bold uppercase tracking-[0.13em] text-red">
              Come and experience Kedland
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl">{cta.heading}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink/72">{cta.body}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={cta.primaryCta.href} className={buttonClasses({ size: "lg" })}>
                {cta.primaryCta.label}
              </Link>
              <Link
                href={cta.secondaryCta.href}
                className={buttonClasses({ variant: "outline", size: "lg" })}
              >
                {cta.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
