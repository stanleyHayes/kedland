import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

beforeEach(() => {
  pathname.current = "/";
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: 0,
    writable: true,
  });
});

describe("SiteHeader structure", () => {
  it("exposes one primary navigation landmark", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  it("links the logo lockup home, with the school's full name available", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /kedland international school — home/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("keeps the decorative wave out of the accessibility tree", () => {
    render(<SiteHeader />);
    expect(screen.getByTestId("logo-wave")).toHaveAttribute("aria-hidden", "true");
  });

  it("uses Kedland's dark plaque treatment without recolouring the native crest", () => {
    const { container } = render(<SiteHeader />);
    const stops = Array.from(container.querySelectorAll("#kedland-lockup-wave stop"));
    const crest = container.querySelector('img[src*="kedland-logo-256.png"]');

    expect(stops.map((stop) => stop.getAttribute("stop-color"))).toEqual([
      "var(--color-navy-deep)",
      "var(--color-navy-deep)",
      "var(--color-navy)",
    ]);
    expect(crest).toBeInTheDocument();
    expect(crest?.getAttribute("style") ?? "").not.toContain("filter");
  });

  /**
   * The sweep is a rounded rectangle with a circle subtracted from its
   * bottom-right corner, not a hand-drawn path.
   *
   * Pinning the old `d` attribute pinned a specific set of bezier control
   * points — which is what the shape was before, and what kept bulging: a curve
   * that has to leave one edge tangentially and meet another tangentially is
   * over-constrained for hand-tuning. So this asserts the *construction*
   * rather than coordinates nobody can verify by reading.
   */
  it("draws the swept edge by subtracting a circle from the corner", () => {
    const { container } = render(<SiteHeader />);
    const panel = screen.getByTestId("logo-panel-shape");

    expect(panel.tagName).toBe("rect");
    expect(panel).toHaveAttribute("mask");

    const cut = container.querySelector("mask circle");
    // The centre sits just outside the 260×96 box so the curve leaves through
    // the top-right corner without shortening the long lower edge.
    expect(cut).toHaveAttribute("cx", "284");
    expect(cut).toHaveAttribute("cy", "96");
    expect(cut).toHaveAttribute("r", "99");
  });

  /**
   * The sweep should reach the top-right corner while retaining a long lower
   * edge. These relationships are the visible design contract.
   */
  it("finishes the sweep at the top-right and keeps the lower edge long", () => {
    const { container } = render(<SiteHeader />);
    const cutout = container.querySelector("mask circle");
    const cx = Number(cutout?.getAttribute("cx") ?? 0);
    const cy = Number(cutout?.getAttribute("cy") ?? 0);
    const radius = Number(cutout?.getAttribute("r") ?? 0);
    const topRightDistance = Math.hypot(cx - 260, cy);
    const lowerEdgeEnd = cx - radius;

    expect(Math.abs(radius - topRightDistance)).toBeLessThan(1);
    expect(lowerEdgeEnd).toBeGreaterThan(180);
    expect(lowerEdgeEnd).toBeLessThan(190);
  });

  /**
   * The regression the school reported twice as "the left side overflows the
   * navbar margin".
   *
   * Under `preserveAspectRatio="none"` a viewBox `rx` is stretched with
   * everything else, so it cannot match the bar's corner. The panel therefore
   * hangs its left rounded corners outside the viewBox to be clipped square, and
   * takes its real rounding from the same `rounded-lg` token the bar uses.
   */
  /**
   * The plaque stands off the pill's edge, like everything else in it.
   *
   * The bar carried `pr-2` and no left padding, so the plaque — absolutely
   * positioned at the lockup's left edge — ran right up to the pill's boundary
   * and touched it at mid-height while having clear white above and below. The
   * asymmetry is what read as "too close to the edge".
   */
  it("gives the bar the same padding at both ends", () => {
    render(<SiteHeader />);
    const bar = screen.getByTestId("header-bar").getAttribute("class") ?? "";

    expect(bar).toContain("px-4");
    expect(bar).toContain("sm:px-6");
    // `pr-2` alone is the state this test exists to prevent.
    expect(bar).not.toMatch(/\bpr-2\b/);
  });

  it("keeps the plaque rounded while the settled bar reaches both viewport edges", () => {
    render(<SiteHeader />);
    const panel = screen.getByTestId("logo-panel-shape");
    const svg = screen.getByTestId("logo-wave");

    // Hung off the left so those corners are clipped flat.
    expect(panel).toHaveAttribute("x", "-16");
    expect(svg.getAttribute("class")).toContain("rounded-l-lg");
    expect(screen.getByTestId("header-bar").getAttribute("class")).toContain("rounded-none");
  });

  it("gives the crest more breathing room at the left edge", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: /kedland international school — home/i })).toHaveClass(
      "pl-6",
      "sm:pl-7",
    );
  });

  it("shows the Enrol Now call to action", () => {
    render(<SiteHeader />);
    const cta = screen.getByRole("link", { name: "Enrol Now" });

    expect(cta).toHaveAttribute("href", "/admissions");
    expect(cta.getAttribute("class")).toContain("max-sm:!hidden");
  });

  it("raises the theme and mobile-menu icon controls", () => {
    render(<SiteHeader />);

    const themeToggle = screen.getByRole("button", { name: "Switch to dark theme" });
    expect(themeToggle).toHaveClass("neu-icon", "neu-interactive");
    expect(themeToggle).not.toHaveClass("hidden");
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveClass("neu-icon", "neu-interactive");
  });
});

describe("scroll transformation", () => {
  it("starts as a full-width settled bar", () => {
    render(<SiteHeader />);

    const header = screen.getByRole("banner");
    const bar = screen.getByTestId("header-bar");

    expect(header).toHaveAttribute("data-header-state", "settled");
    expect(header).toHaveClass("px-0", "pt-0");
    expect(bar).toHaveClass("max-w-[100vw]", "rounded-none");
  });

  it("contracts into the floating pill after scrolling", async () => {
    render(<SiteHeader />);

    window.scrollY = 120;
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(screen.getByRole("banner")).toHaveAttribute("data-header-state", "floating");
    });

    expect(screen.getByRole("banner")).toHaveClass("px-3", "pt-3");
    expect(screen.getByTestId("header-bar")).toHaveClass("max-w-7xl", "rounded-lg", "shadow-lift");
  });

  it("settles smoothly back into the page at the top", async () => {
    render(<SiteHeader />);

    window.scrollY = 120;
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(screen.getByRole("banner")).toHaveAttribute("data-header-state", "floating");
    });

    window.scrollY = 0;
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(screen.getByRole("banner")).toHaveAttribute("data-header-state", "settled");
    });

    expect(screen.getByTestId("header-bar")).toHaveClass("max-w-[100vw]", "rounded-none");
  });

  it("disables shape transitions when reduced motion is requested", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("banner")).toHaveClass("motion-reduce:transition-none");
    expect(screen.getByTestId("header-bar")).toHaveClass("motion-reduce:transition-none");
  });
});

describe("current page", () => {
  it("marks Home as current on the home page", () => {
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("marks the section current when on a sub-page", () => {
    pathname.current = "/about/our-story";
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("button", { name: /^about/i })).toHaveAttribute("aria-current", "page");
  });

  it("marks nothing current on a page outside the nav", () => {
    pathname.current = "/privacy";
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });
});

describe("dropdowns", () => {
  it("starts collapsed", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("button", { name: /^academics/i })).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on click and reveals the sub-pages", async () => {
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: /^academics/i });

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /early years/i })).toHaveAttribute(
      "href",
      "/academics/early-years",
    );
  });

  it("offers the section's own overview page alongside its children", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: /^about/i }));

    expect(screen.getByRole("link", { name: /about overview/i })).toHaveAttribute("href", "/about");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: /^about/i });

    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Focus must come back, or a keyboard user is dropped at the top of the page.
    expect(trigger).toHaveFocus();
  });

  it("closes when the pointer goes elsewhere", async () => {
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: /^about/i });

    await userEvent.click(trigger);
    await userEvent.click(document.body);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("ties the trigger to the panel it controls", async () => {
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: /^about/i });
    await userEvent.click(trigger);

    const controls = trigger.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls!)).toBeInTheDocument();
  });
});

describe("quick links panel", () => {
  it("is labelled, since a grid of dots says nothing on its own", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("button", { name: "Quick links" })).toBeInTheDocument();
  });

  it("opens the shortcuts", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Quick links" }));

    expect(screen.getByRole("link", { name: /book a tour/i })).toBeInTheDocument();
    // Points at the admissions page while the PDF is still pending — see the
    // note in nav-config.ts.
    expect(screen.getByRole("link", { name: /admission form/i })).toHaveAttribute("href", "/admissions");
  });

  it("opens Instagram in a new tab without leaking the referrer", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Quick links" }));

    const instagram = screen.getByRole("link", { name: /instagram/i });
    expect(instagram).toHaveAttribute("target", "_blank");
    expect(instagram.getAttribute("rel")).toContain("noreferrer");
  });
});

describe("mobile menu", () => {
  it("is closed until the menu button is pressed", () => {
    render(<SiteHeader />);
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });

  it("opens as a modal dialog", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = screen.getByRole("dialog", { name: "Menu" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("lists sub-pages inline rather than behind another tap", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = screen.getByRole("dialog", { name: "Menu" });
    expect(within(dialog).getByRole("link", { name: "Our Story" })).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });

  it("closes via its own close button", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await userEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });

  it("locks the page behind it and releases the lock on close", async () => {
    render(<SiteHeader />);

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("closes when a link inside it is followed", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = screen.getByRole("dialog", { name: "Menu" });
    await userEvent.click(within(dialog).getByRole("link", { name: "Admissions" }));

    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });
});

describe("SiteHeader accessibility", () => {
  it("has no axe violations when idle", async () => {
    const { container } = render(<SiteHeader />);
    const results = await axe.run(container, { rules: { region: { enabled: false } } });

    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it("has no axe violations with a dropdown open", async () => {
    const { container } = render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: /^about/i }));

    const results = await axe.run(container, { rules: { region: { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
