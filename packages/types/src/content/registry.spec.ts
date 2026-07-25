import { describe, expect, it } from "vitest";

import { getPage, getSection, PAGE_KEYS, PAGE_REGISTRY, validateSectionData } from "./registry";
import { SECTION_SCHEMAS } from "./sections";

/**
 * These tests guard the guardrail. If the registry stops being the single
 * source of structure, the CMS stops being safe — so the invariants are
 * asserted, not assumed.
 */
describe("page registry", () => {
  it("registers every page under a key from PAGE_KEYS", () => {
    for (const [key, page] of PAGE_REGISTRY) {
      expect(PAGE_KEYS).toContain(key);
      expect(page.key).toBe(key);
    }
  });

  it("gives every section a schema that actually exists", () => {
    for (const page of PAGE_REGISTRY.values()) {
      for (const section of page.sections) {
        expect(SECTION_SCHEMAS[section.type]).toBeDefined();
      }
    }
  });

  it("keeps section keys unique within a page", () => {
    for (const page of PAGE_REGISTRY.values()) {
      const keys = page.sections.map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("gives every section a label and a hint for the dashboard form", () => {
    for (const page of PAGE_REGISTRY.values()) {
      for (const section of page.sections) {
        expect(section.label.length).toBeGreaterThan(0);
        expect(section.hint.length).toBeGreaterThan(0);
      }
    }
  });

  it("resolves a known page and section", () => {
    expect(getPage("home")?.route).toBe("/");
    expect(getSection("home", "hero")?.type).toBe("hero");
  });

  it("returns undefined for a section that is not registered", () => {
    expect(getSection("home", "not-a-section")).toBeUndefined();
  });
});

describe("validateSectionData", () => {
  const validHero = {
    eyebrow: "THE FUTURE BEGINS HERE",
    heading: "Where little Stars learn, play, and shine.",
    subheading:
      "A warm, British-curriculum school in Lashibi-Tema for Daycare through Primary 3 — nurturing curious minds, kind hearts, and big dreams.",
    primaryCta: { label: "Enrol Now", href: "/admissions" },
    secondaryCta: { label: "Book a Tour", href: "/contact" },
    image: { mediaId: "hero-001", alt: "Kedland pupils painting together" },
    trustChips: [
      "British National Curriculum",
      "Cambridge Primary",
      "Daycare–Primary 3",
      "After-School & Weekend Care",
    ],
  };

  it("accepts values that match the section schema", () => {
    expect(validateSectionData("home", "hero", validHero).success).toBe(true);
  });

  it("rejects an unregistered section rather than storing it", () => {
    const result = validateSectionData("home", "surprise-section", validHero);
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields so a typo cannot silently become dead data", () => {
    const result = validateSectionData("home", "hero", { ...validHero, headline: "oops" });
    expect(result.success).toBe(false);
  });

  it("rejects an external href on a call to action", () => {
    const result = validateSectionData("home", "hero", {
      ...validHero,
      primaryCta: { label: "Enrol Now", href: "https://example.com/phish" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an image with no alt text", () => {
    const result = validateSectionData("home", "hero", {
      ...validHero,
      image: { mediaId: "hero-001", alt: "" },
    });
    expect(result.success).toBe(false);
  });

  it("holds the trust chips to exactly four so the row cannot wrap", () => {
    const result = validateSectionData("home", "hero", {
      ...validHero,
      trustChips: ["one", "two", "three"],
    });
    expect(result.success).toBe(false);
  });

  it("holds the KEDLAND tiles to exactly seven", () => {
    const tile = { letter: "K", name: "Kindness", body: "We treat others with compassion." };
    const result = validateSectionData("home", "values", {
      heading: "Our name is our promise",
      tiles: Array.from({ length: 6 }, () => tile),
      cta: { label: "Meet our values", href: "/about/mission-vision-values" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly seven KEDLAND tiles", () => {
    const letters = ["K", "E", "D", "L", "A", "N", "D"];
    const result = validateSectionData("home", "values", {
      heading: "Our name is our promise",
      tiles: letters.map((letter) => ({ letter, name: "Value", body: "A short description." })),
      cta: { label: "Meet our values", href: "/about/mission-vision-values" },
    });
    expect(result.success).toBe(true);
  });
});
