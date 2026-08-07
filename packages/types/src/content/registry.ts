import { z } from "zod";

import { SECTION_SCHEMAS, type SectionType } from "./sections";

/**
 * The page/section registry — the single mechanism that makes a CMS safe here.
 *
 * Build package §0 and §6.1 record that the previous Kedland site died from
 * uncontrolled multi-user edits. agent_plan §0.2 is the reversal and its
 * guardrails; this file is the load-bearing one. It declares, in code:
 *
 *   - which pages exist
 *   - which sections each page has, in which order
 *   - which schema validates each section's values
 *
 * MongoDB stores only the `data` for each (page, key) pair. It cannot introduce
 * a section, remove one, or move one — the registry is not writable at runtime.
 * An editor changes words and pictures. A developer changes structure, in a PR.
 */

/** Every route that carries CMS content. */
export const PAGE_KEYS = [
  "home",
  "about",
  "about/our-story",
  "about/mission-vision-values",
  "about/principal",
  "about/facilities",
  "academics",
  "academics/early-years",
  "academics/primary",
  "admissions",
  "student-life",
  "news",
  "contact",
  "faqs",
  "privacy",
] as const;

export const pageKeySchema = z.enum(PAGE_KEYS);
export type PageKey = z.infer<typeof pageKeySchema>;

/** One section slot on one page. */
export interface SectionDefinition {
  /** Stable identifier, unique within its page. Used as the Mongo lookup key. */
  readonly key: string;
  /** Which schema validates this slot's values. */
  readonly type: SectionType;
  /** Human label shown in the dashboard's section list. */
  readonly label: string;
  /** One line of guidance rendered above the form. */
  readonly hint: string;
}

export interface PageDefinition {
  readonly key: PageKey;
  readonly label: string;
  readonly route: string;
  readonly sections: readonly SectionDefinition[];
}

/**
 * Sections that appear on many pages, defined once.
 *
 * Build package §3 puts the closing call to action above the footer on most
 * pages and opens most of them with an intro band. Repeating the literals at
 * every site would mean editing fifteen places to change one wording.
 */
const CTA_BANNER_SECTION = {
  key: "cta-banner",
  type: "cta-banner",
  label: "Closing call to action",
  hint: "Sits directly above the footer.",
} as const satisfies SectionDefinition;

const INSTAGRAM_SECTION = {
  key: "instagram",
  type: "instagram",
  label: "Life at Kedland",
  hint: "The photographs come from Content → Gallery images. Also shown on /gallery.",
} as const satisfies SectionDefinition;

/** Only-open-levels is a factual constraint, not a style note (§4.3b). */
const LEVELS_HINT = "Only advertise levels that are open. Primary 1–3 for now.";
const VALUES_HINT = "Exactly seven tiles — one per letter of the school's name.";
const INTRO_LABEL = "Intro band";
/** Most pages open with the same section type. */
const PAGE_INTRO: SectionDefinition["type"] = "page-intro";

/**
 * Every page and the sections it carries, in order.
 *
 * Straight from build package §4. Adding, removing or reordering a section here
 * is a pull request; changing the words inside one is a dashboard edit. That
 * split is the whole guardrail.
 */
const PAGE_DEFINITIONS: readonly PageDefinition[] = [
  {
    key: "home",
    label: "Home",
    route: "/",
    sections: [
      {
        key: "hero",
        type: "hero",
        label: "Hero",
        hint: "The first thing a parent sees. Keep the heading to one warm line.",
      },
      {
        key: "welcome",
        type: "prose-strip",
        label: "Welcome strip",
        hint: "A short, personal welcome. Links through to the About page.",
      },
      {
        key: "why-cards",
        type: "icon-cards",
        label: "We focus on the WHY",
        hint: "Exactly four cards — they sit in one row on desktop.",
      },
      {
        key: "levels",
        type: "level-cards",
        label: "Our levels",
        hint: LEVELS_HINT,
      },
      {
        key: "values",
        type: "values-tiles",
        label: "Our values (KEDLAND)",
        hint: VALUES_HINT,
      },
      {
        key: "principal",
        type: "quote-teaser",
        label: "Principal's welcome",
        hint: "A short pull-quote. The full message lives on the Principal page.",
      },
      INSTAGRAM_SECTION,
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "about",
    label: "About",
    route: "/about",
    sections: [
      { key: "intro", type: PAGE_INTRO, label: INTRO_LABEL, hint: "One line on what Kedland is." },
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "about/our-story",
    label: "Our Story",
    route: "/about/our-story",
    sections: [
      { key: "intro", type: PAGE_INTRO, label: INTRO_LABEL, hint: "How the school began, in one line." },
      {
        key: "story",
        type: "prose-band",
        label: "How Kedland began",
        hint: "The school's own account. Do not paraphrase.",
      },
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "about/mission-vision-values",
    label: "Mission, Vision & Values",
    route: "/about/mission-vision-values",
    sections: [
      { key: "intro", type: PAGE_INTRO, label: INTRO_LABEL, hint: "What the school stands for." },
      {
        key: "mission-vision",
        type: "mission-vision",
        label: "Mission, Vision & Motto",
        hint: "The school's own wording, approved. Do not rewrite.",
      },
      {
        key: "values",
        type: "values-tiles",
        label: "The KEDLAND values",
        hint: VALUES_HINT,
      },
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "about/principal",
    label: "Principal's Welcome",
    route: "/about/principal",
    sections: [
      {
        key: "letter",
        type: "letter",
        label: "The Principal's message",
        hint: "Mary's own words. The portrait is the logo until a photo is supplied.",
      },
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "about/facilities",
    label: "Facilities",
    route: "/about/facilities",
    sections: [
      { key: "intro", type: PAGE_INTRO, label: INTRO_LABEL, hint: "The campus, in one line." },
      {
        key: "facilities",
        type: "feature-grid",
        label: "Facilities grid",
        hint: "Confirm the list with the school before launch — see the punch list.",
      },
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "academics",
    label: "Academics",
    route: "/academics",
    sections: [
      { key: "intro", type: PAGE_INTRO, label: INTRO_LABEL, hint: "The curriculum in one line." },
      {
        key: "routes",
        type: "trio",
        label: "Route cards",
        hint: "Early Years and Primary, plus what ties them together.",
      },
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "academics/early-years",
    label: "Early Years",
    route: "/academics/early-years",
    sections: [
      { key: "intro", type: PAGE_INTRO, label: INTRO_LABEL, hint: "The EYFS in one line." },
      {
        key: "eyfs",
        type: "eyfs-areas",
        label: "The seven areas of study",
        hint: "Exactly seven. The descriptions must stay as text, not baked into the diagram.",
      },
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "academics/primary",
    label: "Primary",
    route: "/academics/primary",
    sections: [
      { key: "intro", type: PAGE_INTRO, label: INTRO_LABEL, hint: "Cambridge Primary in one line." },
      {
        key: "subjects",
        type: "subjects-grid",
        label: "Primary subjects",
        hint: "Only the subjects actually taught. Primary 1–3 for now.",
      },
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "admissions",
    label: "Admissions",
    route: "/admissions",
    sections: [
      { key: "hero", type: "hero", label: "Hero", hint: "Admissions are open — lead with the invitation." },
      {
        key: "levels",
        type: "level-cards",
        label: "Levels open now",
        hint: "Only advertise levels that are open.",
      },
      {
        key: "steps",
        type: "steps",
        label: "How to enrol",
        hint: "Four steps. Keep each one to a sentence or two.",
      },
      {
        key: "download",
        type: "download-block",
        label: "Download the form",
        hint: "The PDF itself is managed under Settings.",
      },
      {
        key: "fees",
        type: "prose-strip",
        label: "Fees",
        hint: "Fees are not published — parents contact the school. That is a decision, not an omission.",
      },
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "student-life",
    label: "Student Life",
    route: "/student-life",
    sections: [
      { key: "intro", type: PAGE_INTRO, label: INTRO_LABEL, hint: "Life at Kedland in one line." },
      {
        key: "day",
        type: "timeline",
        label: "A day in the life",
        hint: "Confirm the real routine with the school before launch.",
      },
      {
        key: "clubs",
        type: "chips-band",
        label: "Clubs & activities",
        hint: "Confirm the full list with the school.",
      },
      {
        key: "arts",
        type: "trio",
        label: "Arts, music & sport",
        hint: "Three cards celebrating creativity, music and active play.",
      },
      {
        key: "care",
        type: "prose-strip",
        label: "After-school & weekend",
        hint: "Hours are pending from the school.",
      },
      {
        key: "safeguarding",
        type: "prose-band",
        label: "Safeguarding",
        hint: "Wording needs the school's approval before launch.",
      },
      {
        ...INSTAGRAM_SECTION,
        label: "Student life gallery",
        hint: "A CMS-curated mosaic. Images and ordering are managed under Content → Instagram.",
      },
      CTA_BANNER_SECTION,
    ],
  },
  {
    key: "news",
    label: "News",
    route: "/news",
    sections: [
      {
        key: "intro",
        type: "news-intro",
        label: "Intro and empty state",
        hint: "The empty state shows until the first post is published.",
      },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    route: "/contact",
    sections: [
      { key: "intro", type: PAGE_INTRO, label: INTRO_LABEL, hint: "An invitation to get in touch." },
      {
        key: "details",
        type: "contact-details",
        label: "Details, form and map",
        hint: "Phone numbers and address are managed under Settings.",
      },
      INSTAGRAM_SECTION,
    ],
  },
  {
    key: "faqs",
    label: "FAQs",
    route: "/faqs",
    sections: [
      {
        key: "intro",
        type: "faq-intro",
        label: "Intro and closing",
        hint: "The questions themselves are managed under Content → FAQs.",
      },
    ],
  },
  {
    key: "privacy",
    label: "Privacy Notice",
    route: "/privacy",
    sections: [
      {
        key: "notice",
        type: "legal",
        label: "Privacy notice",
        hint: "Needs the client's approval before launch — see the punch list.",
      },
    ],
  },
];

/** Every registered page, by key. */
export const PAGE_REGISTRY: ReadonlyMap<PageKey, PageDefinition> = new Map(
  PAGE_DEFINITIONS.map((page) => [page.key, page]),
);

export function getPage(key: PageKey): PageDefinition | undefined {
  return PAGE_REGISTRY.get(key);
}

export function getSection(page: PageKey, sectionKey: string): SectionDefinition | undefined {
  return getPage(page)?.sections.find((section) => section.key === sectionKey);
}

/**
 * Validates a section's values against its registered schema.
 *
 * This is the only door into `pageSections.data`. The dashboard generates its
 * form from the same registry entry, so the form and the validator cannot
 * disagree — there is no second definition to drift.
 */
export function validateSectionData(
  page: PageKey,
  sectionKey: string,
  data: unknown,
): z.ZodSafeParseResult<unknown> {
  const section = getSection(page, sectionKey);
  if (!section) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          path: [],
          message: `Unknown section "${sectionKey}" on page "${page}"`,
          input: data,
        },
      ]),
    };
  }
  return SECTION_SCHEMAS[section.type].safeParse(data);
}

/** The persisted document shape. `order` mirrors the registry and is seed-only. */
export interface PageSection {
  id: string;
  page: PageKey;
  key: string;
  order: number;
  data: Record<string, unknown>;
  updatedAt: string;
  updatedBy: string | null;
}
