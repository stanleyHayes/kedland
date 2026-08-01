import Link from "next/link";

import { buttonClasses, Card, Chip, Icon, Star, Squiggle, Watermark } from "@kedland/ui";

import { PrincipalPortrait } from "../about/principal-portrait";
import { EnquiryForm } from "../contact/enquiry-form";

import { IntroBanner } from "./blocks";
import { Measure, Shell } from "./shell";

import type { ResolvedImageReference } from "@/lib/api";

import { ADMISSION_FORM_PATH } from "@/lib/admission-form-path";

/**
 * The remaining section components.
 *
 * Split from `blocks.tsx` to keep either file readable; the resolver treats
 * both the same. Server Components throughout — no JavaScript ships for any of
 * this.
 *
 * Every section sits on `Shell`'s single rail. Where content is narrower than
 * the rail it is left-aligned inside it via `Measure`, never re-centred — see
 * the note in `shell.tsx`.
 */

interface Cta {
  label: string;
  href: string;
}

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

/* ── About ─────────────────────────────────────────────────────────────── */

export interface MissionVisionData {
  missionHeading: string;
  mission: string;
  visionHeading: string;
  vision: string;
  mottoHeading: string;
  motto: string;
  mottoBody: string;
}

export function MissionVision({ data }: Readonly<{ data: MissionVisionData }>) {
  return (
    <Shell>
      <div className="grid gap-5 md:grid-cols-2">
        <Card accent="blue" padded={false} className="relative min-h-72 overflow-hidden p-8">
          <Watermark name="heart" className="size-52 text-blue opacity-[0.05]" />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-[0.875rem] bg-blue/12 text-blue">
              <Icon name="heart" className="size-6" />
            </span>
            <p className="mt-8 text-small font-bold uppercase tracking-[0.08em] text-blue">Our purpose</p>
            <h2 className="mt-2 text-h3">{data.missionHeading}</h2>
            <p className="mt-4 leading-relaxed text-ink/80">{data.mission}</p>
          </div>
        </Card>
        <Card accent="pink" padded={false} className="relative min-h-72 overflow-hidden p-8">
          <Watermark name="sparkle" className="size-52 text-pink opacity-[0.055]" />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-[0.875rem] bg-pink/12 text-pink">
              <Icon name="sparkle" className="size-6" />
            </span>
            <p className="mt-8 text-small font-bold uppercase tracking-[0.08em] text-pink">Our horizon</p>
            <h2 className="mt-2 text-h3">{data.visionHeading}</h2>
            <p className="mt-4 leading-relaxed text-ink/80">{data.vision}</p>
          </div>
        </Card>
      </div>

      <div className="relative mt-6 overflow-hidden rounded-[1.5rem] bg-navy px-8 py-12 text-center text-white sm:px-12">
        <Star className="pointer-events-none absolute -left-8 -top-8 size-40 text-white/[0.05]" />
        <Icon
          name="shield"
          strokeWidth={1.1}
          className="pointer-events-none absolute -bottom-20 -right-10 size-72 rotate-[-8deg] text-white/[0.045]"
        />
        <div className="relative">
          <p className="text-small font-bold uppercase tracking-[0.1em] text-yellow">{data.mottoHeading}</p>
          <p className="mt-3 font-display text-h2 font-extrabold">{data.motto}</p>
          <p className="mx-auto mt-4 max-w-2xl text-white/75">{data.mottoBody}</p>
        </div>
      </div>
    </Shell>
  );
}

export interface LetterData {
  heading: string;
  portrait: ResolvedImageReference;
  body: string;
  signOff: string;
  name: string;
  role: string;
  cta: Cta;
}

export function Letter({ data }: Readonly<{ data: LetterData }>) {
  return (
    <Shell space="loose">
      <div className="relative overflow-hidden rounded-[2rem] border border-navy/8 bg-white shadow-card">
        <Icon
          name="message"
          strokeWidth={1.1}
          className="pointer-events-none absolute -bottom-20 -right-10 size-80 rotate-[-8deg] text-blue/[0.04]"
        />
        <div className="relative grid lg:grid-cols-[0.72fr_1.28fr]">
          <div className="flex flex-col justify-between bg-navy p-8 text-white sm:p-10">
            <div>
              <p className="text-small font-bold uppercase tracking-[0.1em] text-yellow">
                From the Principal
              </p>
              <h1 className="mt-5 text-white">{data.heading}</h1>
            </div>
            <PrincipalPortrait
              alt={data.portrait.alt}
              src={data.portrait.src}
              className="mt-10 aspect-[4/5] min-h-80 w-full rounded-[1.5rem] border-4 border-white/20 shadow-lift"
              sizes="(min-width: 1024px) 24rem, 85vw"
            />
          </div>

          <div className="relative p-8 sm:p-12">
            <span
              className="font-display text-7xl font-extrabold leading-none text-yellow"
              aria-hidden="true"
            >
              “
            </span>
            {/* The Principal's own words, at a comfortable reading measure. */}
            <p className="-mt-4 text-[1.05rem] leading-[1.85] text-ink/85">{data.body}</p>

            <div className="mt-9 border-t border-sky pt-7">
              <p className="text-ink/80">{data.signOff}</p>
              <p className="mt-1 font-display text-h3 font-bold text-navy">{data.name}</p>
              <p className="text-small text-grey">{data.role}</p>
            </div>

            <p className="mt-8">
              <Link href={data.cta.href} className={buttonClasses({ variant: "secondary" })}>
                {data.cta.label}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export interface FeatureGridData {
  heading: string;
  intro: string;
  items: { icon: string; label: string }[];
}

export function FeatureGrid({ data }: Readonly<{ data: FeatureGridData }>) {
  const tones = [
    "bg-blue/12 text-blue before:bg-blue",
    "bg-pink/12 text-pink before:bg-pink",
    "bg-yellow/30 text-navy before:bg-yellow",
    "bg-green/15 text-green before:bg-green",
    "bg-orange/15 text-orange before:bg-orange",
    "bg-sky/40 text-navy before:bg-blue",
  ] as const;

  return (
    <Shell className="pb-16">
      <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
        <div>
          <p className="text-small font-bold uppercase tracking-[0.08em] text-red-text">Spaces to thrive</p>
          <h2 className="mt-3">{data.heading}</h2>
        </div>
        <p className="max-w-3xl text-[1.02rem] leading-[1.75] text-ink/80">{data.intro}</p>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item, index) => (
          <li
            key={item.label}
            className="group relative min-h-44 overflow-hidden rounded-[1.25rem] border border-navy/8 bg-white p-6 shadow-card before:absolute before:inset-y-0 before:left-0 before:w-1.5"
          >
            <Watermark
              name={item.icon}
              className="size-44 text-navy opacity-[0.05] transition-transform duration-300 group-hover:-translate-x-2 group-hover:-translate-y-2 motion-reduce:transform-none motion-reduce:transition-none"
            />
            <div className="relative flex h-full flex-col justify-between">
              <span
                className={`grid size-12 place-items-center rounded-[0.875rem] ${tones[index % tones.length] ?? tones[0]}`}
              >
                <Icon name={item.icon} className="size-6" />
              </span>
              <span className="mt-7 max-w-[13rem] font-display text-[1.15rem] font-bold leading-snug text-navy">
                {item.label}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

/* ── Academics ─────────────────────────────────────────────────────────── */

export interface EyfsAreasData {
  heading: string;
  intro: string;
  areas: { number: number; title: string; body: string }[];
  assessmentHeading: string;
  assessment: string;
}

/** One colour per area, matching the honeycomb diagram's palette. */
const AREA_COLOURS = [
  "bg-red text-white",
  "bg-orange text-ink",
  "bg-yellow text-ink",
  "bg-green text-white",
  "bg-blue text-white",
  "bg-pink text-white",
  "bg-navy text-white",
] as const;

/**
 * The seven EYFS areas — build package §4.3a.
 *
 * The package is explicit that these descriptions must be real HTML text
 * rather than baked into the diagram, so that both crawlers and screen readers
 * can read them. An ordered list is what they are: seven numbered areas.
 */
export function EyfsAreas({ data }: Readonly<{ data: EyfsAreasData }>) {
  return (
    <Shell>
      <h2>{data.heading}</h2>
      <Measure size="wide">
        <p className="mt-5 text-[1.02rem] leading-[1.75] text-ink/85">{data.intro}</p>

        <ol className="mt-10 space-y-4">
          {data.areas.map((area, index) => (
            <li key={area.number}>
              <Card className="flex gap-5">
                {/* Raised rather than flat: these numbers are the page's
                    spine, and the button recipe gives them the same depth as a
                    control so they read as objects rather than swatches. */}
                <span
                  aria-hidden="true"
                  className={`neu-button grid size-12 shrink-0 place-items-center rounded-md font-display text-h3 font-extrabold ${AREA_COLOURS[index % AREA_COLOURS.length] ?? AREA_COLOURS[0]}`}
                >
                  {area.number}
                </span>
                <span>
                  <h3>{area.title}</h3>
                  <p className="mt-2 text-small leading-relaxed text-ink/80">{area.body}</p>
                </span>
              </Card>
            </li>
          ))}
        </ol>

        <Card accent="green" className="mt-8">
          <h3>{data.assessmentHeading}</h3>
          <p className="mt-2 text-ink/80">{data.assessment}</p>
        </Card>
      </Measure>
    </Shell>
  );
}

export interface SubjectsGridData {
  heading: string;
  intro: string;
  subjects: { icon: string; title: string; body: string }[];
}

export function SubjectsGrid({ data }: Readonly<{ data: SubjectsGridData }>) {
  return (
    <Shell>
      <h2>{data.heading}</h2>
      <Measure size="wide">
        <p className="mt-5 text-[1.02rem] leading-[1.75] text-ink/85">{data.intro}</p>
      </Measure>

      <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {data.subjects.map((subject, index) => (
          <li key={subject.title}>
            <Card
              accent={(["red", "blue", "yellow", "green", "pink", "orange"] as const)[index % 6] ?? "blue"}
              interactive
              className="relative h-full overflow-hidden"
            >
              {/* The registry gives every subject an icon; this is where it
                  earns its place — as texture that tells you at a glance which
                  card you are looking at, without competing with the words. */}
              <Watermark name={subject.icon} className="text-navy" />
              <div className="relative">
                <Icon name={subject.icon} className="size-7 text-blue" />
                <h3 className="mt-3">{subject.title}</h3>
                <p className="mt-2 text-small leading-relaxed text-grey">{subject.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

/* ── Admissions ────────────────────────────────────────────────────────── */

export interface StepsData {
  heading: string;
  steps: { title: string; body: string }[];
}

export function Steps({ data }: Readonly<{ data: StepsData }>) {
  return (
    <Shell>
      <h2>{data.heading}</h2>

      <Measure size="wide">
        <ol className="mt-9 space-y-4">
          {data.steps.map((step, index) => (
            <li key={step.title}>
              <Card className="flex gap-5">
                <span
                  aria-hidden="true"
                  className="neu-button neu-button-primary grid size-11 shrink-0 place-items-center rounded-pill bg-red font-display text-h3 font-extrabold text-white"
                >
                  {index + 1}
                </span>
                <span>
                  <h3>{step.title}</h3>
                  <p className="mt-1.5 text-small text-grey">{step.body}</p>
                </span>
              </Card>
            </li>
          ))}
        </ol>
      </Measure>
    </Shell>
  );
}

export interface DownloadBlockData {
  heading: string;
  body: string;
  buttonLabel: string;
  note: string;
}

/**
 * The admission form.
 *
 * Build package §5.2: a static PDF behind a prominent button, no processing,
 * and no online admission form anywhere on the site.
 *
 * The PDF itself is still `[PENDING — client]`. Rather than shipping a button
 * that 404s on the school's main admissions call to action, the caller checks
 * whether the file is actually there and this falls back to the route that
 * always works — call the office. The moment the school drops the PDF into
 * `public/assets/forms/`, the next build turns the button back on with no code
 * change.
 *
 * `available` is a prop rather than a filesystem read in here, which it used to
 * be. A block that reads the disk cannot render anywhere but on a server, and
 * that made this the one section the dashboard's live preview could not show.
 * Presentational is also simply the right shape for it: whether a file exists is
 * not something a block should be finding out for itself.
 */
export function DownloadBlock({
  data,
  available = false,
}: Readonly<{ data: DownloadBlockData; available?: boolean }>) {
  return (
    <Shell>
      <div className="relative overflow-hidden rounded-lg bg-yellow px-8 py-11 text-center">
        <Squiggle className="pointer-events-none absolute -left-2 bottom-4 w-40 text-ink/10" />

        <h2>{data.heading}</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink/80">{data.body}</p>

        {available ? (
          <a
            href={ADMISSION_FORM_PATH}
            download
            className={buttonClasses({ variant: "secondary", size: "lg", className: "mt-7" })}
          >
            {data.buttonLabel}
          </a>
        ) : (
          <Link
            href="/contact"
            className={buttonClasses({ variant: "secondary", size: "lg", className: "mt-7" })}
          >
            Ask us for the admission form
          </Link>
        )}

        <p className="mt-5 text-small text-ink/70">{data.note}</p>
      </div>
    </Shell>
  );
}

/* ── Student life ──────────────────────────────────────────────────────── */

export interface TimelineData {
  heading: string;
  intro: string;
  moments: { icon: string; title: string; body: string }[];
}

export function Timeline({ data }: Readonly<{ data: TimelineData }>) {
  return (
    <Shell>
      <h2>{data.heading}</h2>
      <Measure>
        <p className="mt-4 text-ink/80">{data.intro}</p>

        <ol className="mt-10 border-l-2 border-sky pl-8">
          {data.moments.map((moment) => (
            <li key={moment.title} className="relative pb-8 last:pb-0">
              {/* The dot carries the moment's own icon. Seven identical dots
                  down a timeline tell a reader nothing about the day. */}
              <span className="absolute -left-[3.25rem] top-0 grid size-10 place-items-center rounded-pill border-4 border-cream bg-blue text-white">
                <Icon name={moment.icon} className="size-4" />
              </span>
              <h3>{moment.title}</h3>
              <p className="mt-1.5 text-small text-grey">{moment.body}</p>
            </li>
          ))}
        </ol>
      </Measure>
    </Shell>
  );
}

export interface ChipsBandData {
  heading: string;
  body: string;
  chips: string[];
}

const CHIP_TONES = ["red", "blue", "yellow", "green", "pink", "orange"] as const;

export function ChipsBand({ data }: Readonly<{ data: ChipsBandData }>) {
  return (
    <Shell>
      <h2>{data.heading}</h2>
      <Measure>
        <p className="mt-4 text-ink/80">{data.body}</p>
      </Measure>

      <ul className="mt-7 flex flex-wrap gap-2.5">
        {data.chips.map((chip, index) => (
          <li key={chip}>
            <Chip tone={CHIP_TONES[index % CHIP_TONES.length] ?? "sky"}>{chip}</Chip>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export interface TrioData {
  heading: string;
  cards: { icon: string; title: string; body: string }[];
}

export function Trio({ data }: Readonly<{ data: TrioData }>) {
  return (
    <Shell>
      <h2>{data.heading}</h2>

      <ul className="mt-9 grid gap-5 md:grid-cols-3">
        {data.cards.map((card, index) => (
          <li key={card.title}>
            <Card
              accent={(["blue", "pink", "green"] as const)[index % 3] ?? "blue"}
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
    </Shell>
  );
}

/* ── Contact, FAQs, news, legal ────────────────────────────────────────── */

export interface ContactDetailsData {
  heading: string;
  body: string;
  formHeading: string;
  mapHeading: string;
}

const PHONES = ["+233 257 130 333", "+233 202 472 472", "+233 244 958 103"] as const;

/** The school's address, as one line, for a maps query. */
const MAP_QUERY = encodeURIComponent(
  "Kedland International School, Community 19 Annex, Lashibi, Tema, Ghana",
);

/**
 * One line of contact information: icon, caption, value.
 *
 * The caption is deliberately the small, quiet part. What a parent wants is
 * the number, the address, the opening time — so those are what carry the
 * weight, and the words describing them stay out of the way.
 */
function ContactRow({
  icon,
  label,
  children,
}: Readonly<{ icon: string; label: string; children: React.ReactNode }>) {
  return (
    <div className="flex gap-4 border-t border-white/15 py-5 first:border-t-0 first:pt-0 last:pb-0">
      <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-pill bg-white/10 text-yellow">
        <Icon name={icon} className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-small font-bold uppercase tracking-[0.09em] text-white/55">{label}</p>
        <div className="mt-1.5">{children}</div>
      </div>
    </div>
  );
}

/**
 * Contact details.
 *
 * Directions are a link out to Google Maps rather than an embedded iframe.
 * An embed would load Google's scripts and cookies onto a page a parent
 * visits before they have agreed to anything, for a map most people open in
 * their phone's own app regardless.
 */
export function ContactDetails({ data }: Readonly<{ data: ContactDetailsData }>) {
  return (
    <Shell className="relative overflow-hidden pb-20 pt-8">
      <span
        aria-hidden="true"
        className="absolute -left-16 bottom-12 -z-10 size-64 rounded-pill bg-sky/20 blur-3xl"
      />

      <div className="overflow-hidden rounded-lg bg-white shadow-lift lg:grid lg:grid-cols-[0.88fr_1.12fr]">
        <div className="relative overflow-hidden bg-navy px-7 py-9 text-white sm:px-10 sm:py-11 lg:px-12 lg:py-14">
          <Watermark name="map-pin" className="-bottom-12 -right-10 size-64 text-white opacity-[0.05]" />
          <div className="relative">
            <p className="text-small font-bold uppercase tracking-[0.12em] text-yellow">Visit Kedland</p>
            <h2 className="mt-3 text-white">{data.heading}</h2>
            <p className="mt-4 max-w-xl text-white/72">{data.body}</p>

            <a
              href={`tel:${PHONES[0].replace(/\s/g, "")}`}
              className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-pill bg-white px-5 py-3 font-display font-bold text-navy transition-transform hover:scale-[1.02] motion-reduce:transform-none"
            >
              <span className="grid size-8 place-items-center rounded-pill bg-yellow/35">
                <Icon name="phone" className="size-4" />
              </span>
              Call the school office
            </a>

            <div className="mt-9">
              <ContactRow icon="phone" label="Call or WhatsApp">
                <ul className="space-y-1">
                  {PHONES.map((phone, index) => (
                    <li key={phone}>
                      <a
                        href={`tel:${phone.replace(/\s/g, "")}`}
                        className={`font-display font-bold text-white underline-offset-4 hover:text-yellow hover:underline ${
                          index === 0 ? "text-h3" : "text-[1.05rem]"
                        }`}
                      >
                        {phone}
                      </a>
                    </li>
                  ))}
                </ul>
              </ContactRow>

              <ContactRow icon="map-pin" label={data.mapHeading}>
                <address className="not-italic leading-relaxed text-white/82">
                  Community 19 Annex, Lashibi-Tema
                  <br />
                  near Deon Recreational Centre
                  <br />
                  Greater Accra, Ghana
                </address>
                <p className="mt-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-white/25 px-4 py-2 text-small font-bold text-white hover:border-yellow hover:text-yellow"
                  >
                    Get directions
                    <span aria-hidden="true">→</span>
                  </a>
                </p>
              </ContactRow>

              <ContactRow icon="clock" label="Office hours">
                <p className="leading-relaxed text-white/82">
                  Monday to Friday, <strong className="font-semibold text-white">7:00am – 5:00pm</strong>
                </p>
                <p className="mt-1 text-small text-white/55">
                  After-School Service and Weekend Drop-Off by arrangement.
                </p>
              </ContactRow>
            </div>
          </div>
        </div>

        <div className="bg-white px-7 py-9 sm:px-10 sm:py-11 lg:px-12 lg:py-14">
          <p className="text-small font-bold uppercase tracking-[0.12em] text-red">Start a conversation</p>
          <h2 className="mt-3">{data.formHeading}</h2>
          <p className="mt-3 max-w-xl text-ink/70">
            Tell us what you need and our team will point you in the right direction.
          </p>
          <div className="mt-8">
            {/*
              Read here, in a Server Component, and handed down. See the note
              in `turnstile.tsx` for why not in the client component itself.
            */}
            <EnquiryForm
              apiUrl={process.env["NEXT_PUBLIC_API_URL"] ?? ""}
              turnstileSiteKey={process.env["NEXT_PUBLIC_TURNSTILE_SITE_KEY"]}
            />
          </div>
          <div className="mt-7 flex flex-col gap-2 border-t border-sky/60 pt-6 text-small text-grey sm:flex-row sm:items-center sm:justify-between">
            <p>We usually respond during school office hours.</p>
            <TextLink cta={{ label: "See our FAQs", href: "/faqs" }} />
          </div>
        </div>
      </div>
    </Shell>
  );
}

export interface FaqIntroData {
  heading: string;
  body: string;
  closingHeading: string;
  closingCta: Cta;
}

/**
 * The FAQ page's framing.
 *
 * The questions themselves live in their own collection and are managed from
 * the dashboard; they arrive with that module.
 */
export function FaqIntro({ data }: Readonly<{ data: FaqIntroData }>) {
  return (
    <>
      {/*
        The same navy band every other page opens with. The FAQ page used to lead
        with a bare heading on the page background, which read as a different
        site — see `IntroBanner`, which this and `PageIntro` now share.
      */}
      <IntroBanner eyebrow="ANSWERS" heading={data.heading} standfirst={data.body} watermark="sparkle" />

      <Shell>
        <Measure>
          <Card className="mt-2 text-center">
            <h2>{data.closingHeading}</h2>
            <p className="mt-5">
              <Link href={data.closingCta.href} className={buttonClasses()}>
                {data.closingCta.label}
              </Link>
            </p>
          </Card>
        </Measure>
      </Shell>
    </>
  );
}

export interface NewsIntroData {
  heading: string;
  body: string;
  emptyStateHeading: string;
  emptyStateBody: string;
}

/**
 * The news page's heading and standfirst.
 *
 * Deliberately *not* the empty state, even though the CMS copy for one lives on
 * this section. This component has no idea whether any posts exist, so
 * rendering it here produced a page that announced "our first story is on its
 * way" directly above a list of published stories.
 *
 * The empty state is rendered by `app/news/page.tsx`, which is the only place
 * that knows whether the list came back empty. It reads
 * `emptyStateHeading`/`emptyStateBody` from this same section, so the copy stays
 * editable in the dashboard — the fields moved, not the ownership of the words.
 */
export function NewsIntro({ data }: Readonly<{ data: NewsIntroData }>) {
  return (
    <Shell space="loose">
      <h1>{data.heading}</h1>
      <Measure>
        <p className="mt-4 text-ink/80">{data.body}</p>
      </Measure>
    </Shell>
  );
}

/**
 * The friendly empty state the build package asks for (§4.6), rather than a
 * blank grid. Rendered by the news page when there is nothing to list.
 */
export function NewsEmptyState({ heading, body }: Readonly<{ heading: string; body: string }>) {
  return (
    <Card className="relative overflow-hidden text-center">
      <Star className="pointer-events-none absolute -right-4 -top-4 size-24 text-yellow/30" />
      <h2 className="text-h3">{heading}</h2>
      <p className="mx-auto mt-3 max-w-lg text-grey">{body}</p>
      <p className="mt-6">
        <a
          href="https://www.instagram.com/kedlandintlschool"
          target="_blank"
          rel="noreferrer noopener"
          className={buttonClasses({ variant: "secondary" })}
        >
          Follow us on Instagram
        </a>
      </p>
    </Card>
  );
}

export interface LegalData {
  heading: string;
  body: string;
  lastUpdated: string;
}

export function Legal({ data }: Readonly<{ data: LegalData }>) {
  return (
    <Shell>
      <Measure>
        <h2>{data.heading}</h2>
        <p className="mt-5 text-[1.02rem] leading-[1.8] text-ink/85">{data.body}</p>
        <p className="mt-8 text-small text-grey">Last updated: {data.lastUpdated}</p>
      </Measure>
    </Shell>
  );
}

export { Eyebrow } from "./blocks";
