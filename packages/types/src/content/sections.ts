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
          .regex(/^[A-Z]$/, "Must be a single capital letter"),
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
    .regex(/^@[A-Za-z0-9._]{1,30}$/, "Must be an Instagram handle such as @kedlandintlschool"),
});

export const ctaBannerSchema = z.strictObject({
  heading: shortText(90),
  body: bodyText(320),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
});

/** Every section schema, keyed by the type name the registry refers to. */
export const SECTION_SCHEMAS = {
  hero: heroSchema,
  "prose-strip": proseStripSchema,
  "icon-cards": iconCardsSchema,
  "level-cards": levelCardsSchema,
  "values-tiles": valuesTilesSchema,
  "quote-teaser": quoteTeaserSchema,
  instagram: instagramSchema,
  "cta-banner": ctaBannerSchema,
} as const satisfies Record<string, z.ZodType>;

export type SectionType = keyof typeof SECTION_SCHEMAS;

/** The validated value shape for a given section type. */
export type SectionData<T extends SectionType> = z.infer<(typeof SECTION_SCHEMAS)[T]>;
