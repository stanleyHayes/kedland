import Image from "next/image";
import Link from "next/link";

import { ArrowChip, Blob, buttonClasses, Card, Chip, Icon, Star, Watermark } from "@kedland/ui";

import { PrincipalPortrait } from "../about/principal-portrait";
import { GalleryMosaic } from "../gallery/gallery-mosaic";
import { AnimatedHeroCopy } from "../home/animated-hero-copy";

import type { PublicGalleryTile } from "@kedland/types";

import { STARTER_GALLERY, type ResolvedImageReference } from "@/lib/api";

/**
 * The section components.
 *
 * One per section type in the registry. Each takes the validated `data` for its
 * type and renders it — no fetching, no branching on which page it is on. The
 * resolver in `resolve.tsx` maps a type to the component; the registry decides
 * which sections a page has and in what order.
 *
 * Everything is a Server Component: these render to HTML at build time and ship
 * no JavaScript, which is most of how the LCP budget is met.
 */

/* ── shared pieces ─────────────────────────────────────────────────────── */

export function Eyebrow({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="text-small font-bold uppercase tracking-[0.06em] text-red-text">{children}</p>;
}

interface Cta {
  label: string;
  href: string;
}

function PrimaryLink({ cta, size = "md" }: Readonly<{ cta: Cta; size?: "md" | "lg" }>) {
  return (
    <Link href={cta.href} className={buttonClasses({ size, className: "pr-2" })}>
      {cta.label}
      <ArrowChip />
    </Link>
  );
}

function SecondaryLink({ cta, className = "" }: Readonly<{ cta: Cta; className?: string }>) {
  return (
    <Link href={cta.href} className={buttonClasses({ variant: "outline", className })}>
      {cta.label}
    </Link>
  );
}

/** A quiet inline link with an arrow, used to close a prose block. */
function TextLink({ cta }: Readonly<{ cta: Cta }>) {
  return (
    <Link
      href={cta.href}
      className="inline-flex items-center gap-1.5 font-display font-bold text-blue underline-offset-4 hover:underline"
    >
      {cta.label}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/* ── sections ──────────────────────────────────────────────────────────── */

export interface HeroData {
  eyebrow: string;
  heading: string;
  subheading: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  image: ResolvedImageReference;
  trustChips: string[];
}

export function Hero({ data }: Readonly<{ data: HeroData }>) {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-12 sm:pt-16">
      <Blob className="pointer-events-none absolute -right-24 -top-24 -z-10 size-[28rem] text-sky/45" />
      <Star className="pointer-events-none absolute right-1/4 top-10 -z-10 size-10 text-yellow/60" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <AnimatedHeroCopy eyebrow={data.eyebrow} heading={data.heading} subheading={data.subheading} />

          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink cta={data.primaryCta} size="lg" />
            <SecondaryLink cta={data.secondaryCta} />
          </div>

          <ul className="mt-9 flex flex-wrap gap-2">
            {data.trustChips.map((chip) => (
              <li key={chip}>
                <Chip>{chip}</Chip>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            data-testid="hero-crest-surface"
            className="neu-surface neu-interactive relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-[2rem]"
          >
            <Image
              src={data.image.src ?? "/logo/kedland-logo-512.png"}
              alt={data.image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 90vw"
              className={`${
                data.image.src ? "object-cover" : "object-contain p-12"
              } transition duration-700 hover:scale-[1.025] motion-reduce:transition-none motion-reduce:hover:scale-100`}
            />
            <span className="pointer-events-none absolute inset-0 bg-linear-to-tr from-navy/12 via-transparent to-yellow/10" />
          </div>
        </div>
      </div>
    </section>
  );
}

export interface PageIntroData {
  eyebrow: string;
  heading: string;
  standfirst: string;
  image?: ResolvedImageReference;
}

const INTRO_STARTERS: Readonly<Record<string, ResolvedImageReference>> = {
  "ABOUT KEDLAND": {
    mediaId: "placeholder-hero",
    alt: "Young learners building together with their teacher",
    src: "/images/placeholders/learning-through-play.webp",
  },
  "OUR STORY": {
    mediaId: "placeholder-admissions",
    alt: "Children receiving a warm welcome at school",
    src: "/images/placeholders/warm-welcome.webp",
  },
  "OUR CAMPUS": {
    mediaId: "placeholder-admissions",
    alt: "A welcoming school entrance in the morning",
    src: "/images/placeholders/warm-welcome.webp",
  },
  ACADEMICS: {
    mediaId: "placeholder-science",
    alt: "Primary pupils exploring leaves with a magnifying glass",
    src: "/images/placeholders/science-discovery.webp",
  },
  "EARLY YEARS": {
    mediaId: "placeholder-hero",
    alt: "Young learners building together through play",
    src: "/images/placeholders/learning-through-play.webp",
  },
  PRIMARY: {
    mediaId: "placeholder-science",
    alt: "Primary pupils collaborating on a science activity",
    src: "/images/placeholders/science-discovery.webp",
  },
  "LIFE AT KEDLAND": {
    mediaId: "placeholder-arts",
    alt: "Young learners enjoying a creative arts activity",
    src: "/images/placeholders/creative-arts.webp",
  },
  "GET IN TOUCH": {
    mediaId: "placeholder-admissions",
    alt: "Children receiving a warm welcome at school",
    src: "/images/placeholders/warm-welcome.webp",
  },
};

/**
 * The navy opening band most pages lead with.
 *
 * Extracted from `PageIntro` so the FAQ page can lead the same way. It had no
 * banner at all — a bare heading on the page background, which read as a
 * different site from every other page — and duplicating fifteen lines of
 * markup to give it one is how two banners drift apart.
 *
 * `headingLevel` exists because the caller owns the document outline: a page's
 * opening band is its `h1`, but a band used further down a page is not.
 */
export function IntroBanner({
  eyebrow,
  heading,
  standfirst,
  watermark,
  headingLevel = "h1",
}: Readonly<{
  eyebrow?: string | undefined;
  heading: string;
  standfirst: string;
  watermark: string;
  headingLevel?: "h1" | "h2";
}>) {
  const Heading = headingLevel;

  return (
    <section className="px-6 pb-6 pt-8 sm:pb-8 sm:pt-12">
      <div className="relative mx-auto min-h-80 max-w-6xl overflow-hidden rounded-[2rem] bg-navy px-7 py-12 text-white shadow-lift sm:px-12 sm:py-16">
        <span className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full border-[3rem] border-white/[0.035]" />
        <Icon
          name={watermark}
          strokeWidth={1.1}
          className="pointer-events-none absolute -bottom-20 -right-10 size-[23rem] rotate-[-8deg] text-white/[0.055]"
        />
        <Star className="pointer-events-none absolute right-8 top-8 size-10 text-yellow/80 sm:right-14 sm:top-12" />

        <div className="relative flex min-h-56 max-w-3xl flex-col justify-end">
          {eyebrow && (
            <p className="text-small font-bold uppercase tracking-[0.12em] text-yellow">{eyebrow}</p>
          )}
          <Heading className="mt-4 max-w-4xl text-white">{heading}</Heading>
          <p className="mt-5 max-w-2xl text-[1.1rem] leading-relaxed text-white/75">{standfirst}</p>
        </div>
      </div>
    </section>
  );
}

export function PageIntro({ data }: Readonly<{ data: PageIntroData }>) {
  const aboutWatermarks: Record<string, string> = {
    "ABOUT KEDLAND": "sparkle",
    "OUR STORY": "book",
    "OUR PROMISE": "heart",
    "OUR CAMPUS": "blocks",
  };
  const watermark = aboutWatermarks[data.eyebrow];

  const image = data.image?.src ? data.image : INTRO_STARTERS[data.eyebrow];
  const visual = image?.src;

  if (watermark && !visual) {
    return (
      <IntroBanner
        eyebrow={data.eyebrow}
        heading={data.heading}
        standfirst={data.standfirst}
        watermark={watermark}
      />
    );
  }

  return (
    <section className="relative px-6 pb-6 pt-12 sm:pb-8 sm:pt-16">
      <Star className="pointer-events-none absolute -right-2 top-8 -z-10 size-28 text-yellow/20" />
      <div className="mx-auto max-w-6xl">
        <div className={visual ? "grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]" : ""}>
          <div>
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h1 className="mt-3 max-w-4xl">{data.heading}</h1>
            <p className="mt-5 max-w-2xl text-[1.1rem] text-ink/80">{data.standfirst}</p>
          </div>
          {visual && (
            <div className="neu-surface neu-interactive relative aspect-[16/10] overflow-hidden rounded-[2rem]">
              <Image
                src={visual}
                alt={image.alt}
                fill
                priority
                sizes="(min-width: 1024px) 52vw, 92vw"
                className="object-cover transition duration-700 hover:scale-[1.025] motion-reduce:transition-none motion-reduce:hover:scale-100"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export interface ProseStripData {
  heading: string;
  body: string;
  link: Cta;
}

export function ProseStrip({ data }: Readonly<{ data: ProseStripData }>) {
  return (
    <section className="px-6 py-12">
      <div className="neu-surface mx-auto max-w-6xl rounded-lg p-8 sm:p-10" data-testid="prose-strip-surface">
        <h2>{data.heading}</h2>
        <p className="mt-4 max-w-3xl text-ink/80">{data.body}</p>
        <p className="mt-6">
          <TextLink cta={data.link} />
        </p>
      </div>
    </section>
  );
}

export interface ProseBandData {
  heading: string;
  body: string;
}

export function ProseBand({ data }: Readonly<{ data: ProseBandData }>) {
  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] border border-navy/8 bg-white p-7 shadow-card sm:p-12">
        <Watermark name="book" className="size-64 text-blue opacity-[0.045]" />
        <div className="relative grid gap-7 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
          <div>
            <span className="grid size-14 place-items-center rounded-[1rem] bg-blue/12 text-blue">
              <Icon name="book" className="size-7" />
            </span>
            <h2 className="mt-6">{data.heading}</h2>
          </div>
          {/* Generous measure and line-height: this is the long-form prose a
              parent actually reads (build package §2.4). */}
          <p className="border-l-2 border-yellow pl-6 text-[1.05rem] leading-[1.8] text-ink/85 sm:pl-8">
            {data.body}
          </p>
        </div>
      </div>
    </section>
  );
}

export interface IconCardsData {
  eyebrow: string;
  heading: string;
  cards: { icon: string; title: string; body: string }[];
}

/** Cycled across the four cards so the row is not monochrome. The fallback
 *  satisfies `noUncheckedIndexedAccess`; the modulo makes it unreachable. */
const ACCENTS = ["red", "blue", "yellow", "green"] as const;

export function IconCards({ data }: Readonly<{ data: IconCardsData }>) {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>{data.eyebrow}</Eyebrow>
        <h2 className="mt-3">{data.heading}</h2>

        <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.cards.map((card, index) => (
            <li key={card.title}>
              <Card
                accent={ACCENTS[index % ACCENTS.length] ?? "red"}
                interactive
                className="relative h-full overflow-hidden"
              >
                <Watermark name={card.icon} className="text-navy" />
                <div className="relative">
                  <Icon name={card.icon} className="size-7 text-blue" />
                  <h3 className="mt-3">{card.title}</h3>
                  <p className="mt-2 text-small text-grey">{card.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export interface LevelCardsData {
  heading: string;
  levels: { icon: string; name: string; blurb: string }[];
  cta: Cta;
}

export function LevelCards({ data }: Readonly<{ data: LevelCardsData }>) {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <h2>{data.heading}</h2>

        <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.levels.map((level) => (
            <li key={level.name}>
              <Card interactive className="relative h-full overflow-hidden">
                <Watermark name={level.icon} className="text-navy" />
                <Star className="absolute -top-2 right-5 size-8 text-yellow" />
                <div className="relative">
                  <Icon name={level.icon} className="size-7 text-blue" />
                  <h3 className="mt-3">{level.name}</h3>
                  <p className="mt-2 text-small text-grey">{level.blurb}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <p className="mt-8">
          <TextLink cta={data.cta} />
        </p>
      </div>
    </section>
  );
}

export interface ValuesTilesData {
  heading: string;
  tiles: { letter: string; name: string; body: string }[];
  cta: Cta;
}

const TILE_COLOURS = [
  "bg-red text-white",
  "bg-yellow text-ink",
  "bg-blue text-white",
  "bg-pink text-white",
  "bg-green text-white",
  "bg-orange text-ink",
  "bg-navy text-white",
] as const;

/**
 * The KEDLAND reveal — build package §4.2b calls this "a signature moment".
 *
 * Rendered as a definition list rather than cards: each letter genuinely
 * defines a value, and that is what a screen reader should hear.
 */
export function ValuesTiles({ data }: Readonly<{ data: ValuesTilesData }>) {
  return (
    <section className="relative overflow-hidden bg-navy px-6 py-16 text-white">
      <Star className="pointer-events-none absolute -left-8 top-8 size-40 text-white/[0.05]" />

      <div className="mx-auto max-w-6xl">
        <h2 className="text-white">{data.heading}</h2>

        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.tiles.map((tile, index) => (
            <div
              key={`${tile.letter}-${tile.name}`}
              className="neu-tile-dark neu-interactive relative overflow-hidden rounded-lg p-5"
            >
              {/* The value's own letter, oversized and faint. These tiles spell
                  KEDLAND, so the letter *is* what each tile represents — a
                  generic icon would say less. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-8 -right-2 font-display text-[7rem] font-extrabold leading-none text-white/[0.05]"
              >
                {tile.letter}
              </span>
              <dt className="relative flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`neu-colour-badge grid size-11 shrink-0 place-items-center rounded-md font-display text-h3 font-extrabold ${TILE_COLOURS[index % TILE_COLOURS.length] ?? TILE_COLOURS[0]}`}
                >
                  {tile.letter}
                </span>
                <span className="font-display text-h3 font-bold text-white">{tile.name}</span>
              </dt>
              <dd className="relative mt-3 text-small text-white/75">{tile.body}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-9">
          <Link
            href={data.cta.href}
            className="inline-flex items-center gap-1.5 font-display font-bold text-yellow underline-offset-4 hover:underline"
          >
            {data.cta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
    </section>
  );
}

export interface QuoteTeaserData {
  portrait: ResolvedImageReference;
  quote: string;
  name: string;
  role: string;
  cta: Cta;
}

export function QuoteTeaser({ data }: Readonly<{ data: QuoteTeaserData }>) {
  return (
    <section className="px-6 py-14">
      <div
        className="neu-surface relative mx-auto grid max-w-6xl overflow-hidden rounded-[1.75rem] md:grid-cols-[0.72fr_1.28fr]"
        data-testid="principal-teaser-surface"
      >
        <PrincipalPortrait
          alt={data.portrait.alt}
          src={data.portrait.src}
          className="neu-inset-panel aspect-[4/3] min-h-72 md:aspect-auto md:h-full"
          sizes="(min-width: 768px) 28rem, 90vw"
        />

        <div className="relative flex flex-col justify-center p-8 sm:p-12">
          <Watermark name="message" className="size-56 text-blue opacity-[0.04]" />
          <p className="relative text-small font-bold uppercase tracking-[0.1em] text-red-text">
            FROM THE PRINCIPAL
          </p>
          <blockquote className="font-display text-h3 font-bold leading-snug text-navy">
            “{data.quote}”
          </blockquote>
          <p className="mt-4 text-small text-grey">
            <span className="font-bold text-ink">{data.name}</span> · {data.role}
          </p>
          <p className="mt-5">
            <TextLink cta={data.cta} />
          </p>
        </div>
      </div>
    </section>
  );
}

export interface InstagramData {
  heading: string;
  handle: string;
}

/**
 * The Instagram showcase.
 *
 * A link out, not a feed. Build package §5.3 is emphatic: no Graph API, no
 * tokens, no paid widget, no auto-sync. The curated tiles arrive from the
 * dashboard in Phase 7; until then this is the heading and the follow button.
 */
export function InstagramShowcase({
  data,
  tiles = STARTER_GALLERY,
}: Readonly<{ data: InstagramData; tiles?: PublicGalleryTile[] }>) {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <Eyebrow>Stars in action</Eyebrow>
          <h2 className="mt-2">{data.heading}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-grey">
            A glimpse of learning, creativity and joyful school days. Select any photo to explore the gallery.
          </p>
        </div>

        <GalleryMosaic tiles={tiles} />

        <div className="mt-8 text-center">
          <a
            href={`https://www.instagram.com/${data.handle.replace("@", "")}`}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonClasses({ variant: "secondary", className: "flex-wrap" })}
          >
            {/*
              Both halves are their own non-breaking span.

              As a bare text node the label wrapped mid-phrase — "Follow us on /
              Instagram" — while the handle sat alongside on one line, which read
              as a broken button rather than a narrow one. Now the button breaks
              *between* the two, so a narrow screen stacks the label above the
              handle and each stays whole.
            */}
            <span className="whitespace-nowrap">Follow us on Instagram</span>
            <span className="whitespace-nowrap font-body font-semibold opacity-80">{data.handle}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export interface CtaBannerData {
  heading: string;
  body: string;
  primaryCta: Cta;
  secondaryCta: Cta;
}

export function CtaBanner({ data }: Readonly<{ data: CtaBannerData }>) {
  return (
    <section className="px-6 py-14">
      <div className="public-cta-banner relative mx-auto max-w-6xl overflow-hidden rounded-lg px-8 py-12 text-center">
        <Star className="public-cta-star pointer-events-none absolute -left-4 -top-4 size-24" />
        <Star className="public-cta-star pointer-events-none absolute -bottom-6 right-2 size-28" />

        <div className="relative">
          <h2>{data.heading}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink/80">{data.body}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PrimaryLink cta={data.primaryCta} />
            <SecondaryLink cta={data.secondaryCta} className="public-cta-secondary" />
          </div>
        </div>
      </div>
    </section>
  );
}
