import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Loading from "./loading";
import NotFound from "./not-found";

describe("Loading", () => {
  it("announces what is loading rather than showing bare shapes", () => {
    render(<Loading />);
    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(within(status).getByText("Loading dashboard")).toBeInTheDocument();
  });

  it("uses skeletons, never a spinner", () => {
    render(<Loading />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });
});

describe("NotFound", () => {
  it("explains what happened", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page not found");
  });

  it("offers a way back", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: /back to the overview/i })).toHaveAttribute("href", "/");
  });
});
