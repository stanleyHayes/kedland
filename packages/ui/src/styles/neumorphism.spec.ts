import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The neumorphic recipes, and the fact that there is only one copy of them.
 *
 * This file exists because of a real defect, not a hypothetical one. The
 * recipes were maintained as two copies — one in each app's `globals.css` — and
 * they had already drifted: the dashboard's copy was missing `neu-surface`,
 * `neu-interactive` and the reduced-motion guard entirely. The moment the
 * shared `Card` component started using `neu-surface`, every panel in the back
 * office would have rendered with no background, no border and no shadow.
 *
 * Neumorphism depends on every raised element agreeing about where the light
 * comes from. Two files cannot hold that agreement, so these assertions are
 * about singularity as much as about correctness.
 */

const HERE = import.meta.dirname;

function read(path: string): string {
  return readFileSync(join(HERE, path), "utf8");
}

const SHARED = read("neumorphism.css");

/** Every recipe a component or page is entitled to rely on. */
const RECIPES = [
  "neu-surface",
  "neu-surface-on-navy",
  "neu-surface-dark",
  "neu-tile",
  "neu-tile-dark",
  "neu-inset-panel",
  "neu-colour-badge",
  "neu-interactive",
  "neu-icon",
  "neu-icon-pressed",
  "neu-icon-warm",
  "neu-inset-divider",
  "neu-button",
  "neu-button-primary",
  "neu-button-secondary",
  "neu-button-tertiary",
  "neu-button-outline",
];

describe("the shared neumorphism stylesheet", () => {
  it.each(RECIPES)("defines .%s", (recipe) => {
    expect(SHARED).toContain(`.${recipe} {`);
  });

  /**
   * The lift is the only moving part. Shadows may stay — a static shadow is
   * not motion — but nothing should shift under a visitor who asked it not to.
   */
  it("clears the lift under reduced motion", () => {
    const guard = SHARED.slice(SHARED.indexOf("prefers-reduced-motion"));

    expect(guard).toContain(".neu-interactive");
    expect(guard).toContain("transform: none");
  });

  it("uses brand tokens rather than pasted colour literals for its fills", () => {
    // The shadows are deliberately raw rgb() — a cast shadow is not a brand
    // colour and has no token. Backgrounds and borders are a different matter.
    const fills = SHARED.split("\n").filter(
      (line) => line.includes("background:") || line.includes("border:"),
    );

    for (const line of fills) {
      expect(line).not.toMatch(/#[0-9a-f]{3,6}/i);
    }
  });
});

describe("neither app keeps its own copy", () => {
  const apps = {
    web: read("../../../../apps/web/src/styles/globals.css"),
    admin: read("../../../../apps/admin/src/styles/globals.css"),
  };

  it.each(Object.entries(apps))("%s imports the shared recipes", (_name, css) => {
    expect(css).toContain('@import "@kedland/ui/styles/neumorphism.css"');
  });

  /**
   * The regression itself. A second definition of any shared recipe in an app
   * stylesheet is how the two drifted the first time.
   */
  it.each(Object.entries(apps))("%s redefines none of them", (_name, css) => {
    const redefined = RECIPES.filter((recipe) => css.includes(`.${recipe} {`));

    expect(redefined).toEqual([]);
  });
});
