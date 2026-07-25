import { render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import { COLOURS } from "@kedland/ui";

import { FoundationStatus } from "./foundation-status";

describe("FoundationStatus", () => {
  it("renders exactly one h1", () => {
    render(<FoundationStatus />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("leads with the school's own tagline", () => {
    render(<FoundationStatus />);
    expect(screen.getByText(/the future begins here/i)).toBeInTheDocument();
  });

  it("announces the skeleton region in words", () => {
    render(<FoundationStatus />);
    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(within(status).getByText("Loading example content")).toBeInTheDocument();
  });

  it("does not expose individual skeleton shapes to assistive technology", () => {
    render(<FoundationStatus />);
    for (const shape of screen.getAllByTestId("skeleton")) {
      expect(shape).toHaveAttribute("aria-hidden", "true");
    }
  });
});

/**
 * The automated half of the accessibility gate (agent_plan §6.8). Lint catches
 * static JSX mistakes; this catches what only exists once rendered — contrast,
 * roles, names, heading order.
 */
describe("FoundationStatus accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(<FoundationStatus />);

    const results = await axe.run(container, {
      rules: {
        // Landmark and page-level rules need the full document, which the
        // layout provides; they are asserted in the Playwright suite instead.
        region: { enabled: false },
      },
    });

    expect(
      results.violations.map((v) => `${v.id}: ${v.help}`),
      "axe found accessibility violations",
    ).toEqual([]);
  });

  it("uses muted text only where it clears the AA contrast floor", () => {
    // `text-grey` on the cream page background. This is the pairing that failed
    // at the build package's original #6B7A88 — see packages/ui tokens.ts.
    expect(COLOURS.grey).toMeetContrastAgainst(COLOURS.cream);
  });
});
