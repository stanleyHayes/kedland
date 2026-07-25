import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { COLOURS, RADII, TYPE_SCALE, type ColourToken } from "./tokens";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "styles", "tokens.css");
const css = readFileSync(cssPath, "utf8");

function cssVar(name: string): string | undefined {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
  return match?.[1]?.trim();
}

/** `--color-navy-deep` from `navyDeep`. */
function toCssName(token: string): string {
  const kebab = token.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
  return `--color-${kebab}`;
}

/**
 * TypeScript and CSS both hold the palette — TS for logic and tests, CSS for
 * Tailwind and runtime. Two copies of a fact is one copy too many unless
 * something checks they agree, so this is that something.
 */
describe("token parity between tokens.ts and tokens.css", () => {
  it.each(Object.keys(COLOURS) as ColourToken[])("--color for %s matches", (token) => {
    const fromCss = cssVar(toCssName(token));
    expect(fromCss, `${toCssName(token)} missing from tokens.css`).toBeDefined();
    expect(fromCss?.toLowerCase()).toBe(COLOURS[token].toLowerCase());
  });

  it.each(Object.keys(RADII))("--radius-%s matches", (key) => {
    expect(cssVar(`--radius-${key}`)).toBe(RADII[key as keyof typeof RADII]);
  });

  it.each(Object.keys(TYPE_SCALE))("--text-%s matches", (key) => {
    expect(cssVar(`--text-${key}`)).toBe(TYPE_SCALE[key as keyof typeof TYPE_SCALE]);
  });
});

describe("design-system invariants", () => {
  it("keeps every radius rounded — build package §2.5 bans sharp corners", () => {
    for (const value of Object.values(RADII)) {
      expect(Number.parseInt(value, 10)).toBeGreaterThan(0);
    }
  });

  it("honours prefers-reduced-motion", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it("stops the skeleton shimmer under reduced motion", () => {
    const block = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)\}/.exec(css)?.[1] ?? "";
    expect(block).toMatch(/\.kedland-skeleton\s*\{\s*animation:\s*none/);
  });
});
