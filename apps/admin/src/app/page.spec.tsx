import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import OverviewPage from "./page";

import { NAV_GROUPS } from "@/components/shell/nav-config";

describe("OverviewPage", () => {
  it("names the dashboard", () => {
    render(<OverviewPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Kedland Dashboard");
  });

  it("lists every planned section group", () => {
    render(<OverviewPage />);
    for (const group of NAV_GROUPS) {
      expect(screen.getByText(group.title)).toBeInTheDocument();
    }
  });

  it("says plainly that this is scaffolding, not a working dashboard", () => {
    // Staff may see this before Phase 7 lands; it should not look broken.
    render(<OverviewPage />);
    expect(screen.getByText(/foundation scaffold/i)).toBeInTheDocument();
  });

  it("keeps headings in order — h1 then h2 then h3", () => {
    const { container } = render(<OverviewPage />);
    const levels = [...container.querySelectorAll("h1, h2, h3")].map((h) => Number(h.tagName[1]));

    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });
});
