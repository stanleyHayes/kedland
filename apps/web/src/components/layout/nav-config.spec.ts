import { describe, expect, it } from "vitest";

import { buildQuickLinks, isActiveLink, NAV_CTA, NAV_LINKS, QUICK_LINKS } from "./nav-config";

describe("NAV_LINKS", () => {
  it("matches the sitemap in build package §3", () => {
    expect(NAV_LINKS.map((l) => l.label)).toEqual([
      "Home",
      "About",
      "Academics",
      "Admissions",
      "Student Life",
      "Contact",
    ]);
  });

  /**
   * Three disclosures, and no more. The build package rules out a mega-menu,
   * and each of these holds two to four items — Student Life became one so the
   * gallery had somewhere to live without adding an eighth top-level item to a
   * bar already at its limit on a laptop.
   */
  /**
   * Six, and no more. Seven left no room between the lockup and the CTA on a
   * laptop; the two that moved under Student Life are both "what school life is
   * like", which is the question that section already answers.
   */
  it("keeps the bar to six items", () => {
    expect(NAV_LINKS).toHaveLength(6);
  });

  it("still reaches the news, from Student Life", () => {
    const studentLife = NAV_LINKS.find((l) => l.label === "Student Life");
    expect(studentLife?.children?.map((c) => c.href)).toContain("/news");
  });

  it("keeps the disclosures few and shallow — no mega-menu", () => {
    const withChildren = NAV_LINKS.filter((l) => l.children);

    expect(withChildren.map((l) => l.label)).toEqual(["About", "Academics", "Student Life"]);
    for (const link of withChildren) {
      expect(link.children?.length).toBeLessThanOrEqual(4);
    }
  });

  it("gives every dropdown item an icon, so a list of rows can be scanned", () => {
    for (const link of NAV_LINKS) {
      for (const child of link.children ?? []) {
        expect(child.icon).toMatch(/^[a-z][a-z0-9-]*$/);
      }
    }
  });

  it("reaches the gallery from Student Life", () => {
    const studentLife = NAV_LINKS.find((l) => l.label === "Student Life");
    expect(studentLife?.children?.map((c) => c.href)).toContain("/gallery");
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
  /**
   * Not a direct link to the PDF, which is the regression this replaces.
   *
   * Build package §5.2 does make the form a static download, and it will be one
   * again once the school supplies it. But until then the file is not there, and
   * this panel is a client component that cannot check — so linking straight at
   * it gave every parent who clicked a 404. The admissions page already handles
   * both states, and is where someone after the form should end up regardless.
   */
  it("sends the admission form shortcut somewhere that exists", () => {
    const form = QUICK_LINKS.find((q) => q.label === "Admission form");

    expect(form?.href).toBe("/admissions");
    expect(form?.download).toBeUndefined();
  });

  /** Every internal shortcut must resolve to a real route. */
  it("points every internal quick link at a page the site has", () => {
    const internal = QUICK_LINKS.filter((q) => q.external !== true).map((q) => q.href);
    const routes = new Set([
      "/",
      "/about",
      "/academics",
      "/admissions",
      "/student-life",
      "/contact",
      "/faqs",
      "/news",
    ]);

    expect(internal.filter((href) => !routes.has(href.split("#")[0] ?? href))).toEqual([]);
  });

  it("marks social links external so they open safely in a new tab", () => {
    const instagram = QUICK_LINKS.find((q) => q.label === "Instagram");
    expect(instagram?.external).toBe(true);
    expect(instagram?.href).toBe("https://www.instagram.com/kedlandintlschool");

    expect(QUICK_LINKS.find((q) => q.label === "Facebook")?.href).toBe(
      "https://www.facebook.com/KedlandInternationalSchool",
    );
    expect(QUICK_LINKS.find((q) => q.label === "TikTok")?.href).toBe(
      "https://www.tiktok.com/@kedland.internatio",
    );
  });

  it("builds social quick links from CMS settings", () => {
    const links = buildQuickLinks({
      instagram: "https://www.instagram.com/custom",
      facebook: "",
      tiktok: "https://www.tiktok.com/@custom",
    });

    expect(links.find((q) => q.label === "Instagram")?.href).toBe("https://www.instagram.com/custom");
    expect(links.find((q) => q.label === "TikTok")?.href).toBe("https://www.tiktok.com/@custom");
    expect(links.find((q) => q.label === "Facebook")).toBeUndefined();
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
