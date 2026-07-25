import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BusyLabel, Skeleton, SkeletonCard, SkeletonGroup, SkeletonText } from "./skeleton";

describe("Skeleton", () => {
  it("is hidden from assistive technology — the group does the announcing", () => {
    render(<Skeleton />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true");
  });

  it("carries the shimmer class so reduced-motion CSS can switch it off", () => {
    render(<Skeleton />);
    expect(screen.getByTestId("skeleton")).toHaveClass("kedland-skeleton");
  });

  it("applies the dark tone on dark surfaces", () => {
    render(<Skeleton tone="dark" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("kedland-skeleton--dark");
  });

  it("passes through layout classes so it can match the real element's box", () => {
    render(<Skeleton className="h-40 w-full" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("h-40", "w-full");
  });
});

describe("SkeletonGroup", () => {
  it("announces what is loading in words, once", () => {
    render(
      <SkeletonGroup label="Loading news">
        <Skeleton />
        <Skeleton />
      </SkeletonGroup>,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(within(status).getByText("Loading news")).toBeInTheDocument();
  });

  it("hides the decorative shapes beneath the single announcement", () => {
    const { container } = render(
      <SkeletonGroup label="Loading news">
        <Skeleton />
      </SkeletonGroup>,
    );
    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("applies layout classes to the element the children sit in", () => {
    // Regression: the class used to land on the outer live region, which also
    // holds the visually-hidden label. A `grid-cols-2` there laid out the label
    // and the wrapper instead of the cards, so everything stacked.
    const { container } = render(
      <SkeletonGroup label="Loading news" className="grid sm:grid-cols-2">
        <Skeleton />
        <Skeleton />
      </SkeletonGroup>,
    );

    const laidOut = container.querySelector(".grid");
    expect(laidOut).toHaveAttribute("aria-hidden", "true");
    expect(laidOut?.children).toHaveLength(2);
  });

  it("keeps the live region free of layout classes", () => {
    render(
      <SkeletonGroup label="Loading news" className="grid">
        <Skeleton />
      </SkeletonGroup>,
    );
    expect(screen.getByRole("status")).not.toHaveClass("grid");
  });
});

describe("SkeletonText", () => {
  it("renders the requested number of lines", () => {
    render(<SkeletonText lines={5} />);
    expect(screen.getAllByTestId("skeleton")).toHaveLength(5);
  });

  it("defaults to three lines", () => {
    render(<SkeletonText />);
    expect(screen.getAllByTestId("skeleton")).toHaveLength(3);
  });

  it("varies line widths so a paragraph does not read as a solid block", () => {
    render(<SkeletonText lines={4} />);
    const widths = screen.getAllByTestId("skeleton").map((el) => {
      return [...el.classList].find((c) => c.startsWith("w-"));
    });
    expect(new Set(widths).size).toBeGreaterThan(1);
  });
});

describe("SkeletonCard", () => {
  it("includes a media block shaped like the real cover image", () => {
    render(<SkeletonCard />);
    const shapes = screen.getAllByTestId("skeleton");
    expect(shapes[0]).toHaveClass("aspect-[16/10]");
  });

  it("omits the media block when the real card has none", () => {
    render(<SkeletonCard withMedia={false} />);
    const shapes = screen.getAllByTestId("skeleton");
    expect(shapes[0]).not.toHaveClass("aspect-[16/10]");
  });
});

describe("BusyLabel", () => {
  it("names the pending action for screen readers", () => {
    render(<BusyLabel label="Publishing post" />);
    expect(within(screen.getByRole("status")).getByText("Publishing post")).toBeInTheDocument();
  });

  it("keeps a fixed footprint so the control does not resize mid-action", () => {
    render(<BusyLabel label="Saving" />);
    expect(screen.getByRole("status")).toHaveClass("min-h-4");
  });
});
