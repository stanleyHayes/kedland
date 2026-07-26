import { render, screen, within } from "@testing-library/react";
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

  it("uses one continuous swept edge for the logo panel", () => {
    render(<SiteHeader />);
    expect(screen.getByTestId("logo-panel-shape")).toHaveAttribute(
      "d",
      "M18 0 H260 C218 7 202 22 190 48 C178 74 170 96 140 96 H18 C8 96 0 88 0 78 V18 C0 8 8 0 18 0 Z",
    );
  });

  it("shows the Enrol Now call to action", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Enrol Now" })).toHaveAttribute("href", "/admissions");
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
    expect(screen.getByRole("link", { name: /admission form/i })).toHaveAttribute("download");
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
