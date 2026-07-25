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
 * Home, complete. The remaining thirteen pages are populated in Phase 3
 * alongside their seed data, using exactly this shape — see agent_plan §8.
 */
const HOME: PageDefinition = {
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
      hint: "Only advertise levels that are open. Primary 1–3 for now.",
    },
    {
      key: "values",
      type: "values-tiles",
      label: "Our values (KEDLAND)",
      hint: "Exactly seven tiles — one per letter of the school's name.",
    },
    {
      key: "principal",
      type: "quote-teaser",
      label: "Principal's welcome",
      hint: "A short pull-quote. The full message lives on the Principal page.",
    },
    {
      key: "instagram",
      type: "instagram",
      label: "Life at Kedland",
      hint: "The tiles themselves are managed under Content → Instagram.",
    },
    {
      key: "cta-banner",
      type: "cta-banner",
      label: "Closing call to action",
      hint: "Sits directly above the footer.",
    },
  ],
} as const;

const PAGES: readonly PageDefinition[] = [HOME];

/** Every registered page, by key. */
export const PAGE_REGISTRY: ReadonlyMap<PageKey, PageDefinition> = new Map(
  PAGES.map((page) => [page.key, page]),
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
