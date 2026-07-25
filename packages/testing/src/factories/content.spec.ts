import { describe, expect, it } from "vitest";

import { validateSectionData } from "@kedland/types";

import { buildHero, buildIconCards, buildValuesTiles } from "./content";

/**
 * The contract test (agent_plan §7.4).
 *
 * Fixtures are only useful if they are indistinguishable from real data. If a
 * section schema gains a field and a factory does not, every test using that
 * factory keeps passing against a shape production would reject — the exact
 * failure this suite exists to prevent.
 */
describe("content factories satisfy the section registry", () => {
  it("buildHero produces a valid hero section", () => {
    const result = validateSectionData("home", "hero", buildHero());
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it("buildValuesTiles produces a valid values section", () => {
    const result = validateSectionData("home", "values", buildValuesTiles());
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it("buildIconCards produces a valid why-cards section", () => {
    const result = validateSectionData("home", "why-cards", buildIconCards());
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it("spells KEDLAND across the seven value tiles", () => {
    expect(
      buildValuesTiles()
        .tiles.map((t) => t.letter)
        .join(""),
    ).toBe("KEDLAND");
  });

  it("lets a test override exactly one field and stay valid", () => {
    const hero = buildHero({ heading: "A different heading" });
    expect(hero.heading).toBe("A different heading");
    expect(validateSectionData("home", "hero", hero).success).toBe(true);
  });

  it("still fails validation when an override breaks the schema", () => {
    const hero = buildHero({ trustChips: ["only", "two"] });
    expect(validateSectionData("home", "hero", hero).success).toBe(false);
  });
});
