import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AboutExplore } from "./about-explore";

describe("AboutExplore", () => {
  it("turns the About landing page into a hub for all four sub-pages", () => {
    render(<AboutExplore current="about" />);

    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(screen.getByRole("link", { name: /our story/i })).toHaveAttribute("href", "/about/our-story");
    expect(screen.getByRole("link", { name: /our facilities/i })).toHaveAttribute(
      "href",
      "/about/facilities",
    );
  });

  it("replaces the current sub-page with a route back to the overview", () => {
    render(<AboutExplore current="about/facilities" />);

    expect(screen.getByRole("link", { name: /about overview/i })).toHaveAttribute("href", "/about");
    expect(screen.queryByRole("link", { name: /our facilities/i })).not.toBeInTheDocument();
  });
});
