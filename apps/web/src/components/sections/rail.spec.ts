import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Every section shares one content rail.
 *
 * Sections used to each choose their own `max-w-*` and centre it. Because a
 * centred 3xl and a centred 6xl have different left edges, a page that stacked
 * both read as content sliding left and right down the screen — visible on
 * /admissions, where three consecutive sections started at three different x
 * positions.
 *
 * The rule: the element that establishes a section's horizontal extent — its
 * rail — is always `max-w-6xl`. Narrower content is constrained *inside* the
 * rail and left-aligned (see `Measure` in `shell.tsx`), which keeps reading
 * measure without moving the edge. Centring a paragraph inside an
 * already-centred banner is a different thing and stays allowed.
 *
 * This scans source rather than rendered output because it is a rule about how
 * sections are written; a rendering test would need every section mounted with
 * valid data to say the same thing.
 */
const RAIL = "max-w-6xl";

function read(file: string): string {
  return readFileSync(join(import.meta.dirname, file), "utf8");
}

/**
 * The class list of each section's rail: the first element inside `<section>`,
 * skipping any self-closing decorations (`<Blob />`, `<Star />`) that sit
 * behind the content.
 */
function railClassLists(source: string): string[] {
  return [
    ...source.matchAll(
      // eslint-disable-next-line sonarjs/super-linear-regex -- bounded, test-only source scan over one component file
      /<section[^>]*>\s*(?:<[A-Z][^>]*\/>\s*)*<div\s+[^>]*?className="([^"]*)"/g,
    ),
  ]
    .map(([, classes]) => classes ?? "")
    .filter((classes) => classes.includes("mx-auto"));
}

describe("one content rail", () => {
  it("shell.tsx defines the rail at the agreed width", () => {
    const rails = railClassLists(read("shell.tsx"));

    expect(rails).toHaveLength(1);
    expect(rails[0]).toContain(RAIL);
  });

  it("every section in blocks.tsx sits on that rail", () => {
    const offRail = railClassLists(read("blocks.tsx")).filter((c) => !c.includes(RAIL));

    expect(offRail).toEqual([]);
  });

  it("finds every section in blocks.tsx, so it cannot pass vacuously", () => {
    const source = read("blocks.tsx");
    const sections = source.match(/<section/g) ?? [];

    // One section per exported component. If a section stops being matched by
    // the rail regex the count drifts and this fails rather than the rule
    // silently going unchecked.
    expect(railClassLists(source)).toHaveLength(sections.length);
  });

  it("blocks-extra.tsx goes through Shell rather than rolling its own section", () => {
    const source = read("blocks-extra.tsx");

    expect(source).toContain("<Shell");
    expect(source).not.toContain("<section");
  });
});
