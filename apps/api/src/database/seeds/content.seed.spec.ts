import { getPage, getSection, PAGE_REGISTRY, validateSectionData, type PageKey } from "@kedland/types";

import { CONTENT_SEED } from "./content.seed";

/**
 * The contract between the school's copy and the schemas that hold it.
 *
 * This is the test that matters most in Phase 3. Every word below comes from
 * build package §4 and is approved; if a schema and the copy ever disagree,
 * that has to fail here rather than on a page a parent is reading.
 */
describe("content seed", () => {
  const entries = Object.entries(CONTENT_SEED) as [PageKey, Record<string, unknown>][];

  it("seeds only pages the registry knows about", () => {
    const unknown = entries.map(([page]) => page).filter((page) => !PAGE_REGISTRY.has(page));
    expect(unknown).toEqual([]);
  });

  it("seeds only sections the page actually has", () => {
    const unknown: string[] = [];
    for (const [page, sections] of entries) {
      for (const key of Object.keys(sections)) {
        if (!getSection(page, key)) unknown.push(`${page} → ${key}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("validates every section against its registered schema", () => {
    const failures: string[] = [];

    for (const [page, sections] of entries) {
      for (const [key, data] of Object.entries(sections)) {
        const result = validateSectionData(page, key, data);
        if (!result.success) {
          const problems = result.error.issues
            .map((issue) => `${issue.path.join(".")} ${issue.message}`)
            .join("; ");
          failures.push(`${page} → ${key}: ${problems}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it("fills every section of every page it seeds", () => {
    // A half-seeded page renders with holes in it, which is worse than an
    // obviously unfinished one.
    const missing: string[] = [];

    for (const [page, sections] of entries) {
      for (const definition of getPage(page)?.sections ?? []) {
        if (!(definition.key in sections)) missing.push(`${page} → ${definition.key}`);
      }
    }

    expect(missing).toEqual([]);
  });

  it("covers every registered page", () => {
    const seeded = new Set(entries.map(([page]) => page));
    const unseeded = [...PAGE_REGISTRY.keys()].filter((page) => !seeded.has(page));

    expect(unseeded).toEqual([]);
  });

  it("keeps the school's own words", () => {
    // Spot-checks against build package §4. These strings are approved copy;
    // a failure here means someone paraphrased something they should not have.
    const home = CONTENT_SEED.home as Record<string, Record<string, unknown>>;
    expect(home["hero"]?.["heading"]).toBe("Where little Stars learn, play, and shine.");
    expect(home["hero"]?.["eyebrow"]).toBe("THE FUTURE BEGINS HERE");

    const values = CONTENT_SEED["about/mission-vision-values"] as Record<string, Record<string, unknown>>;
    const motto = values["mission-vision"]?.["motto"];
    expect(motto).toBe("In God We Trust.");
  });

  it("spells KEDLAND across the value tiles on both pages that show them", () => {
    const spelled = (["home", "about/mission-vision-values"] as const).map((page) => {
      const sections = CONTENT_SEED[page] as Record<string, Record<string, unknown>>;
      const tiles = sections["values"]?.["tiles"] as { letter: string }[];
      return `${page}: ${tiles.map((t) => t.letter).join("")}`;
    });

    expect(spelled).toEqual(["home: KEDLAND", "about/mission-vision-values: KEDLAND"]);
  });

  it("advertises no level beyond Primary 3", () => {
    // Build package §4.3b: the school offers Primary 1–3 today. Listing more
    // would be advertising something that does not exist.
    const text = JSON.stringify(CONTENT_SEED);
    expect(text).not.toMatch(/Primary [4-9]/);
  });

  it("names all seven EYFS areas", () => {
    const early = CONTENT_SEED["academics/early-years"] as Record<string, Record<string, unknown>>;
    const areas = early["eyfs"]?.["areas"] as { number: number }[];

    expect(areas.map((a) => a.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
