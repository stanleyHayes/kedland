import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon, ICON_NAMES, Watermark } from "./icon";

/**
 * The icon set.
 *
 * Names come from the CMS, so the two rules that matter are: every name the
 * school's content actually uses must draw something recognisable, and a name
 * nobody anticipated must never break a page.
 */
describe("Icon", () => {
  it.each(ICON_NAMES)("draws %s", (name) => {
    const { container } = render(<Icon name={name} />);
    const path = container.querySelector("path");

    expect(path).not.toBeNull();
    expect(path?.getAttribute("d")).toBeTruthy();
  });

  /**
   * Every icon name that appears in the school's seeded content. If an editor
   * or a seed adds one this set does not draw, it silently becomes a star —
   * which is a fine fallback and a poor surprise, so it is pinned here.
   */
  it.each([
    "baby",
    "blocks",
    "book",
    "calculator",
    "globe",
    "heart",
    "monitor",
    "moon",
    "music",
    "palette",
    "shield",
    "sparkle",
    "star",
    "sun",
    "utensils",
  ])("has a real glyph for %s, which the seeded content uses", (name) => {
    expect(ICON_NAMES).toContain(name);
  });

  it("falls back to the star rather than rendering nothing", () => {
    // The name comes from the CMS. A typo must not leave a hole in a card, and
    // must certainly not throw.
    const { container: unknown } = render(<Icon name="not-a-real-icon" />);
    const { container: star } = render(<Icon name="star" />);

    expect(unknown.querySelector("path")?.getAttribute("d")).toBe(
      star.querySelector("path")?.getAttribute("d"),
    );
  });

  it("is hidden from screen readers by default", () => {
    // Icons sit beside the words they illustrate; announcing them repeats it.
    const { container } = render(<Icon name="music" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("is announced when given a title, and not hidden", () => {
    render(<Icon name="phone" title="Telephone" />);
    const svg = screen.getByRole("img", { name: "Telephone" });

    expect(svg).not.toHaveAttribute("aria-hidden");
  });
});

describe("Watermark", () => {
  it("is faint enough to stay behind the words", () => {
    // It is texture, not content. At a heavier opacity it would compete with
    // the text sitting over it.
    // `svg.className` is an SVGAnimatedString, not a string — reading the
    // attribute is the only thing that works here.
    const { container } = render(<Watermark name="music" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("opacity-[0.06]");
  });

  it("never takes a pointer event or a screen reader's attention", () => {
    const { container } = render(<Watermark name="music" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg?.getAttribute("class")).toContain("pointer-events-none");
  });
});
