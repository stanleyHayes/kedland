import { z } from "zod";

import { bodyText, ctaSchema, eyebrow, iconName, imageSchema, shortText } from "./fields";

/**
 * Section value schemas.
 *
 * These describe what an editor may change *inside* a section. They never
 * describe whether a section exists, where it sits, or how it looks — that is
 * the registry's job (registry.ts) and React's job respectively.
 *
 * Fixed-length arrays are the point, not an oversight. `cards.length(4)` is how
 * we keep a four-up grid a four-up grid. Build package §0 is explicit that the
 * previous site died from uncontrolled edits; this file is where "controlled"
 * is actually spelled out.
 */

export const heroSchema = z.strictObject({
  eyebrow,
  heading: shortText(90),
  subheading: bodyText(320),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
  image: imageSchema,
  /** The four credibility chips under the hero. Exactly four — they sit in one row. */
  trustChips: z.array(shortText(40)).length(4),
});

export const proseStripSchema = z.strictObject({
  heading: shortText(90),
  body: bodyText(1000),
  link: ctaSchema,
});

export const iconCardsSchema = z.strictObject({
  eyebrow,
  heading: shortText(90),
  cards: z
    .array(
      z.strictObject({
        icon: iconName,
        title: shortText(60),
        body: bodyText(280),
      }),
    )
    .length(4),
});

export const levelCardsSchema = z.strictObject({
  heading: shortText(90),
  levels: z
    .array(
      z.strictObject({
        icon: iconName,
        name: shortText(48),
        blurb: bodyText(160),
      }),
    )
    .min(3)
    .max(8),
  cta: ctaSchema,
});

/**
 * The KEDLAND acronym reveal — build package §4.2b calls this "a signature
 * moment". Exactly seven tiles, because the school's name has seven letters and
 * the whole conceit collapses otherwise.
 */
export const valuesTilesSchema = z.strictObject({
  heading: shortText(90),
  tiles: z
    .array(
      z.strictObject({
        letter: z
          .string()
          .trim()
          .length(1)
          .regex(/^[A-Z]$/, "Must be a single capital letter")
          // Patterned, so it declares a blank that satisfies itself — see FieldMeta.
          .meta({ control: "text", blank: "A" }),
        name: shortText(24),
        body: bodyText(240),
      }),
    )
    .length(7),
  cta: ctaSchema,
});

export const quoteTeaserSchema = z.strictObject({
  portrait: imageSchema,
  quote: bodyText(600),
  name: shortText(60),
  role: shortText(60),
  cta: ctaSchema,
});

/**
 * The Instagram showcase is a *link out*, not a feed. The tiles themselves live
 * in their own collection so they can be swapped without touching page content;
 * build package §5.3 is emphatic that there is no API, no token and no cost here.
 */
export const instagramSchema = z.strictObject({
  heading: shortText(90),
  handle: z
    .string()
    .trim()
    .regex(/^@[A-Za-z0-9._]{1,30}$/, "Must be an Instagram handle such as @kedlandintlschool")
    // Patterned, so it declares its own blank — the school's real handle.
    .meta({ control: "text", blank: "@kedlandintlschool" }),
});

export const ctaBannerSchema = z.strictObject({
  heading: shortText(90),
  body: bodyText(320),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
});

/** An intro band: eyebrow, heading, one line. Opens most pages. */
export const pageIntroSchema = z.strictObject({
  eyebrow,
  heading: shortText(90),
  standfirst: bodyText(320),
  /** Optional so existing CMS documents remain valid during the visual upgrade. */
  image: imageSchema.optional(),
});

/** Long-form prose with no link — the About story, the EYFS explanation. */
export const proseBandSchema = z.strictObject({
  heading: shortText(90),
  body: bodyText(2400),
});

/** The Principal's full message, with her sign-off. */
export const letterSchema = z.strictObject({
  heading: shortText(90),
  portrait: imageSchema,
  body: bodyText(3000),
  signOff: shortText(60),
  name: shortText(60),
  role: shortText(80),
  cta: ctaSchema,
});

/** Mission and Vision as a pair of cards, with the motto beneath. */
export const missionVisionSchema = z.strictObject({
  missionHeading: shortText(40),
  mission: bodyText(600),
  visionHeading: shortText(40),
  vision: bodyText(600),
  mottoHeading: shortText(40),
  motto: shortText(60),
  mottoBody: bodyText(600),
});

/** A grid of named facilities or activities, each with an icon. */
export const featureGridSchema = z.strictObject({
  heading: shortText(90),
  intro: bodyText(900),
  items: z
    .array(z.strictObject({ icon: iconName, label: shortText(60) }))
    .min(3)
    .max(12),
});

/**
 * The EYFS honeycomb — build package §4.3a.
 *
 * Exactly seven areas. The descriptions stay here as text rather than being
 * baked into the diagram: the package is explicit that this section must be
 * readable by crawlers and screen readers, not only by eyes.
 */
export const eyfsAreasSchema = z.strictObject({
  heading: shortText(90),
  intro: bodyText(2400),
  areas: z
    .array(
      z.strictObject({
        number: z.number().int().min(1).max(7),
        title: shortText(60),
        body: bodyText(700),
      }),
    )
    .length(7),
  assessmentHeading: shortText(60),
  assessment: bodyText(600),
});

/** The Cambridge primary subjects, each with its blurb. */
export const subjectsGridSchema = z.strictObject({
  heading: shortText(90),
  intro: bodyText(1600),
  subjects: z
    .array(z.strictObject({ icon: iconName, title: shortText(60), body: bodyText(600) }))
    .min(4)
    .max(12),
});

/** The numbered "how to enrol" steps. */
export const stepsSchema = z.strictObject({
  heading: shortText(90),
  steps: z
    .array(z.strictObject({ title: shortText(70), body: bodyText(500) }))
    .min(3)
    .max(6),
});

/** The admission-form download block. The file itself lives in Settings. */
export const downloadBlockSchema = z.strictObject({
  heading: shortText(90),
  body: bodyText(400),
  buttonLabel: shortText(60),
  note: bodyText(300),
});

/** A day in the life — the playful timeline. */
export const timelineSchema = z.strictObject({
  heading: shortText(90),
  intro: bodyText(600),
  moments: z
    .array(z.strictObject({ icon: iconName, title: shortText(60), body: bodyText(400) }))
    .min(4)
    .max(10),
});

/** Colourful activity chips — clubs and extracurriculars. */
export const chipsBandSchema = z.strictObject({
  heading: shortText(90),
  body: bodyText(900),
  chips: z.array(shortText(40)).min(3).max(14),
});

/** Three short cards — arts, music and sport; the pastoral trio. */
export const trioSchema = z.strictObject({
  heading: shortText(90),
  cards: z.array(z.strictObject({ icon: iconName, title: shortText(60), body: bodyText(400) })).length(3),
});

/** Contact framing. The details themselves live in Settings. */
export const contactDetailsSchema = z.strictObject({
  heading: shortText(90),
  body: bodyText(600),
  formHeading: shortText(90),
  mapHeading: shortText(90),
});

/** The FAQ page's framing; the questions live in their own collection. */
export const faqIntroSchema = z.strictObject({
  heading: shortText(90),
  body: bodyText(600),
  closingHeading: shortText(90),
  closingCta: ctaSchema,
});

/** The news list's framing and its empty state. */
export const newsIntroSchema = z.strictObject({
  heading: shortText(90),
  body: bodyText(600),
  emptyStateHeading: shortText(90),
  emptyStateBody: bodyText(400),
});

/** A block of policy prose — the privacy notice. */
export const legalSchema = z.strictObject({
  heading: shortText(90),
  body: bodyText(6000),
  lastUpdated: shortText(40),
});

/** Every section schema, keyed by the type name the registry refers to. */
export const SECTION_SCHEMAS = {
  hero: heroSchema,
  "page-intro": pageIntroSchema,
  "prose-strip": proseStripSchema,
  "prose-band": proseBandSchema,
  "icon-cards": iconCardsSchema,
  "level-cards": levelCardsSchema,
  "values-tiles": valuesTilesSchema,
  "quote-teaser": quoteTeaserSchema,
  letter: letterSchema,
  "mission-vision": missionVisionSchema,
  "feature-grid": featureGridSchema,
  "eyfs-areas": eyfsAreasSchema,
  "subjects-grid": subjectsGridSchema,
  steps: stepsSchema,
  "download-block": downloadBlockSchema,
  timeline: timelineSchema,
  "chips-band": chipsBandSchema,
  trio: trioSchema,
  instagram: instagramSchema,
  "cta-banner": ctaBannerSchema,
  "contact-details": contactDetailsSchema,
  "faq-intro": faqIntroSchema,
  "news-intro": newsIntroSchema,
  legal: legalSchema,
} as const satisfies Record<string, z.ZodType>;

export type SectionType = keyof typeof SECTION_SCHEMAS;

/** The validated value shape for a given section type. */
export type SectionData<T extends SectionType> = z.infer<(typeof SECTION_SCHEMAS)[T]>;
