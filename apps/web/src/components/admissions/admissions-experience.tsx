import Image from "next/image";
import Link from "next/link";

import { buttonClasses, Icon, Star, Watermark } from "@kedland/ui";

import type { CtaBannerData, HeroData, LevelCardsData, ProseStripData } from "@/components/sections/blocks";
import type { DownloadBlockData, StepsData } from "@/components/sections/blocks-extra";

import { ADMISSION_FORM_PATH, admissionFormExists } from "@/lib/admission-form";

interface AdmissionsExperienceProps {
  hero: HeroData | undefined;
  levels: LevelCardsData | undefined;
  steps: StepsData | undefined;
  download: DownloadBlockData | undefined;
  fees: ProseStripData | undefined;
  cta: CtaBannerData | undefined;
}

const FALLBACK = {
  hero: {
    eyebrow: "Admissions are open",
    heading: "Begin your child's journey at Kedland",
    subheading: "We'd love to welcome your little Star to the Kedland family.",
    primaryCta: { label: "Start your application", href: "#apply" },
    secondaryCta: { label: "Book a Tour", href: "/contact" },
    image: { mediaId: "placeholder-admissions", alt: "A child arriving for their first day at Kedland" },
    trustChips: ["Daycare–Primary 3", "Rolling enquiries", "After-School Service", "Weekend Drop-Off"],
  },
  levels: {
    heading: "Find their starting point",
    levels: [
      { icon: "baby", name: "Daycare", blurb: "Gentle first steps into play and wonder." },
      { icon: "blocks", name: "Nursery 1", blurb: "First friendships, songs and curious hands." },
      { icon: "palette", name: "Nursery 2", blurb: "Discovering letters, numbers and how things work." },
      { icon: "star", name: "Reception", blurb: "Growing ready and confident for school." },
      { icon: "book", name: "Primary 1–3", blurb: "Cambridge Primary and a love of learning." },
    ],
    cta: { label: "Ask us a question", href: "/contact" },
  },
  steps: {
    heading: "Four simple steps to Kedland",
    steps: [
      { title: "Complete the form", body: "Request or download the admission form and fill it in." },
      { title: "Return your documents", body: "Send it back or bring it to the school office." },
      { title: "Visit us", body: "Tour the school and arrange a friendly familiarisation session." },
      {
        title: "Welcome to Kedland",
        body: "Receive your offer, enrolment details and first-day information.",
      },
    ],
  },
  download: {
    heading: "Get the Kedland admission form",
    body: "Complete it at home and return it to the school office with your child's documents.",
    buttonLabel: "Download the Admission Form (PDF)",
    note: "Prefer to talk first? Contact us and we'll guide you through it.",
  },
  fees: {
    heading: "Fees and availability",
    body: "For current fees and available spaces, contact our admissions team and we will talk you through everything.",
    link: { label: "Contact admissions", href: "/contact" },
  },
  cta: {
    heading: "Ready to begin your child's journey?",
    body: "Come and see Kedland for yourself or speak with our admissions team.",
    primaryCta: { label: "Enrol Now", href: "#apply" },
    secondaryCta: { label: "Book a Tour", href: "/contact" },
  },
} satisfies {
  hero: HeroData;
  levels: LevelCardsData;
  steps: StepsData;
  download: DownloadBlockData;
  fees: ProseStripData;
  cta: CtaBannerData;
};

const LEVEL_TONES = ["bg-yellow/30", "bg-blue/15", "bg-pink/12", "bg-green/15", "bg-orange/15"] as const;

const STEP_TONES = ["bg-red", "bg-blue", "bg-pink", "bg-green"] as const;

export function AdmissionsExperience(props: Readonly<AdmissionsExperienceProps>) {
  const hero: HeroData = props.hero ?? FALLBACK.hero;
  const levels = props.levels ?? FALLBACK.levels;
  const steps = props.steps ?? FALLBACK.steps;
  const download = props.download ?? FALLBACK.download;
  const fees = props.fees ?? FALLBACK.fees;
  const cta = props.cta ?? FALLBACK.cta;
  const formAvailable = admissionFormExists();
  const formHref = formAvailable ? ADMISSION_FORM_PATH : "/contact";

  return (
    <>
      <section className="relative overflow-hidden bg-navy px-6 pb-24 pt-16 text-white sm:pb-28 sm:pt-20">
        <Star className="pointer-events-none absolute -right-12 top-8 size-64 text-yellow/[0.08]" />
        <span className="pointer-events-none absolute -left-36 -top-36 size-[32rem] rounded-pill bg-blue/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <p className="text-small font-bold uppercase tracking-[0.16em] text-yellow">{hero.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-[clamp(2.8rem,7vw,5.4rem)] leading-[0.98] text-white">
              A bright beginning starts here.
            </h1>
            <p className="mt-7 max-w-2xl text-[1.12rem] leading-relaxed text-white/72">{hero.subheading}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#apply" className={buttonClasses({ size: "lg" })}>
                Start your application <span aria-hidden="true">↓</span>
              </a>
              <Link
                href={hero.secondaryCta.href}
                className={buttonClasses({
                  variant: "outline-inverse",
                  size: "lg",
                })}
              >
                {hero.secondaryCta.label}
              </Link>
            </div>
            <ul className="mt-9 flex flex-wrap gap-2.5">
              {hero.trustChips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-pill bg-white/9 px-4 py-2 text-small font-bold text-white/75"
                >
                  {chip}
                </li>
              ))}
            </ul>
          </div>

          <aside className="neu-surface neu-surface-on-navy relative min-h-[31rem] overflow-hidden rounded-[1.5rem] text-ink">
            <Image
              src={hero.image.src ?? "/images/cms-starter/play-garden.webp"}
              alt={hero.image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 38vw, 92vw"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-linear-to-t from-navy-deep/92 via-navy/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
              <p className="text-small font-bold uppercase tracking-[0.12em] text-yellow">
                Come and see Kedland
              </p>
              <h2 className="mt-2 text-h3 text-white">A bright beginning, made personal.</h2>
              <Link
                href="/contact"
                className={buttonClasses({ variant: "outline-inverse", className: "mt-5" })}
              >
                Book a school tour <span aria-hidden="true">→</span>
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-20 pt-12 sm:pt-14">
        <div className="neu-surface mx-auto max-w-6xl rounded-[1.5rem] p-7 sm:p-10">
          <div className="sm:flex sm:items-end sm:justify-between sm:gap-8">
            <div>
              <p className="text-small font-bold uppercase tracking-[0.12em] text-red">Admissions now open</p>
              <h2 className="mt-2">{levels.heading}</h2>
            </div>
            <Link
              href={levels.cta.href}
              className="mt-4 inline-flex font-display font-bold text-blue sm:mt-0"
            >
              {levels.cta.label} →
            </Link>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {levels.levels.map((level, index) => (
              <li
                key={level.name}
                className={`public-tone-card neu-tile neu-interactive relative min-h-52 overflow-hidden rounded-[1.1rem] p-5 ${LEVEL_TONES[index % LEVEL_TONES.length] ?? "bg-sky/30"}`}
              >
                <Watermark name={level.icon} className="text-navy" />
                <span className="neu-icon relative grid size-11 place-items-center rounded-[0.8rem] text-navy">
                  <Icon name={level.icon} className="size-5" />
                </span>
                <h3 className="relative mt-6 text-[1.08rem]">{level.name}</h3>
                <p className="relative mt-2 text-small leading-relaxed text-grey">{level.blurb}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 pb-20 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
            <div>
              <p className="text-small font-bold uppercase tracking-[0.13em] text-red">
                The admissions journey
              </p>
              <h2 className="mt-3">{steps.heading}</h2>
              <p className="mt-5 max-w-md leading-relaxed text-ink/70">
                We keep the process personal and straightforward, and our team is available at every stage.
              </p>
            </div>

            <ol className="grid gap-4 sm:grid-cols-2">
              {steps.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="neu-surface neu-interactive relative overflow-hidden rounded-[1.1rem] p-6 sm:p-7"
                >
                  <span
                    className={`grid size-11 place-items-center rounded-pill font-display text-h3 font-extrabold text-white ${STEP_TONES[index % STEP_TONES.length] ?? "bg-navy"}`}
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-6">{step.title}</h3>
                  <p className="mt-3 text-small leading-relaxed text-grey">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="apply" className="scroll-mt-28 px-6 pb-20 sm:pb-24">
        <div className="neu-surface mx-auto grid max-w-6xl overflow-hidden rounded-[1.5rem] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="public-tone-panel public-tone-panel-warm relative overflow-hidden bg-yellow p-8 sm:p-10 lg:p-12">
            <Watermark name="book" className="text-navy" />
            <div className="relative">
              <p className="text-small font-bold uppercase tracking-[0.12em] text-ink/55">Application form</p>
              <h2 className="mt-3">{download.heading}</h2>
              <p className="mt-4 max-w-xl text-ink/72">{download.body}</p>
              <a
                href={formHref}
                {...(formAvailable ? { download: true } : {})}
                className={buttonClasses({ variant: "secondary", size: "lg", className: "mt-8" })}
              >
                {formAvailable ? download.buttonLabel : "Request the admission form"}
              </a>
              <p className="mt-5 text-small text-ink/62">{download.note}</p>
            </div>
          </div>

          <div className="public-tone-panel public-tone-panel-cool relative overflow-hidden bg-sky/40 p-8 sm:p-10 lg:p-12">
            <Watermark name="calculator" className="text-navy" />
            <div className="relative">
              <p className="text-small font-bold uppercase tracking-[0.12em] text-grey">
                Plan your next step
              </p>
              <h2 className="mt-3">{fees.heading}</h2>
              <p className="mt-4 leading-relaxed text-ink/72">{fees.body}</p>
              <Link
                href={fees.link.href}
                className={buttonClasses({ variant: "secondary", className: "mt-7" })}
              >
                {fees.link.label} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="neu-surface relative mx-auto max-w-6xl overflow-hidden rounded-[1.5rem] bg-linear-to-br from-pink/14 via-cream to-sky/18 px-8 py-12 text-center sm:px-12 sm:py-16">
          <Star className="pointer-events-none absolute -left-6 -top-7 size-28 text-white/70" />
          <div className="relative">
            <p className="text-small font-bold uppercase tracking-[0.12em] text-red">A warm welcome awaits</p>
            <h2 className="mx-auto mt-3 max-w-3xl">{cta.heading}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink/70">{cta.body}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="#apply" className={buttonClasses({ size: "lg" })}>
                Begin now
              </a>
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
