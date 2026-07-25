import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import Facilities from "./about/facilities/page";
import MissionVisionValues from "./about/mission-vision-values/page";
import OurStory from "./about/our-story/page";
import About from "./about/page";
import Principal from "./about/principal/page";
import EarlyYears from "./academics/early-years/page";
import Academics from "./academics/page";
import Primary from "./academics/primary/page";
import Admissions from "./admissions/page";
import Contact from "./contact/page";
import Faqs from "./faqs/page";
import News from "./news/page";
import Privacy from "./privacy/page";
import StudentLife from "./student-life/page";

import { PageShell } from "@/components/page-shell";

/**
 * Every route in the navigation exists so the header never links to a 404
 * (Phase 1), carrying its real title and description from build package §4.
 * Phase 4 replaces the bodies with sections from the content registry; these
 * assertions are about the routes being real and correctly titled, which stays
 * true either way.
 */
const ROUTES: readonly (readonly [name: string, Page: () => React.JSX.Element, heading: string])[] = [
  ["about", About, "About Kedland"],
  ["about/our-story", OurStory, "How Kedland began"],
  ["about/mission-vision-values", MissionVisionValues, "Mission, Vision & Values"],
  ["about/principal", Principal, "A message from our Principal"],
  ["about/facilities", Facilities, "A campus built around your child"],
  ["academics", Academics, "Our Curriculum"],
  ["academics/early-years", EarlyYears, "The British Early Years Foundation Stage"],
  ["academics/primary", Primary, "The Cambridge curriculum"],
  ["admissions", Admissions, "Begin your child's journey"],
  ["student-life", StudentLife, "Life at Kedland"],
  ["news", News, "News & Stars in Action"],
  ["contact", Contact, "Get in touch"],
  ["faqs", Faqs, "Frequently asked questions"],
  ["privacy", Privacy, "Privacy Notice"],
];

describe("route shells", () => {
  it.each(ROUTES)("/%s renders its heading", (_route, Page, heading) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(heading);
  });

  it.each(ROUTES)("/%s offers a way to contact the school", (_route, Page) => {
    // Until the real content lands, every page must still lead somewhere useful.
    render(<Page />);
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute("href", "/contact");
  });

  it("only ever renders one h1 per page", () => {
    for (const [, Page] of ROUTES) {
      const { unmount } = render(<Page />);
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      unmount();
    }
  });
});

describe("PageShell", () => {
  it("shows the eyebrow, heading and intro it is given", () => {
    render(
      <PageShell
        eyebrow="ADMISSIONS"
        title="Enrol today"
        intro="We would love to meet you."
        coming={["Levels"]}
      />,
    );

    expect(screen.getByText("ADMISSIONS")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Enrol today");
    expect(screen.getByText("We would love to meet you.")).toBeInTheDocument();
  });

  it("lists what the finished page will contain", () => {
    render(<PageShell eyebrow="X" title="Y" intro="Z" coming={["Mission", "Vision", "Values"]} />);

    for (const item of ["Mission", "Vision", "Values"]) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <PageShell eyebrow="ABOUT" title="About Kedland" intro="A community." coming={["Our Story"]} />,
    );
    const results = await axe.run(container, { rules: { region: { enabled: false } } });

    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
