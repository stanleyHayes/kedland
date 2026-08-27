import Image from "next/image";
import Link from "next/link";

import { buttonClasses, Icon, Star, Watermark } from "@kedland/ui";

import type { CtaBannerData, PageIntroData } from "@/components/sections/blocks";
import type { EyfsAreasData, SubjectsGridData, TrioData } from "@/components/sections/blocks-extra";

const EARLY_YEARS_LABEL = "Early Years";

interface OverviewProps {
  intro?: PageIntroData | undefined;
  routes?: TrioData | undefined;
  cta?: CtaBannerData | undefined;
}

interface EarlyYearsProps {
  intro?: PageIntroData | undefined;
  eyfs?: EyfsAreasData | undefined;
  cta?: CtaBannerData | undefined;
}

interface PrimaryProps {
  intro?: PageIntroData | undefined;
  subjects?: SubjectsGridData | undefined;
  cta?: CtaBannerData | undefined;
}

const DEFAULT_CTA: CtaBannerData = {
  heading: "Come and discover Kedland",
  body: "Meet our teachers, explore the classrooms and see how your child could thrive as one of our Stars.",
  primaryCta: { label: "Explore admissions", href: "/admissions" },
  secondaryCta: { label: "Book a tour", href: "/contact" },
};

const OVERVIEW_FALLBACK = {
  intro: {
    eyebrow: "Our curriculum",
    heading: "Curious minds grow here",
    standfirst: "A British foundation in the early years and Cambridge Primary as your child grows.",
  },
  routes: {
    heading: "Two stages, one philosophy",
    cards: [
      {
        icon: "baby",
        title: EARLY_YEARS_LABEL,
        body: "The British Early Years Foundation Stage for our youngest Stars.",
      },
      {
        icon: "book",
        title: "Primary",
        body: "Cambridge Primary for Primary 1–3: practical, meaningful and engaging.",
      },
      {
        icon: "sparkle",
        title: "Inquiry throughout",
        body: "Children learn to research, question, test ideas and discover.",
      },
    ],
  },
} satisfies { intro: PageIntroData; routes: TrioData };

const EARLY_FALLBACK: EyfsAreasData = {
  heading: "Seven areas, one confident child",
  intro:
    "Our Early Years programme follows the British Early Years Foundation Stage. Children learn through purposeful play, rich conversation, movement, creativity and close relationships in a safe environment.",
  areas: [
    {
      number: 1,
      title: "Communication and Language",
      body: "Speaking, listening, songs and stories build confident communicators.",
    },
    {
      number: 2,
      title: "Physical Development",
      body: "Active play strengthens coordination, control and healthy habits.",
    },
    {
      number: 3,
      title: "Personal, Social and Emotional Development",
      body: "Children grow in confidence, empathy, independence and friendship.",
    },
    {
      number: 4,
      title: "Literacy",
      body: "Phonics, books and early writing open the door to lifelong reading.",
    },
    {
      number: 5,
      title: "Understanding the World",
      body: "Observation and exploration help children make sense of people and places.",
    },
    {
      number: 6,
      title: "Expressive Arts and Design",
      body: "Art, music, movement and role-play give every imagination room.",
    },
    {
      number: 7,
      title: "Mathematics",
      body: "Hands-on counting, patterns and shapes make number learning joyful.",
    },
  ],
  assessmentHeading: "A thoughtful picture of progress",
  assessment:
    "An EYFS profile assessment is completed before Key Stage 1, showing each child's progress and readiness.",
};

const PRIMARY_FALLBACK: SubjectsGridData = {
  heading: "A broad Cambridge Primary curriculum",
  intro:
    "Our Primary 1–3 classrooms are calm, engaging and inclusive. Lessons are interactive, practical and differentiated so every child can build confidence, curiosity and a lasting passion for learning.",
  subjects: [
    {
      icon: "book",
      title: "English",
      body: "Reading, writing, speaking and listening for confident communication.",
    },
    { icon: "calculator", title: "Mathematics", body: "Logical thinking and practical problem-solving." },
    { icon: "sparkle", title: "Science", body: "Hands-on discovery, questions and evidence." },
    { icon: "monitor", title: "ICT", body: "Digital confidence and inventive thinking." },
    { icon: "music", title: "Music", body: "Creativity, memory, focus and togetherness." },
    { icon: "globe", title: "Geography", body: "People, places, environments and our shared world." },
    { icon: "palette", title: "Arts & Design", body: "Ideas expressed through art, design and making." },
    {
      icon: "globe",
      title: "French",
      body: "Speaking, writing and comprehension in another global language.",
    },
    { icon: "book", title: "History", body: "Exploring the past to better understand the present." },
  ],
};

const AREA_STYLES = [
  "bg-red text-white",
  "bg-orange text-ink",
  "bg-yellow text-ink",
  "bg-green text-white",
  "bg-blue text-white",
  "bg-pink text-white",
  "bg-navy text-white",
] as const;

const SUBJECT_STYLES = [
  "bg-yellow/35",
  "bg-sky/55",
  "bg-pink/15",
  "bg-green/15",
  "bg-orange/20",
  "bg-blue/12",
] as const;

const EARLY_YEARS_IMAGES = [
  "/images/learning/early-years/communication-language.jpg",
  "/images/learning/early-years/physical-development.jpg",
  "/images/learning/early-years/personal-social-emotional.jpg",
  "/images/learning/early-years/literacy.jpg",
  "/images/learning/early-years/understanding-world.jpg",
  "/images/learning/early-years/expressive-arts-design.jpg",
  "/images/learning/early-years/mathematics.jpg",
] as const;

const PRIMARY_IMAGES = [
  "/images/learning/primary/english.jpg",
  "/images/learning/primary/mathematics.jpg",
  "/images/learning/primary/science.jpg",
  "/images/learning/primary/ict.jpg",
  "/images/learning/primary/music.jpg",
  "/images/learning/primary/geography.jpg",
  "/images/learning/primary/arts-design.jpg",
  "/images/learning/primary/french.jpg",
  "/images/learning/primary/history.jpg",
] as const;

function AcademicCta({ data = DEFAULT_CTA }: Readonly<{ data?: CtaBannerData | undefined }>) {
  return (
    <section className="px-6 pb-20 pt-4">
      <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 overflow-hidden rounded-lg bg-linear-to-r from-red to-pink p-8 text-white sm:p-10 md:flex-row md:items-center md:p-12">
        <Watermark name="star" className="-bottom-12 -right-8 size-56 text-white opacity-15" />
        <div className="relative max-w-2xl">
          <p className="text-small font-bold uppercase tracking-[0.13em] text-white/65">The next chapter</p>
          <h2 className="mt-2 text-white">{data.heading}</h2>
          <p className="mt-3 max-w-xl text-white/78">{data.body}</p>
        </div>
        <div className="relative flex shrink-0 flex-wrap gap-3">
          <Link href={data.primaryCta.href} className={buttonClasses({ variant: "tertiary", size: "lg" })}>
            {data.primaryCta.label}
          </Link>
          <Link
            href={data.secondaryCta.href}
            className={buttonClasses({
              variant: "outline-inverse",
              size: "lg",
            })}
          >
            {data.secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AcademicsOverview({
  intro = OVERVIEW_FALLBACK.intro,
  routes = OVERVIEW_FALLBACK.routes,
  cta,
}: Readonly<OverviewProps>) {
  const early = routes.cards[0] ?? {
    icon: "baby",
    title: EARLY_YEARS_LABEL,
    body: "The British Early Years Foundation Stage for our youngest Stars.",
  };
  const primary = routes.cards[1] ?? {
    icon: "book",
    title: "Primary",
    body: "Cambridge Primary for Primary 1–3: practical, meaningful and engaging.",
  };
  const inquiry = routes.cards[2] ?? {
    icon: "sparkle",
    title: "Inquiry throughout",
    body: "Children learn to research, question, test ideas and discover.",
  };

  return (
    <>
      <section className="relative overflow-hidden bg-navy px-6 pb-24 pt-16 text-white sm:pb-28 sm:pt-20">
        <Star className="pointer-events-none absolute -right-10 top-4 size-64 text-yellow/[0.07]" />
        <span className="pointer-events-none absolute -left-40 -top-44 size-[36rem] rounded-pill bg-blue/16 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20">
          <div>
            <p className="text-small font-bold uppercase tracking-[0.16em] text-yellow">{intro.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-[clamp(3rem,7vw,5.6rem)] leading-[0.96] text-white">
              Learning begins with wonder.
            </h1>
            <p className="mt-7 max-w-2xl text-[1.12rem] leading-relaxed text-white/72">{intro.standfirst}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#pathways" className={buttonClasses({ size: "lg" })}>
                Explore our curriculum ↓
              </Link>
              <Link
                href="/contact"
                className={buttonClasses({
                  variant: "outline-inverse",
                  size: "lg",
                })}
              >
                Meet our teachers
              </Link>
            </div>
          </div>

          <div className="neu-surface-dark relative mx-auto w-full max-w-md overflow-hidden rounded-[1.5rem] p-7 text-white sm:p-9">
            <Watermark name="book" className="-bottom-10 -right-8 size-48 text-white opacity-[0.035]" />
            <div className="relative">
              <p className="text-small font-bold uppercase tracking-[0.13em] text-yellow">
                The Kedland learning path
              </p>
              <ol className="mt-7 space-y-3">
                {[
                  ["01", "Play, language & belonging", EARLY_YEARS_LABEL],
                  ["02", "Strong foundations", "Reception"],
                  ["03", "Knowledge, inquiry & confidence", "Primary 1–3"],
                ].map(([number, title, stage], index) => (
                  <li
                    key={number}
                    className="flex items-center gap-4 rounded-[0.9rem] border border-white/10 bg-white/[0.055] p-4 shadow-[inset_3px_3px_8px_rgb(3_24_36/0.2),inset_-2px_-2px_6px_rgb(61_155_233/0.05)]"
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-pill font-display font-extrabold ${AREA_STYLES[index] ?? AREA_STYLES[0]}`}
                    >
                      {number}
                    </span>
                    <span>
                      <span className="block font-display font-bold text-white">{title}</span>
                      <span className="text-small text-white/55">{stage}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section id="pathways" className="scroll-mt-28 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-small font-bold uppercase tracking-[0.13em] text-red">One connected journey</p>
            <h2 className="mt-3">{routes.heading}</h2>
            <p className="mt-4 text-ink/70">
              Every stage keeps the same promise: know the child, invite curiosity and make learning
              meaningful.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <Link
              href="/academics/early-years"
              className="public-tone-panel public-tone-panel-warm group relative min-h-96 overflow-hidden rounded-lg bg-yellow p-8 shadow-card transition-transform hover:-translate-y-1 sm:p-10"
            >
              <Watermark name={early.icon} className="text-navy" />
              <div className="relative flex h-full flex-col justify-between">
                <span className="grid size-14 place-items-center rounded-pill bg-white text-navy shadow-card">
                  <Icon name={early.icon} className="size-7" />
                </span>
                <div>
                  <p className="text-small font-bold uppercase tracking-[0.13em] text-ink/50">
                    Birth to five
                  </p>
                  <h3 className="mt-2 text-h2">{early.title}</h3>
                  <p className="mt-3 max-w-md text-ink/72">{early.body}</p>
                  <span className="mt-7 inline-flex font-display font-bold text-navy">
                    Explore Early Years{" "}
                    <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </div>
            </Link>

            <Link
              href="/academics/primary"
              className="public-tone-panel public-tone-panel-cool group relative min-h-96 overflow-hidden rounded-lg bg-blue p-8 text-white shadow-card transition-transform hover:-translate-y-1 sm:p-10"
            >
              <Watermark name={primary.icon} className="text-navy" />
              <div className="relative flex h-full flex-col justify-between">
                <span className="grid size-14 place-items-center rounded-pill bg-white text-blue shadow-card">
                  <Icon name={primary.icon} className="size-7" />
                </span>
                <div>
                  <p className="text-small font-bold uppercase tracking-[0.13em] text-white/58">
                    Primary 1–3
                  </p>
                  <h3 className="mt-2 text-h2 text-white">{primary.title}</h3>
                  <p className="mt-3 max-w-md text-white/76">{primary.body}</p>
                  <span className="mt-7 inline-flex font-display font-bold text-white">
                    Explore Primary{" "}
                    <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:pb-24">
        <div className="relative mx-auto grid max-w-6xl gap-8 overflow-hidden rounded-lg bg-pink/12 p-8 sm:p-10 md:grid-cols-[auto_1fr] md:items-center md:p-12">
          <span className="grid size-20 place-items-center rounded-pill bg-white text-pink shadow-card">
            <Icon name={inquiry.icon} className="size-9" />
          </span>
          <div>
            <p className="text-small font-bold uppercase tracking-[0.13em] text-red">
              Our teaching philosophy
            </p>
            <h2 className="mt-2">{inquiry.title}</h2>
            <p className="mt-3 max-w-3xl text-ink/72">{inquiry.body}</p>
          </div>
        </div>
      </section>

      <AcademicCta data={cta} />
    </>
  );
}

export function EarlyYearsExperience({ intro, eyfs = EARLY_FALLBACK, cta }: Readonly<EarlyYearsProps>) {
  return (
    <>
      <section className="relative overflow-hidden bg-pink/16 px-6 pb-20 pt-16 sm:pb-24 sm:pt-20">
        <Star className="pointer-events-none absolute -left-8 top-12 size-44 text-white/70" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-20">
          <div>
            <Link href="/academics" className="text-small font-bold text-blue hover:underline">
              ← All academics
            </Link>
            <p className="mt-9 text-small font-bold uppercase tracking-[0.15em] text-red">
              {intro?.eyebrow ?? EARLY_YEARS_LABEL}
            </p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2.8rem,6.6vw,5.2rem)] leading-[0.98]">
              Big learning starts with little discoveries.
            </h1>
            <p className="mt-6 max-w-2xl text-[1.1rem] leading-relaxed text-ink/72">
              {intro?.standfirst ??
                "The British Early Years Foundation Stage for children from birth to five."}
            </p>
            <Link href="#seven-areas" className={buttonClasses({ size: "lg", className: "mt-8" })}>
              Discover the seven areas ↓
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3" aria-label="Seven areas of Early Years learning">
            {eyfs.areas.map((area, index) => (
              <div
                key={area.number}
                className={`grid aspect-square place-items-center rounded-lg p-3 text-center shadow-card ${AREA_STYLES[index % AREA_STYLES.length] ?? AREA_STYLES[0]} ${index === 0 ? "col-span-2 row-span-2" : ""}`}
              >
                <span>
                  <span
                    className={`block font-display font-extrabold ${index === 0 ? "text-[3rem]" : "text-h2"}`}
                  >
                    {area.number}
                  </span>
                  <span
                    className={`mt-1 block font-display font-bold leading-tight ${index === 0 ? "text-base" : "text-[0.68rem]"}`}
                  >
                    {area.title}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="text-small font-bold uppercase tracking-[0.13em] text-red">Purposeful play</p>
            <h2 className="mt-3">A strong foundation for school and life</h2>
          </div>
          <p className="text-[1.03rem] leading-[1.8] text-ink/76">{eyfs.intro}</p>
        </div>
      </section>

      <section id="seven-areas" className="scroll-mt-28 px-6 pb-20 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-small font-bold uppercase tracking-[0.13em] text-red">The whole child</p>
          <h2 className="mt-3">{eyfs.heading}</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eyfs.areas.map((area, index) => (
              <li
                key={area.number}
                className={`public-tone-card group relative overflow-hidden rounded-lg ${SUBJECT_STYLES[index % SUBJECT_STYLES.length] ?? SUBJECT_STYLES[0]} ${index === 0 ? "lg:col-span-2 lg:grid lg:grid-cols-[1.08fr_0.92fr]" : ""}`}
              >
                <div
                  className={`relative overflow-hidden ${index === 0 ? "min-h-64 lg:min-h-full" : "aspect-[3/2]"}`}
                >
                  <Image
                    src={EARLY_YEARS_IMAGES[index] ?? EARLY_YEARS_IMAGES[0]}
                    alt={`Learning materials for ${area.title.toLowerCase()}`}
                    fill
                    sizes={
                      index === 0
                        ? "(min-width: 1024px) 38vw, 92vw"
                        : "(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 92vw"
                    }
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="relative p-7">
                  <span className="pointer-events-none absolute -bottom-8 -right-2 font-display text-[8rem] font-extrabold leading-none text-navy/[0.05]">
                    {area.number}
                  </span>
                  <span
                    className={`relative grid size-11 place-items-center rounded-pill font-display font-extrabold ${AREA_STYLES[index % AREA_STYLES.length] ?? AREA_STYLES[0]}`}
                  >
                    {area.number}
                  </span>
                  <h3 className="relative mt-6 text-h3">{area.title}</h3>
                  <p className="relative mt-3 text-small leading-relaxed text-ink/70">{area.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-6 pb-20 sm:pb-24">
        <div className="relative mx-auto grid max-w-6xl gap-7 overflow-hidden rounded-lg bg-navy p-8 text-white sm:p-10 md:grid-cols-[auto_1fr] md:items-center md:p-12">
          <Watermark name="star" className="text-white" />
          <span className="relative grid size-16 place-items-center rounded-pill bg-yellow text-navy">
            <Icon name="sparkle" className="size-7" />
          </span>
          <div className="relative">
            <p className="text-small font-bold uppercase tracking-[0.13em] text-yellow">
              {eyfs.assessmentHeading}
            </p>
            <h2 className="mt-2 text-white">Progress you can understand</h2>
            <p className="mt-3 max-w-3xl text-white/72">{eyfs.assessment}</p>
          </div>
        </div>
      </section>

      <AcademicCta data={cta} />
    </>
  );
}

export function PrimaryExperience({ intro, subjects = PRIMARY_FALLBACK, cta }: Readonly<PrimaryProps>) {
  return (
    <>
      <section className="relative overflow-hidden bg-blue px-6 pb-20 pt-16 text-white sm:pb-24 sm:pt-20">
        <span className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-pill bg-white/10 blur-3xl" />
        <Watermark name="book" className="-bottom-12 -left-10 size-64 text-navy opacity-20" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <Link href="/academics" className="text-small font-bold text-white/70 hover:text-yellow">
              ← All academics
            </Link>
            <p className="mt-9 text-small font-bold uppercase tracking-[0.15em] text-yellow">
              {intro?.eyebrow ?? "Primary"}
            </p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2.8rem,6.4vw,5.1rem)] leading-[0.98] text-white">
              Knowledge that grows into confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-[1.1rem] leading-relaxed text-white/76">
              {intro?.standfirst ?? "Cambridge Primary for Primary 1–3, with room to grow."}
            </p>
            <Link
              href="#subjects"
              className={buttonClasses({ variant: "tertiary", size: "lg", className: "mt-8" })}
            >
              Explore our subjects ↓
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-lg bg-navy p-8 shadow-lift sm:p-10">
            <Star className="absolute -right-6 -top-6 size-32 text-yellow/10" />
            <div className="relative">
              <span className="font-display text-[5.5rem] font-extrabold leading-none text-yellow">
                {subjects.subjects.length}
              </span>
              <p className="mt-2 font-display text-h2 font-extrabold text-white">ways to find a spark</p>
              <p className="mt-4 text-white/68">
                A broad curriculum gives every child more opportunities to discover what excites them.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {subjects.subjects.slice(0, 5).map((subject) => (
                  <span
                    key={subject.title}
                    className="rounded-pill bg-white/10 px-3 py-1.5 text-small font-bold text-white/75"
                  >
                    {subject.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="text-small font-bold uppercase tracking-[0.13em] text-red">Cambridge Primary</p>
            <h2 className="mt-3">Prepared for the world ahead</h2>
          </div>
          <p className="text-[1.03rem] leading-[1.8] text-ink/76">{subjects.intro}</p>
        </div>
      </section>

      <section id="subjects" className="scroll-mt-28 px-6 pb-20 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-small font-bold uppercase tracking-[0.13em] text-red">A world of learning</p>
          <h2 className="mt-3">{subjects.heading}</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.subjects.map((subject, index) => (
              <li
                key={subject.title}
                className={`public-tone-card group relative overflow-hidden rounded-lg ${SUBJECT_STYLES[index % SUBJECT_STYLES.length] ?? SUBJECT_STYLES[0]}`}
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image
                    src={PRIMARY_IMAGES[index] ?? PRIMARY_IMAGES[0]}
                    alt={`Learning materials for ${subject.title.toLowerCase()}`}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="relative p-7">
                  <Watermark name={subject.icon} className="text-navy" />
                  <span className="relative grid size-12 place-items-center rounded-pill bg-white text-blue shadow-card">
                    <Icon name={subject.icon} className="size-6" />
                  </span>
                  <h3 className="relative mt-6 text-h3">{subject.title}</h3>
                  <p className="relative mt-3 text-small leading-relaxed text-ink/70">{subject.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 pb-20 sm:pb-24">
        <div className="public-tone-panel public-tone-panel-warm mx-auto max-w-6xl rounded-lg bg-yellow p-8 sm:p-10 md:p-12">
          <p className="text-small font-bold uppercase tracking-[0.13em] text-ink/55">
            Inside every classroom
          </p>
          <h2 className="mt-3 max-w-3xl">Teaching that meets the child</h2>
          <ul className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: "sparkle",
                title: "Interactive",
                body: "Children question, discuss, test and create—not simply memorise.",
              },
              {
                icon: "blocks",
                title: "Differentiated",
                body: "Learning is shaped around individual needs, strengths and next steps.",
              },
              {
                icon: "star",
                title: "Meaningful",
                body: "Ideas connect to practical experiences and the world beyond school.",
              },
            ].map((item) => (
              <li key={item.title} className="rounded-lg bg-white/70 p-6">
                <Icon name={item.icon} className="size-6 text-blue" />
                <h3 className="mt-4">{item.title}</h3>
                <p className="mt-2 text-small leading-relaxed text-ink/68">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <AcademicCta data={cta} />
    </>
  );
}
