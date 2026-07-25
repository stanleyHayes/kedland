import Image from "next/image";
import Link from "next/link";

import { ArrowChip, Blob, buttonClasses, Card, Chip, Star } from "@kedland/ui";

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

function SecondaryLink({ cta }: Readonly<{ cta: Cta }>) {
  return (
    <Link href={cta.href} className={buttonClasses({ variant: "outline" })}>
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
  image: { mediaId: string; alt: string };
  trustChips: string[];
}

export function Hero({ data }: Readonly<{ data: HeroData }>) {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-12 sm:pt-16">
      <Blob className="pointer-events-none absolute -right-24 -top-24 -z-10 size-[28rem] text-sky/45" />
      <Star className="pointer-events-none absolute right-1/4 top-10 -z-10 size-10 text-yellow/60" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <h1 className="mt-4">{data.heading}</h1>
          <p className="mt-5 max-w-xl text-[1.1rem] text-ink/80">{data.subheading}</p>

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
          {/* PLACEHOLDER imagery until the school's photography arrives (§2.6).
              The crest stands in rather than stock photography of other
              people's children. */}
          <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-lg bg-white p-12 shadow-lift">
            <Image
              src="/logo/kedland-logo-512.png"
              alt={data.image.alt}
              width={512}
              height={512}
              priority
              className="h-auto w-full max-w-xs"
            />
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
}

export function PageIntro({ data }: Readonly<{ data: PageIntroData }>) {
  return (
    <section className="relative px-6 pb-4 pt-12 sm:pt-16">
      <Star className="pointer-events-none absolute -right-2 top-8 -z-10 size-28 text-yellow/20" />
      <div className="mx-auto max-w-4xl">
        <Eyebrow>{data.eyebrow}</Eyebrow>
        <h1 className="mt-3">{data.heading}</h1>
        <p className="mt-5 max-w-2xl text-[1.1rem] text-ink/80">{data.standfirst}</p>
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
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-card sm:p-10">
        <h2>{data.heading}</h2>
        <p className="mt-4 text-ink/80">{data.body}</p>
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
    <section className="px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h2>{data.heading}</h2>
        {/* Generous measure and line-height: this is the long-form prose a
            parent actually reads (build package §2.4). */}
        <p className="mt-5 text-[1.05rem] leading-[1.75] text-ink/85">{data.body}</p>
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
              <Card accent={ACCENTS[index % ACCENTS.length] ?? "red"} interactive className="h-full">
                <h3>{card.title}</h3>
                <p className="mt-2 text-small text-grey">{card.body}</p>
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
              <Card interactive className="relative h-full">
                <Star className="absolute -top-2 right-5 size-8 text-yellow" />
                <h3>{level.name}</h3>
                <p className="mt-2 text-small text-grey">{level.blurb}</p>
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
            <div key={`${tile.letter}-${tile.name}`} className="rounded-lg bg-white/[0.07] p-5">
              <dt className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`grid size-11 shrink-0 place-items-center rounded-md font-display text-h3 font-extrabold ${TILE_COLOURS[index % TILE_COLOURS.length] ?? TILE_COLOURS[0]}`}
                >
                  {tile.letter}
                </span>
                <span className="font-display text-h3 font-bold text-white">{tile.name}</span>
              </dt>
              <dd className="mt-3 text-small text-white/75">{tile.body}</dd>
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
  portrait: { mediaId: string; alt: string };
  quote: string;
  name: string;
  role: string;
  cta: Cta;
}

export function QuoteTeaser({ data }: Readonly<{ data: QuoteTeaserData }>) {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 rounded-lg bg-white p-8 text-center shadow-card sm:p-12 md:flex-row md:text-left">
        <span className="shrink-0 rounded-pill border-4 border-sky bg-cream p-3">
          <Image
            src="/logo/kedland-logo-256.png"
            alt={data.portrait.alt}
            width={256}
            height={256}
            className="size-24 object-contain"
          />
        </span>

        <div>
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
export function InstagramShowcase({ data }: Readonly<{ data: InstagramData }>) {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-6xl text-center">
        <h2>{data.heading}</h2>
        <p className="mt-3 text-grey">Follow along to see what our Stars have been up to.</p>

        <a
          href={`https://www.instagram.com/${data.handle.replace("@", "")}`}
          target="_blank"
          rel="noreferrer noopener"
          className={buttonClasses({ variant: "secondary", className: "mt-7" })}
        >
          Follow us on Instagram
          <span className="font-body font-semibold opacity-80">{data.handle}</span>
        </a>
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
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg bg-sky/50 px-8 py-12 text-center">
        <Star className="pointer-events-none absolute -left-4 -top-4 size-24 text-white/50" />
        <Star className="pointer-events-none absolute -bottom-6 right-2 size-28 text-white/40" />

        <div className="relative">
          <h2>{data.heading}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink/80">{data.body}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PrimaryLink cta={data.primaryCta} />
            <SecondaryLink cta={data.secondaryCta} />
          </div>
        </div>
      </div>
    </section>
  );
}
