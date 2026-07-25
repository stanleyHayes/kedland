import { render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("is a footer landmark with its own navigation", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Footer" })).toBeInTheDocument();
  });

  it("carries the school's tagline and motto", () => {
    render(<SiteFooter />);
    expect(screen.getByText("The future begins here")).toBeInTheDocument();
    expect(screen.getByText("In God We Trust")).toBeInTheDocument();
  });

  it("names the logo, since here it is content rather than decoration", () => {
    // In the header the crest sits beside a visible wordmark, so it is
    // decorative. Here it is the only identification, so it needs a name.
    render(<SiteFooter />);
    expect(screen.getByAltText("Kedland International School")).toBeInTheDocument();
  });

  // Typed as tuples: destructuring a plain nested array under
  // `noUncheckedIndexedAccess` widens each element to `string | undefined`.
  const PHONE_LINKS: readonly (readonly [display: string, dial: string])[] = [
    ["+233 257 130 333", "tel:+233257130333"],
    ["+233 202 472 472", "tel:+233202472472"],
    ["+233 244 958 103", "tel:+233244958103"],
  ];

  it.each(PHONE_LINKS)("makes %s callable", (display, dial) => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: display })).toHaveAttribute("href", dial);
  });

  it("gives the address as a real address element", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/community 19 annex/i).closest("address")).toBeInTheDocument();
  });

  it("links Instagram safely", () => {
    render(<SiteFooter />);
    const link = screen.getByRole("link", { name: /@kedlandintlschool/ });

    expect(link).toHaveAttribute("href", "https://www.instagram.com/kedlandintlschool");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });

  it("credits the school and the agency", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/kedland international school\. all rights reserved/i)).toBeInTheDocument();
    expect(screen.getByText(/xcreativs technologies/i)).toBeInTheDocument();
  });

  it("shows the current year in the copyright", () => {
    render(<SiteFooter />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
  });

  it("repeats the main navigation plus FAQs", () => {
    render(<SiteFooter />);
    const nav = screen.getByRole("navigation", { name: "Footer" });

    expect(within(nav).getByRole("link", { name: "Admissions" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "FAQs" })).toBeInTheDocument();
  });

  it("separates itself from the page with a wave, not a rule", () => {
    render(<SiteFooter />);
    expect(screen.getByTestId("wave-divider")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no axe violations", async () => {
    const { container } = render(<SiteFooter />);
    const results = await axe.run(container, { rules: { region: { enabled: false } } });

    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
