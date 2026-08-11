import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { canRender, RenderSections, renderableTypes } from "./resolve";
import { assertFixturesValid, SECTION_FIXTURES } from "./section-fixtures";

import type { Section } from "@/lib/api";

vi.mock("@/lib/admission-form", () => ({
  ADMISSION_FORM_PATH: "/assets/forms/kedland-admission-form.pdf",
  admissionFormExists: () => true,
}));

/**
 * Every section type, rendered through the resolver.
 *
 * The per-component specs check that each block says the right things. This
 * checks the thing they cannot: that the resolver actually reaches every
 * component, with the shape the CMS really serves.
 *
 * It matters because `RenderSections` deliberately skips a type it has no
 * renderer for, and `resolve.tsx` casts `data` through `unknown`. Between
 * those two, a section can go missing or render blank on a live page without
 * anything failing. Rendering all of them from real seeded data is what makes
 * that loud.
 */

beforeAll(() => {
  // If the school's copy has drifted from the schemas, say so here rather
  // than letting every assertion below fail for an unrelated-looking reason.
  assertFixturesValid();
});

function asSection(fixture: (typeof SECTION_FIXTURES)[number]): Section {
  return { key: fixture.key, type: fixture.type, order: 0, data: fixture.data };
}

describe("RenderSections", () => {
  it("has a fixture for every type it can render", () => {
    const covered = new Set(SECTION_FIXTURES.map((fixture) => fixture.type));
    const missing = renderableTypes()
      .filter((type) => !covered.has(type))
      .sort((a, b) => a.localeCompare(b));

    expect(missing).toEqual([]);
  });

  it.each(SECTION_FIXTURES.map((fixture) => [fixture.type, fixture] as const))(
    "renders %s",
    (_type, fixture) => {
      const { container } = render(<RenderSections sections={[asSection(fixture)]} />);

      // Something real, not an empty wrapper — a component reading the wrong
      // field names would still mount but render nothing.
      expect(container.textContent.trim().length).toBeGreaterThan(0);
    },
  );

  it("renders a whole page's worth in the order given", () => {
    const [first, second] = SECTION_FIXTURES;
    if (!first || !second) throw new Error("Expected at least two fixtures");

    const { container } = render(<RenderSections sections={[asSection(first), asSection(second)]} />);

    expect(container.children).toHaveLength(2);
  });

  /**
   * The deliberate behaviour: an unfinished block leaves a hole rather than
   * taking the page down. `sections-covered.spec.ts` is what stops that hole
   * ever existing in practice.
   */
  it("skips a type it does not know rather than throwing", () => {
    const { container } = render(
      <RenderSections sections={[{ key: "mystery", type: "not-a-real-section", order: 0, data: {} }]} />,
    );

    expect(container.textContent).toBe("");
  });

  it("renders nothing at all for an empty page", () => {
    const { container } = render(<RenderSections sections={[]} />);
    expect(container.textContent).toBe("");
  });

  /**
   * `beforeLast` carries page-family content the CMS knows nothing about — the
   * FAQ directory on /faqs, which is to say the entire point of that page.
   *
   * It went missing in production and nothing failed: the FAQs page had been
   * left with a single section, that section was both first and last, and the
   * first-section branch returned before the `beforeLast` branch was reached.
   * The page rendered its heading and its footer and simply had no FAQs in it.
   */
  describe("beforeLast", () => {
    const MARKER = "The FAQ directory";

    it("places it before the last of several sections", () => {
      const [first, second] = SECTION_FIXTURES;
      if (!first || !second) throw new Error("Expected at least two fixtures");

      const { container } = render(
        <RenderSections sections={[asSection(first), asSection(second)]} beforeLast={<p>{MARKER}</p>} />,
      );

      expect(container.textContent).toContain(MARKER);
    });

    /** The regression. A one-section page must still get its directory. */
    it("still renders it when the page has only one section", () => {
      const [only] = SECTION_FIXTURES;
      if (!only) throw new Error("Expected at least one fixture");

      const { container } = render(
        <RenderSections sections={[asSection(only)]} beforeLast={<p>{MARKER}</p>} />,
      );

      expect(container.textContent).toContain(MARKER);
    });

    it("renders it exactly once, however many sections there are", () => {
      const sections = SECTION_FIXTURES.slice(0, 3).map(asSection);
      const { container } = render(<RenderSections sections={sections} beforeLast={<p>{MARKER}</p>} />);

      expect(container.textContent.split(MARKER)).toHaveLength(2);
    });

    it("is absent when nothing was passed", () => {
      const [only] = SECTION_FIXTURES;
      if (!only) throw new Error("Expected at least one fixture");

      const { container } = render(<RenderSections sections={[asSection(only)]} />);

      expect(container.textContent).not.toContain(MARKER);
    });
  });
});

describe("canRender", () => {
  it("is true for a type with a component", () => {
    expect(canRender("hero")).toBe(true);
  });

  it("is false for one without", () => {
    expect(canRender("not-a-real-section")).toBe(false);
  });
});
