import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AcademicsOverview,
  EarlyYearsExperience,
  PrimaryExperience,
} from "./academics/academics-experiences";
import { AdmissionsExperience } from "./admissions/admissions-experience";
import { ContactExperience } from "./contact/contact-experience";
import { StudentLifeExperience } from "./student-life/student-life-experience";

/**
 * The per-page experience components.
 *
 * Tested against their *contract* rather than their copy: each takes CMS
 * sections and falls back to a built-in default when a section is missing. So
 * these assert the two branches — renders what it is given, and stands up
 * without it — and deliberately do not assert particular sentences, which
 * belong to the CMS and to whoever is still shaping these layouts.
 *
 * The `undefined` cases are the ones that matter. They are what a visitor sees
 * when the API is unreachable, and a page that renders nothing at all in that
 * situation is worse than one showing last term's wording.
 */

describe("every page experience stands up with no CMS data at all", () => {
  it.each([
    ["Academics overview", () => <AcademicsOverview intro={undefined} routes={undefined} cta={undefined} />],
    ["Early Years", () => <EarlyYearsExperience intro={undefined} cta={undefined} />],
    ["Primary", () => <PrimaryExperience intro={undefined} cta={undefined} />],
    [
      "Admissions",
      () => (
        <AdmissionsExperience
          hero={undefined}
          levels={undefined}
          steps={undefined}
          download={undefined}
          fees={undefined}
          cta={undefined}
        />
      ),
    ],
    [
      "Student Life",
      () => (
        <StudentLifeExperience
          intro={undefined}
          day={undefined}
          clubs={undefined}
          arts={undefined}
          care={undefined}
          safeguarding={undefined}
          cta={undefined}
        />
      ),
    ],
  ])("%s renders a heading and some content", (_name, renderComponent) => {
    const { container } = render(renderComponent());

    expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
    expect(container.textContent.trim().length).toBeGreaterThan(50);
  });

  /**
   * One h1 per page, wherever the content came from. Two is an ambiguous
   * outline, and the outline is how a screen-reader user navigates.
   */
  it.each([
    ["Early Years", () => <EarlyYearsExperience intro={undefined} cta={undefined} />],
    ["Primary", () => <PrimaryExperience intro={undefined} cta={undefined} />],
    [
      "Student Life",
      () => (
        <StudentLifeExperience
          intro={undefined}
          day={undefined}
          clubs={undefined}
          arts={undefined}
          care={undefined}
          safeguarding={undefined}
          cta={undefined}
        />
      ),
    ],
  ])("%s has exactly one h1", (_name, renderComponent) => {
    render(renderComponent());
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("gives every Early Years and Primary learning card a descriptive image", () => {
    const { unmount } = render(<EarlyYearsExperience intro={undefined} cta={undefined} />);

    expect(screen.getAllByRole("img", { name: /learning materials for/i })).toHaveLength(7);
    unmount();

    render(<PrimaryExperience intro={undefined} cta={undefined} />);
    expect(screen.getAllByRole("img", { name: /learning materials for/i })).toHaveLength(9);
  });

  it("gives every moment in a Kedland day a descriptive image", () => {
    render(
      <StudentLifeExperience
        intro={undefined}
        day={undefined}
        clubs={undefined}
        arts={undefined}
        care={undefined}
        safeguarding={undefined}
        cta={undefined}
      />,
    );

    expect(screen.getAllByRole("img", { name: /a still life representing/i })).toHaveLength(7);
  });
});

describe("when the CMS does supply content", () => {
  it("Early Years shows the CMS eyebrow and standfirst", () => {
    render(
      <EarlyYearsExperience
        intro={{ eyebrow: "FROM THE CMS", heading: "A heading from Mongo", standfirst: "Also from the CMS." }}
        cta={undefined}
      />,
    );

    expect(screen.getByText("FROM THE CMS")).toBeInTheDocument();
    expect(screen.getByText("Also from the CMS.")).toBeInTheDocument();
  });

  it("Contact shows the CMS eyebrow, standfirst and form heading", () => {
    render(
      <ContactExperience
        intro={{ eyebrow: "FROM THE CMS", heading: "Talk to us", standfirst: "We answer quickly." }}
        details={{
          heading: "Come and see us",
          body: "We are in Lashibi.",
          formHeading: "Send a message",
          mapHeading: "Find us",
        }}
      />,
    );

    expect(screen.getByText("FROM THE CMS")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Send a message" })).toBeInTheDocument();
  });

  /**
   * Records a gap rather than asserting it is fine.
   *
   * These layouts hardcode their `h1` and never read `intro.heading`, so the
   * single most prominent line on the page is the one thing an editor cannot
   * change from the dashboard. That contradicts the CMS guardrail every other
   * page follows (agent_plan §0.2). Pinned here so the day someone wires it up,
   * this test fails and gets deleted — rather than the gap going unnoticed.
   */
  it("does not yet use the CMS heading for the page h1 — known gap", () => {
    render(
      <EarlyYearsExperience
        intro={{ eyebrow: "E", heading: "A heading from Mongo", standfirst: "S" }}
        cta={undefined}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).not.toHaveTextContent("A heading from Mongo");
  });

  it("Student Life shows the CMS timeline rather than the fallback", () => {
    render(
      <StudentLifeExperience
        intro={undefined}
        day={{
          heading: "A day from the CMS",
          intro: "Written in the dashboard.",
          moments: [
            { icon: "sun", title: "A CMS moment", body: "Body." },
            { icon: "book", title: "Another", body: "Body." },
            { icon: "ball", title: "A third", body: "Body." },
            { icon: "home", title: "A fourth", body: "Body." },
          ],
        }}
        clubs={undefined}
        arts={undefined}
        care={undefined}
        safeguarding={undefined}
        cta={undefined}
      />,
    );

    expect(screen.getByText("A CMS moment")).toBeInTheDocument();
  });
});
