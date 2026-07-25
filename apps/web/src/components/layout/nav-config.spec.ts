import { describe, expect, it } from "vitest";

import { isActiveLink, NAV_CTA, NAV_LINKS, QUICK_LINKS } from "./nav-config";

describe("NAV_LINKS", () => {
  it("matches the sitemap in build package §3", () => {
    expect(NAV_LINKS.map((l) => l.label)).toEqual([
      "Home",
      "About",
      "Academics",
      "Admissions",
      "Student Life",
      "News",
      "Contact",
    ]);
  });

  it("expands only About and Academics — the package says no mega-menu", () => {
    const withChildren = NAV_LINKS.filter((l) => l.children).map((l) => l.label);
    expect(withChildren).toEqual(["About", "Academics"]);
  });

  it("lists the four About sub-pages", () => {
    const about = NAV_LINKS.find((l) => l.label === "About");
    expect(about?.children?.map((c) => c.href)).toEqual([
      "/about/our-story",
      "/about/mission-vision-values",
      "/about/principal",
      "/about/facilities",
    ]);
  });

  it("gives every dropdown entry a description for the panel", () => {
    for (const link of NAV_LINKS) {
      for (const child of link.children ?? []) {
        expect(child.description.length).toBeGreaterThan(0);
      }
    }
  });

  it("points the CTA at admissions", () => {
    expect(NAV_CTA).toEqual({ href: "/admissions", label: "Enrol Now" });
  });

  it("uses only internal paths", () => {
    for (const link of NAV_LINKS) {
      expect(link.href.startsWith("/")).toBe(true);
    }
  });
});

describe("QUICK_LINKS", () => {
  it("offers the admission form as a download, not a page", () => {
    // Build package §5.2: the form is a PDF download; there is no online form.
    const form = QUICK_LINKS.find((q) => q.label === "Admission form");
    expect(form?.download).toBe(true);
    expect(form?.href).toMatch(/\.pdf$/);
  });

  it("marks the Instagram link external so it opens safely in a new tab", () => {
    const instagram = QUICK_LINKS.find((q) => q.label === "Instagram");
    expect(instagram?.external).toBe(true);
    expect(instagram?.href).toBe("https://www.instagram.com/kedlandintlschool");
  });

  it("keeps every other destination internal", () => {
    for (const item of QUICK_LINKS) {
      if (item.external === true) continue;
      expect(item.href.startsWith("/")).toBe(true);
    }
  });
});

describe("isActiveLink", () => {
  const home = { href: "/", exact: true } as const;
  const about = { href: "/about" } as const;

  it("matches home only exactly", () => {
    expect(isActiveLink("/", home)).toBe(true);
    expect(isActiveLink("/about", home)).toBe(false);
  });

  it("matches a section and its children", () => {
    expect(isActiveLink("/about", about)).toBe(true);
    expect(isActiveLink("/about/our-story", about)).toBe(true);
  });

  it("does not match a sibling sharing a prefix", () => {
    // /about-us must not light up the About nav item.
    expect(isActiveLink("/about-us", about)).toBe(false);
  });
});
