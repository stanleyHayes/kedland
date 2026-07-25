import { describe, expect, it } from "vitest";

import { PAGE_REGISTRY } from "@kedland/types";

import { renderableTypes } from "./resolve";

/**
 * The registry and the resolver, held in step.
 *
 * `RenderSections` skips a section type it has no component for. That is the
 * right behaviour at runtime — one unfinished block should not take a page
 * down — but it makes an omission invisible: the page renders 200 with a hole
 * in it, and nothing anywhere complains. This test is the thing that
 * complains.
 *
 * If it fails, either write the component or delete the registry entry.
 */
describe("every registry section type has a renderer", () => {
  const registered = new Set<string>();
  for (const page of PAGE_REGISTRY.values()) {
    for (const section of page.sections) registered.add(section.type);
  }

  it("covers all of them", () => {
    const renderable = new Set(renderableTypes());
    const missing = [...registered]
      .filter((type) => !renderable.has(type))
      .sort((a, b) => a.localeCompare(b));

    expect(missing).toEqual([]);
  });

  it("has no renderer for a type the registry never uses", () => {
    // A renderer with no registry entry is dead code — it can never be
    // reached, because sections only ever arrive via the registry.
    const orphaned = renderableTypes()
      .filter((type) => !registered.has(type))
      .sort((a, b) => a.localeCompare(b));

    expect(orphaned).toEqual([]);
  });

  it("finds section types at all, so an empty registry cannot pass vacuously", () => {
    expect(registered.size).toBeGreaterThan(15);
  });
});
