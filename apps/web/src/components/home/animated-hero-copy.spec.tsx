import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnimatedHeroCopy } from "./animated-hero-copy";

describe("AnimatedHeroCopy", () => {
  const props = {
    eyebrow: "THE FUTURE BEGINS HERE",
    heading: "Where little Stars learn, play, and shine.",
    subheading: "A warm school for curious minds.",
  };

  it("keeps the animated words as one accessible heading", () => {
    render(<AnimatedHeroCopy {...props} />);

    expect(
      screen.getByRole("heading", { name: "Where little Stars learn, play, and shine." }),
    ).toBeInTheDocument();
  });

  it("keeps the decorative mantra out of the accessibility tree", () => {
    const { container } = render(<AnimatedHeroCopy {...props} />);

    expect(container.querySelector(".hero-mantra")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("A warm school for curious minds.")).toBeInTheDocument();
  });
});
