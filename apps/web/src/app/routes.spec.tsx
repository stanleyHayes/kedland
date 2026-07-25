import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import RouteError from "./error";
import Loading from "./loading";
import NotFound from "./not-found";

/**
 * The pages themselves are async Server Components that fetch from the content
 * API, so they are exercised in the Playwright suite against a running server
 * rather than here. What follows are the route states React renders directly.
 */

describe("Loading", () => {
  it("announces what is loading", () => {
    render(<Loading />);
    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(within(status).getByText("Loading page")).toBeInTheDocument();
  });

  it("uses skeletons, never a spinner", () => {
    render(<Loading />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });
});

describe("NotFound", () => {
  it("explains the problem without blaming the visitor", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("We could not find that page");
  });

  it("offers a route back to the home page", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: /back to the home page/i })).toHaveAttribute("href", "/");
  });
});

describe("RouteError", () => {
  const error = new Error("boom");

  it("tells the visitor something went wrong", () => {
    render(<RouteError error={error} reset={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Something went wrong");
  });

  it("gives a phone number as a fallback", () => {
    // A parent who cannot load the contact page still needs to reach the school.
    render(<RouteError error={error} reset={vi.fn()} />);
    expect(screen.getByRole("link", { name: /\+233 257 130 333/ })).toHaveAttribute(
      "href",
      "tel:+233257130333",
    );
  });

  it("lets the visitor retry", async () => {
    const reset = vi.fn();
    render(<RouteError error={error} reset={reset} />);

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not show the raw error message", () => {
    // An exception string can carry internals; the visitor gets a plain apology.
    render(<RouteError error={new Error("mongodb://admin:hunter2@cluster")} reset={vi.fn()} />);
    expect(screen.queryByText(/hunter2/)).not.toBeInTheDocument();
  });
});
