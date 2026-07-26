import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ArrowChip, Button, buttonClasses } from "./button";
import { Card, Chip } from "./card";
import { Blob, Confetti, Squiggle, Star } from "./spot-art";
import { WaveDivider } from "./wave-divider";

describe("buttonClasses", () => {
  it("is a pill with the display face — build package §2.5", () => {
    const classes = buttonClasses();
    expect(classes).toContain("rounded-pill");
    expect(classes).toContain("font-display");
  });

  it("clears the 48px minimum tap target at every size", () => {
    // Parents fill this in on a phone; a 32px button is a mis-tap waiting to happen.
    expect(buttonClasses({ size: "sm" })).toContain("min-h-12");
    expect(buttonClasses({ size: "md" })).toContain("min-h-12");
    expect(buttonClasses({ size: "lg" })).toContain("min-h-14");
  });

  it("gives the primary CTA the brand gradient", () => {
    expect(buttonClasses({ variant: "primary" })).toContain("from-red");
  });

  it("switches off the hover scale under reduced motion", () => {
    expect(buttonClasses()).toContain("motion-reduce:transform-none");
  });

  it("appends caller classes last so they can win", () => {
    expect(buttonClasses({ className: "w-full" }).endsWith("w-full")).toBe(true);
  });
});

describe("Button", () => {
  it("defaults to type=button so it cannot submit a form by accident", () => {
    render(<Button>Enrol Now</Button>);
    expect(screen.getByRole("button", { name: "Enrol Now" })).toHaveAttribute("type", "button");
  });

  it("can be a submit button when asked", () => {
    render(<Button type="submit">Send my enquiry</Button>);
    expect(screen.getByRole("button", { name: /send my enquiry/i })).toHaveAttribute("type", "submit");
  });

  it("calls its handler", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Book a Tour</Button>);

    await userEvent.click(screen.getByRole("button", { name: /book a tour/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the arrow chip out of the accessible name", () => {
    render(<Button withArrow>Enrol Now</Button>);
    // The label already says where it goes; "arrow" would be noise.
    expect(screen.getByRole("button", { name: "Enrol Now" })).toBeInTheDocument();
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Enrol Now
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: /enrol now/i }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("ArrowChip", () => {
  it("is decorative", () => {
    const { container } = render(<ArrowChip />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Card", () => {
  it("renders its children on the rounded white surface", () => {
    render(<Card>Our levels</Card>);
    expect(screen.getByText("Our levels")).toBeInTheDocument();
  });

  it("adds a coloured top strip when given an accent", () => {
    const { container } = render(<Card accent="red">x</Card>);
    expect(container.firstElementChild?.className).toContain("before:bg-red");
  });

  it("lifts only when interactive", () => {
    const { container: still } = render(<Card>x</Card>);
    expect(still.firstElementChild?.className).not.toContain("neu-interactive");

    const { container: lifts } = render(<Card interactive>x</Card>);
    expect(lifts.firstElementChild?.className).toContain("neu-interactive");
  });

  /**
   * Every card is a neumorphic surface, and that recipe is shared.
   *
   * It used to be `bg-white shadow-card` here plus a duplicated copy of the
   * recipes in each app's stylesheet — which had already drifted far enough
   * that the dashboard was missing `neu-surface` altogether. `neumorphism.spec`
   * checks the recipe itself; this only checks the card asks for it.
   */
  it("is a neumorphic surface, not a flat white box", () => {
    const { container } = render(<Card>x</Card>);
    const className = container.firstElementChild?.className ?? "";

    expect(className).toContain("neu-surface");
    expect(className).not.toContain("shadow-card");
  });
});

describe("Chip", () => {
  it("renders its label", () => {
    render(<Chip>Cambridge Primary</Chip>);
    expect(screen.getByText("Cambridge Primary")).toBeInTheDocument();
  });

  it("uses the readable red for text rather than the CTA red", () => {
    // `--red` on a pale tint is below AA as small text; `--red-text` is not.
    const { container } = render(<Chip tone="red">Events</Chip>);
    expect(container.firstElementChild?.className).toContain("text-red-text");
  });
});

describe("WaveDivider", () => {
  it("is decoration, not content", () => {
    render(<WaveDivider fill="cream" />);
    expect(screen.getByTestId("wave-divider")).toHaveAttribute("aria-hidden", "true");
  });

  it("fills with the colour of the section it flows into", () => {
    const { container } = render(<WaveDivider fill="navyDeep" />);
    expect(container.querySelector("path")?.getAttribute("class")).toContain("fill-navy-deep");
  });

  it("stretches to any width without distorting the curve's character", () => {
    expect(screen.queryByTestId("wave-divider")).not.toBeInTheDocument();
    render(<WaveDivider fill="sky" />);
    expect(screen.getByTestId("wave-divider")).toHaveAttribute("preserveAspectRatio", "none");
  });

  it("can be flipped for a wave at the top of a band", () => {
    render(<WaveDivider fill="sky" flip />);
    expect(screen.getByTestId("wave-divider").getAttribute("class")).toContain("rotate-180");
  });

  it.each(["gentle", "deep", "double"] as const)("draws the %s variant", (variant) => {
    const { container } = render(<WaveDivider fill="cream" variant={variant} />);
    expect(container.querySelector("path")?.getAttribute("d")).toBeTruthy();
  });
});

describe("spot art", () => {
  it.each([
    ["star", <Star key="s" />, "spot-star"],
    ["squiggle", <Squiggle key="q" />, "spot-squiggle"],
    ["confetti", <Confetti key="c" />, "spot-confetti"],
    ["blob", <Blob key="b" />, "spot-blob"],
  ])("hides the %s from assistive technology", (_name, element, testId) => {
    render(element);
    expect(screen.getByTestId(testId)).toHaveAttribute("aria-hidden", "true");
  });

  it("offers several blob shapes so a page does not look stamped", () => {
    const shapes = [0, 1, 2, 3].map((shape) => {
      const { container } = render(<Blob shape={shape} />);
      return container.querySelector("path")?.getAttribute("d");
    });
    expect(new Set(shapes).size).toBe(4);
  });

  it("wraps the blob index rather than rendering nothing", () => {
    // A caller keying off a list index should never get an empty SVG.
    const { container } = render(<Blob shape={9} />);
    expect(container.querySelector("path")?.getAttribute("d")).toBeTruthy();
  });

  it("handles a negative blob index", () => {
    const { container } = render(<Blob shape={-2} />);
    expect(container.querySelector("path")?.getAttribute("d")).toBeTruthy();
  });
});
