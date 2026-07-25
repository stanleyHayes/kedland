import { describe, expect, it } from "vitest";

import { contrastRatio, hexToRgb, meetsContrast, relativeLuminance, requiredRatio } from "./contrast";
import { COLOUR_PAIRINGS, COLOURS } from "./tokens";

describe("hexToRgb", () => {
  it("expands three-digit shorthand", () => {
    expect(hexToRgb("#abc")).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc });
  });

  it("parses six-digit hex with or without the hash", () => {
    expect(hexToRgb("#0B4A6D")).toEqual({ r: 11, g: 74, b: 109 });
    expect(hexToRgb("0B4A6D")).toEqual({ r: 11, g: 74, b: 109 });
  });

  it("ignores the alpha channel of an eight-digit hex", () => {
    expect(hexToRgb("#0B4A6D80")).toEqual({ r: 11, g: 74, b: 109 });
  });

  it("rejects anything that is not a hex colour", () => {
    expect(() => hexToRgb("navy")).toThrow(/Not a hex colour/);
    expect(() => hexToRgb("#12345")).toThrow(/Not a hex colour/);
  });
});

describe("relativeLuminance", () => {
  it("anchors at the WCAG reference values", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("gives 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
  });

  it("gives 1:1 for a colour against itself", () => {
    expect(contrastRatio(COLOURS.navy, COLOURS.navy)).toBeCloseTo(1, 5);
  });

  it("is order-independent", () => {
    expect(contrastRatio(COLOURS.ink, COLOURS.cream)).toBeCloseTo(
      contrastRatio(COLOURS.cream, COLOURS.ink),
      10,
    );
  });
});

describe("requiredRatio", () => {
  it("uses the WCAG thresholds", () => {
    expect(requiredRatio("AA", false)).toBe(4.5);
    expect(requiredRatio("AA", true)).toBe(3);
    expect(requiredRatio("AAA", false)).toBe(7);
    expect(requiredRatio("AAA", true)).toBe(4.5);
  });
});

/**
 * The accessibility gate. Build package §2.3 requires ≥4.5:1 for body text and
 * ≥3:1 for large text — this asserts it for every pairing the design uses, so a
 * palette tweak cannot quietly push a page below AA.
 */
describe("brand palette meets WCAG 2.1 AA", () => {
  it.each(COLOUR_PAIRINGS)("$name", ({ fg, bg, large = false }) => {
    const ratio = contrastRatio(COLOURS[fg], COLOURS[bg]);
    const required = requiredRatio("AA", large);

    expect(
      ratio,
      `${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${required.toString()}:1`,
    ).toBeGreaterThanOrEqual(required);
  });
});

/**
 * The combinations the build package bans outright (§2.3). These are not in
 * COLOUR_PAIRINGS, and this test documents *why* — so that anyone tempted to
 * add them can see the numbers first.
 */
describe("banned colour combinations", () => {
  it("white text on yellow fails AA", () => {
    expect(meetsContrast(COLOURS.white, COLOURS.yellow)).toBe(false);
  });

  it("yellow text on yellow fails AA", () => {
    expect(meetsContrast(COLOURS.yellow, COLOURS.yellow)).toBe(false);
  });

  it("white text on sky fails AA", () => {
    expect(meetsContrast(COLOURS.white, COLOURS.sky)).toBe(false);
  });

  it("muted grey text on a sky tint fails AA", () => {
    // 3.07:1 — muted text belongs on cream or white only.
    expect(meetsContrast(COLOURS.grey, COLOURS.sky)).toBe(false);
  });

  it("the build package's original --grey would have failed on cream", () => {
    // Documents why COLOURS.grey deviates from the supplied #6B7A88.
    // If someone reverts the token, the pairing test above turns red; this
    // test explains what they will be looking at.
    expect(meetsContrast("#6B7A88", COLOURS.cream)).toBe(false);
    expect(meetsContrast(COLOURS.grey, COLOURS.cream)).toBe(true);
  });
});

/**
 * Regression: the build package colours `.eyebrow` with `--red` on `--cream`,
 * which measures 4.36:1. Playwright's axe run caught it in a real browser;
 * jsdom could not, because axe's contrast rule needs canvas. `--red-text`
 * exists to fix it without changing the CTA red the school approved.
 */
describe("red is split between backgrounds and text", () => {
  it("the brand red fails AA as normal-size text on cream", () => {
    expect(meetsContrast(COLOURS.red, COLOURS.cream)).toBe(false);
  });

  it("the text variant passes on both light surfaces", () => {
    expect(meetsContrast(COLOURS.redText, COLOURS.cream)).toBe(true);
    expect(meetsContrast(COLOURS.redText, COLOURS.white)).toBe(true);
  });

  it("the brand red is still fine behind white CTA text", () => {
    expect(meetsContrast(COLOURS.white, COLOURS.red, { large: true })).toBe(true);
  });
});
