import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeRouteGuide } from "./home-route-guide";

describe("HomeRouteGuide", () => {
  it("offers concise onward journeys across the public site", () => {
    render(<HomeRouteGuide />);

    expect(screen.getAllByRole("link")).toHaveLength(6);
    expect(screen.getByRole("link", { name: /early years/i })).toHaveAttribute(
      "href",
      "/academics/early-years",
    );
    expect(screen.getByRole("link", { name: /school life/i })).toHaveAttribute("href", "/student-life");
    expect(screen.getByRole("link", { name: /join kedland/i })).toHaveAttribute("href", "/admissions");
  });
});
