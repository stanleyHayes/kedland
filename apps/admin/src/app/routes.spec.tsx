import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Loading from "./loading";
import NotFound from "./not-found";

describe("Loading", () => {
  it("announces the branded dashboard splash", () => {
    render(<Loading />);
    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(within(status).getByText("Loading dashboard")).toBeInTheDocument();
  });

  it("uses a branded splash instead of anonymous skeletons", () => {
    render(<Loading />);
    expect(screen.getByText("Preparing your dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
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
