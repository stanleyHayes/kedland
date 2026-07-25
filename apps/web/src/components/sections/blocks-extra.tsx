import Image from "next/image";
import Link from "next/link";

import { buttonClasses, Card, Chip, Star, Squiggle } from "@kedland/ui";

import { EnquiryForm } from "../contact/enquiry-form";

import { Measure, Shell } from "./shell";

import { ADMISSION_FORM_PATH, admissionFormExists } from "@/lib/admission-form";

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
        <Card accent="blue">
          <h2 className="text-h3">{data.missionHeading}</h2>
          <p className="mt-3 text-ink/80">{data.mission}</p>
        </Card>
        <Card accent="pink">
          <h2 className="text-h3">{data.visionHeading}</h2>
          <p className="mt-3 text-ink/80">{data.vision}</p>
        </Card>
      </div>

      <div className="relative mt-6 overflow-hidden rounded-lg bg-navy px-8 py-10 text-center text-white">
        <Star className="pointer-events-none absolute -left-4 -top-4 size-28 text-white/[0.06]" />
        <p className="text-small font-bold uppercase tracking-[0.06em] text-yellow">{data.mottoHeading}</p>
        <p className="mt-3 font-display text-h2 font-extrabold">{data.motto}</p>
        <p className="mx-auto mt-4 max-w-2xl text-white/75">{data.mottoBody}</p>
      </div>
    </Shell>
  );
}

export interface LetterData {
  heading: string;
  portrait: { mediaId: string; alt: string };
  body: string;
  signOff: string;
  name: string;
  role: string;
  cta: Cta;
}

export function Letter({ data }: Readonly<{ data: LetterData }>) {
  return (
    <Shell space="loose">
      <Measure>
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <span className="shrink-0 rounded-pill border-4 border-sky bg-white p-3">
            <Image
              src="/logo/kedland-logo-256.png"
              alt={data.portrait.alt}
              width={256}
              height={256}
              className="size-24 object-contain"
            />
          </span>
          <h1>{data.heading}</h1>
        </div>

        {/* The Principal's own words, at a comfortable reading measure. */}
        <p className="mt-9 text-[1.05rem] leading-[1.8] text-ink/85">{data.body}</p>

        <p className="mt-8 text-ink/80">{data.signOff}</p>
        <p className="mt-1 font-display text-h3 font-bold text-navy">{data.name}</p>
        <p className="text-small text-grey">{data.role}</p>

        <p className="mt-8">
          <Link href={data.cta.href} className={buttonClasses({ variant: "secondary" })}>
            {data.cta.label}
          </Link>
        </p>
      </Measure>
    </Shell>
  );
}

export interface FeatureGridData {
  heading: string;
  intro: string;
  items: { icon: string; label: string }[];
}

export function FeatureGrid({ data }: Readonly<{ data: FeatureGridData }>) {
  return (
    <Shell>
      <h2>{data.heading}</h2>
      <Measure>
        <p className="mt-4 text-ink/80">{data.intro}</p>
      </Measure>

      <ul className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item) => (
          <li key={item.label} className="flex items-center gap-3 rounded-md bg-white px-5 py-4 shadow-card">
            <Star aria-hidden="true" className="size-4 shrink-0 text-yellow" />
            <span className="font-semibold text-navy">{item.label}</span>
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
                <span
                  aria-hidden="true"
                  className={`grid size-12 shrink-0 place-items-center rounded-md font-display text-h3 font-extrabold ${AREA_COLOURS[index % AREA_COLOURS.length] ?? AREA_COLOURS[0]}`}
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
              className="h-full"
            >
              <h3>{subject.title}</h3>
              <p className="mt-2 text-small leading-relaxed text-grey">{subject.body}</p>
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
                  className="grid size-11 shrink-0 place-items-center rounded-pill bg-red font-display text-h3 font-extrabold text-white"
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
 * that 404s on the school's main admissions call to action, this checks at
 * build time whether the file is actually there and falls back to the route
 * that always works — call the office. The moment the school drops the PDF
 * into `public/assets/forms/`, the next build turns the button back on with
 * no code change.
 */
export function DownloadBlock({ data }: Readonly<{ data: DownloadBlockData }>) {
  const available = admissionFormExists();

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
              <span
                aria-hidden="true"
                className="absolute -left-[2.6rem] top-1 grid size-7 place-items-center rounded-pill border-4 border-cream bg-blue"
              />
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
              className="h-full"
            >
              <h3>{card.title}</h3>
              <p className="mt-2 text-small text-grey">{card.body}</p>
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
 * Contact details.
 *
 * Directions are a link out to Google Maps rather than an embedded iframe.
 * An embed would load Google's scripts and cookies onto a page a parent
 * visits before they have agreed to anything, for a map most people open in
 * their phone's own app regardless.
 */
export function ContactDetails({ data }: Readonly<{ data: ContactDetailsData }>) {
  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2>{data.heading}</h2>
          <p className="mt-4 text-ink/80">{data.body}</p>

          <Card className="mt-7">
            <h3>Call or WhatsApp</h3>
            <ul className="mt-3 space-y-1.5">
              {PHONES.map((phone) => (
                <li key={phone}>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-semibold text-blue">
                    {phone}
                  </a>
                </li>
              ))}
            </ul>

            <h3 className="mt-6">{data.mapHeading}</h3>
            <address className="mt-2 not-italic text-ink/80">
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
                className="inline-flex items-center gap-1.5 font-display font-bold text-blue underline-offset-4 hover:underline"
              >
                Get directions
                <span aria-hidden="true">→</span>
              </a>
            </p>

            <h3 className="mt-6">Office hours</h3>
            <p className="mt-2 text-ink/80">
              Monday to Friday, 7:00am – 5:00pm.
              <br />
              After-School Service and Weekend Drop-Off by arrangement.
            </p>
          </Card>
        </div>

        <div>
          <h2>{data.formHeading}</h2>
          <Card className="mt-4">
            {/*
              Read here, in a Server Component, and handed down. See the note
              in `turnstile.tsx` for why not in the client component itself.
            */}
            <EnquiryForm
              apiUrl={process.env["NEXT_PUBLIC_API_URL"] ?? ""}
              turnstileSiteKey={process.env["NEXT_PUBLIC_TURNSTILE_SITE_KEY"]}
            />
          </Card>
          <p className="mt-4 text-small text-grey">
            Looking for something specific? <TextLink cta={{ label: "See our FAQs", href: "/faqs" }} />
          </p>
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
    <Shell>
      <Measure>
        <h2>{data.heading}</h2>
        <p className="mt-4 text-ink/80">{data.body}</p>

        <Card className="mt-10 text-center">
          <h3>{data.closingHeading}</h3>
          <p className="mt-5">
            <Link href={data.closingCta.href} className={buttonClasses()}>
              {data.closingCta.label}
            </Link>
          </p>
        </Card>
      </Measure>
    </Shell>
  );
}

export interface NewsIntroData {
  heading: string;
  body: string;
  emptyStateHeading: string;
  emptyStateBody: string;
}

export function NewsIntro({ data }: Readonly<{ data: NewsIntroData }>) {
  return (
    <Shell space="loose">
      <h1>{data.heading}</h1>
      <Measure>
        <p className="mt-4 text-ink/80">{data.body}</p>
      </Measure>

      {/* Build package §4.6 asks for a friendly empty state before the first
          post, rather than a blank grid. */}
      <Card className="relative mt-10 overflow-hidden text-center">
        <Star className="pointer-events-none absolute -right-4 -top-4 size-24 text-yellow/30" />
        <h2 className="text-h3">{data.emptyStateHeading}</h2>
        <p className="mx-auto mt-3 max-w-lg text-grey">{data.emptyStateBody}</p>
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
    </Shell>
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
