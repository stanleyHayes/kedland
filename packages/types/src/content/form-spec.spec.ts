import { describe, expect, it } from "vitest";

import { fieldCopy, humaniseFieldName } from "./form-copy";
import { emptyValueFor, flattenFields, toFormSpec, type FormField } from "./form-spec";
import { SECTION_SCHEMAS, type SectionType } from "./sections";

const SECTION_TYPES = Object.keys(SECTION_SCHEMAS) as SectionType[];

/**
 * The form derivation, and the two things that make it trustworthy.
 *
 * This file reaches into Zod's internals in exactly one place — `form-spec.ts` —
 * because `def.type`, `def.checks` and friends are documented but not guaranteed
 * across majors. These tests are the tripwire for that: a Zod upgrade that
 * changes the shape fails here loudly instead of quietly rendering 24 sections as
 * a wall of single-line inputs with no maximum lengths.
 *
 * The second thing is the copy. A schema can tell you a field is a string with a
 * 90-character cap; it cannot tell you to call it "Opening paragraph" rather than
 * "subheading". Every field is checked for real human copy, so a new field cannot
 * ship with a camelCase label in front of the school office.
 */

describe("every section derives a form", () => {
  it("covers all 24 section types", () => {
    expect(SECTION_TYPES).toHaveLength(24);
  });

  it.each(SECTION_TYPES)("%s produces fields", (type) => {
    expect(toFormSpec(type).length).toBeGreaterThan(0);
  });

  /**
   * The tripwire. Every leaf must land on a control the renderer knows; a Zod
   * change that made `def.type` unreadable would show up as everything falling
   * through to plain text.
   */
  it("assigns a known control to every field", () => {
    const known = new Set([
      "text",
      "multiline",
      "eyebrow",
      "path",
      "icon",
      "number",
      "cta",
      "image",
      "group",
      "textList",
      "groupList",
    ]);

    for (const type of SECTION_TYPES) {
      for (const field of flattenFields(toFormSpec(type))) {
        expect(known, `${type}.${field.path}`).toContain(field.kind);
      }
    }
  });

  it("never falls back to a humanised label", () => {
    const missing: string[] = [];

    for (const type of SECTION_TYPES) {
      for (const field of flattenFields(toFormSpec(type))) {
        // The item of a text list borrows its parent's label, so it is not a
        // field anyone has to name separately.
        if (field.path.endsWith("[]")) continue;
        if (fieldCopy(type, field.path).fromFallback) missing.push(`${type}.${field.path}`);
      }
    }

    // Each entry needs a line in `form-copy.ts`. Left as the full list rather
    // than a count so the failure tells you exactly what to write.
    expect(missing).toEqual([]);
  });

  it("gives every field a non-empty label", () => {
    for (const type of SECTION_TYPES) {
      for (const field of flattenFields(toFormSpec(type))) {
        expect(field.label.length, `${type}.${field.path}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("text fields", () => {
  const find = (type: SectionType, path: string): FormField => {
    const field = flattenFields(toFormSpec(type)).find((f) => f.path === path);
    if (!field) throw new Error(`no field at ${type}.${path}`);
    return field;
  };

  it("makes a heading a single-line input and carries its maximum", () => {
    const heading = find("hero", "heading");

    expect(heading.kind).toBe("text");
    expect(heading).toMatchObject({ maxLength: 90 });
  });

  /** A 320-character paragraph in a one-line input is unusable. */
  it("makes prose a textarea", () => {
    expect(find("hero", "subheading").kind).toBe("multiline");
    expect(find("legal", "body")).toMatchObject({ kind: "multiline", maxLength: 6000 });
  });

  it("recognises an eyebrow as its own control", () => {
    expect(find("hero", "eyebrow").kind).toBe("eyebrow");
  });

  it("recognises an icon field, so it can offer the registered set", () => {
    expect(find("icon-cards", "cards[].icon").kind).toBe("icon");
  });

  it("recognises an internal path, and keeps the pattern for the input", () => {
    const href = find("hero", "primaryCta.href");

    expect(href.kind).toBe("path");
    expect(href).toHaveProperty("pattern");
  });

  it("keeps a bespoke pattern, such as the Instagram handle", () => {
    expect(find("instagram", "handle")).toHaveProperty("pattern", "^@[A-Za-z0-9._]{1,30}$");
  });
});

describe("composites", () => {
  it("renders a button as one unit with its label and target", () => {
    const cta = toFormSpec("hero").find((f) => f.path === "primaryCta");

    expect(cta?.kind).toBe("cta");
    expect(cta && "fields" in cta ? cta.fields.map((f) => f.path) : []).toEqual([
      "primaryCta.label",
      "primaryCta.href",
    ]);
  });

  it("renders an image as one unit with its description", () => {
    const image = toFormSpec("hero").find((f) => f.path === "image");

    expect(image?.kind).toBe("image");
    expect(image && "fields" in image ? image.fields.map((f) => f.path) : []).toEqual([
      "image.mediaId",
      "image.alt",
    ]);
  });

  /** Alt text is required by the schema; the form must not present it as optional. */
  it("keeps alt text required", () => {
    const alt = flattenFields(toFormSpec("hero")).find((f) => f.path === "image.alt");

    expect(alt?.required).toBe(true);
  });

  it("marks an optional image optional", () => {
    // `page-intro.image` is optional so documents written before the visual
    // upgrade stay valid.
    const image = toFormSpec("page-intro").find((f) => f.path === "image");

    expect(image?.required).toBe(false);
  });
});

describe("lists", () => {
  it("reports a fixed length, so the form offers no add or remove", () => {
    const chips = toFormSpec("hero").find((f) => f.path === "trustChips");

    // Four, because they sit in one row.
    expect(chips).toMatchObject({ kind: "textList", fixed: 4, min: 4, max: 4 });
  });

  it("reports a range, so the form knows when to allow another", () => {
    const items = toFormSpec("feature-grid").find((f) => f.path === "items");

    expect(items).toMatchObject({ kind: "groupList", min: 3, max: 12 });
    expect(items).not.toHaveProperty("fixed");
  });

  it("describes the fields inside a repeated group", () => {
    const cards = toFormSpec("icon-cards").find((f) => f.path === "cards");

    expect(cards && "fields" in cards ? cards.fields.map((f) => f.path) : []).toEqual([
      "cards[].icon",
      "cards[].title",
      "cards[].body",
    ]);
  });

  it("keeps the seven KEDLAND tiles fixed at seven", () => {
    expect(toFormSpec("values-tiles").find((f) => f.path === "tiles")).toMatchObject({ fixed: 7 });
  });

  it("keeps the seven EYFS areas fixed at seven", () => {
    expect(toFormSpec("eyfs-areas").find((f) => f.path === "areas")).toMatchObject({ fixed: 7 });
  });

  it("handles a number inside a repeated group", () => {
    const number = flattenFields(toFormSpec("eyfs-areas")).find((f) => f.path === "areas[].number");

    expect(number).toMatchObject({ kind: "number", min: 1, max: 7 });
  });
});

describe("emptyValueFor", () => {
  /**
   * A blank form has to satisfy its own schema's *shape*, or an editor opening a
   * section that has never been filled in gets validation errors before typing.
   */
  it("starts a fixed list at its full length", () => {
    const value = emptyValueFor(toFormSpec("hero"));

    expect(value["trustChips"]).toEqual(["", "", "", ""]);
  });

  it("starts a ranged list at its minimum", () => {
    const value = emptyValueFor(toFormSpec("feature-grid"));

    expect(value["items"]).toHaveLength(3);
  });

  it("builds nested objects rather than leaving them undefined", () => {
    const value = emptyValueFor(toFormSpec("hero"));

    // `href` seeds to "/" because an empty string fails its pattern — see the
    // note on `blank` in fields.ts.
    expect(value["primaryCta"]).toEqual({ label: "", href: "/" });
    expect(value["image"]).toEqual({ mediaId: "", alt: "" });
  });

  it("produces the right keys for every section", () => {
    for (const type of SECTION_TYPES) {
      const value = emptyValueFor(toFormSpec(type));
      const expected = toFormSpec(type).map((f) => f.path);

      expect(
        Object.keys(value).sort((a, b) => a.localeCompare(b)),
        type,
      ).toEqual([...expected].sort((a, b) => a.localeCompare(b)));
    }
  });

  /**
   * It cannot *pass* validation — the fields are empty and every string requires
   * at least one character — but it must fail only on emptiness, never on a
   * missing or wrongly-typed key. Those are the errors an editor cannot fix.
   */
  it("fails validation only on empty strings, never on shape", () => {
    for (const type of SECTION_TYPES) {
      const result = SECTION_SCHEMAS[type].safeParse(emptyValueFor(toFormSpec(type)));
      if (result.success) continue;

      for (const issue of result.error.issues) {
        expect(issue.code, `${type} → ${issue.path.join(".")}: ${issue.message}`).toBe("too_small");
      }
    }
  });
});

describe("humaniseFieldName", () => {
  it.each([
    ["heading", "Heading"],
    ["emptyStateHeading", "Empty state heading"],
    ["mottoBody", "Motto body"],
    ["last-updated", "Last updated"],
  ])("turns %p into %p", (input, expected) => {
    expect(humaniseFieldName(input)).toBe(expected);
  });
});
