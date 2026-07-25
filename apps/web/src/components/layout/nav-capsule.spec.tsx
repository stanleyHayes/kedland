import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MobileMenu } from "./mobile-menu";
import { NavCapsule } from "./nav-capsule";
import { NAV_LINKS } from "./nav-config";
import { QuickLinksPanel } from "./quick-links-panel";

/**
 * The pieces the header composes, exercised directly.
 *
 * `SiteHeader` covers them in their assembled state; these cases reach the
 * branches that assembly hides — a dropdown child marked current, the
 * capsule rendering an unknown pathname, the mobile menu's focus wrap.
 */

describe("NavCapsule", () => {
  it("renders every top-level link", () => {
    render(<NavCapsule links={NAV_LINKS} pathname="/" />);

    const capsule = screen.getByTestId("nav-capsule");
    expect(within(capsule).getByRole("link", { name: "Admissions" })).toBeInTheDocument();
    expect(within(capsule).getByRole("button", { name: /^academics/i })).toBeInTheDocument();
  });

  it("marks a plain link current when it is the page", () => {
    render(<NavCapsule links={NAV_LINKS} pathname="/news" />);
    expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("aria-current", "page");
  });

  it("marks the exact sub-page current inside an open dropdown", async () => {
    render(<NavCapsule links={NAV_LINKS} pathname="/academics/primary" />);
    await userEvent.click(screen.getByRole("button", { name: /^academics/i }));

    expect(screen.getByRole("link", { name: /^primary/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /^early years/i })).not.toHaveAttribute("aria-current");
  });

  it("closes the dropdown once a child is chosen", async () => {
    render(<NavCapsule links={NAV_LINKS} pathname="/" />);
    const trigger = screen.getByRole("button", { name: /^about/i });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("link", { name: /^facilities/i }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the dropdown when the overview link is chosen", async () => {
    render(<NavCapsule links={NAV_LINKS} pathname="/" />);
    const trigger = screen.getByRole("button", { name: /^about/i });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("link", { name: /about overview/i }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("accepts extra layout classes", () => {
    render(<NavCapsule links={NAV_LINKS} pathname="/" className="mx-auto" />);
    expect(screen.getByTestId("nav-capsule").className).toContain("mx-auto");
  });
});

describe("QuickLinksPanel", () => {
  it("stays shut until asked", () => {
    render(<QuickLinksPanel />);
    expect(screen.queryByRole("link", { name: /book a tour/i })).not.toBeInTheDocument();
  });

  it("closes on Escape and hands focus back", async () => {
    render(<QuickLinksPanel />);
    const trigger = screen.getByRole("button", { name: "Quick links" });

    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("closes when a shortcut is followed", async () => {
    render(<QuickLinksPanel />);
    const trigger = screen.getByRole("button", { name: "Quick links" });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("link", { name: /faqs/i }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when the pointer goes elsewhere", async () => {
    render(<QuickLinksPanel />);
    const trigger = screen.getByRole("button", { name: "Quick links" });

    await userEvent.click(trigger);
    await userEvent.click(document.body);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("MobileMenu", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<MobileMenu open={false} onClose={() => undefined} pathname="/" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("takes focus when it opens, so the next Tab is inside it", () => {
    render(<MobileMenu open onClose={() => undefined} pathname="/" />);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveFocus();
  });

  it("marks the current section and its sub-page", () => {
    render(<MobileMenu open onClose={() => undefined} pathname="/about/principal" />);
    const dialog = screen.getByRole("dialog", { name: "Menu" });

    expect(within(dialog).getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
    expect(within(dialog).getByRole("link", { name: "Principal's Welcome" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("wraps focus forward from the last control to the first", async () => {
    render(<MobileMenu open onClose={() => undefined} pathname="/" />);
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    const focusables = dialog.querySelectorAll<HTMLElement>("a[href], button");
    const last = focusables[focusables.length - 1];

    last?.focus();
    await userEvent.tab();

    // Without the trap, Tab here would land on browser chrome behind the overlay.
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveFocus();
  });

  it("wraps focus backward from the first control to the last", async () => {
    render(<MobileMenu open onClose={() => undefined} pathname="/" />);
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    const focusables = dialog.querySelectorAll<HTMLElement>("a[href], button");
    const last = focusables[focusables.length - 1];

    screen.getByRole("button", { name: "Close menu" }).focus();
    await userEvent.tab({ shift: true });

    expect(last).toHaveFocus();
  });

  it("offers the CTA and the quick links", () => {
    render(<MobileMenu open onClose={() => undefined} pathname="/" />);
    const dialog = screen.getByRole("dialog", { name: "Menu" });

    expect(within(dialog).getByRole("link", { name: /enrol now/i })).toHaveAttribute("href", "/admissions");
    expect(within(dialog).getByRole("link", { name: /admission form/i })).toHaveAttribute("download");
  });

  it("restores the page's own scrolling when it unmounts", () => {
    const { unmount } = render(<MobileMenu open onClose={() => undefined} pathname="/" />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});
