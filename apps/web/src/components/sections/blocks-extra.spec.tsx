import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getPage, validateSectionData, type PageKey } from "@kedland/types";

import {
  ChipsBand,
  ContactDetails,
  DownloadBlock,
  EyfsAreas,
  FaqIntro,
  FeatureGrid,
  Legal,
  Letter,
  MissionVision,
  NewsEmptyState,
  NewsIntro,
  Steps,
  SubjectsGrid,
  Timeline,
  Trio,
} from "./blocks-extra";
import { Measure, Shell } from "./shell";

/**
 * The remaining section components.
 *
 * `resolve.tsx` casts a section's `data` through `unknown`, because what the
 * API returns is only typed as `Record<string, unknown>`. That cast means
 * TypeScript cannot catch a component reading `data.subheading` when the schema
 * calls it `standfirst` — the field just renders as nothing, on a page that
 * still returns 200.
 *
 * So every fixture below is run through `validateSectionData` against the real
 * registry schema before it is rendered. A fixture that drifts from the schema
 * fails here rather than turning into a blank space on a live page.
 */

/**
 * Validates a fixture against the registry, then hands it back for rendering.
 *
 * Addressed by section *type* rather than by key: a key is a per-page name
 * ("day", "clubs", "arts") while the type is what picks the component, so the
 * type is what a component's test is actually about. The key is looked up
 * here, which also means renaming one does not break these tests.
 */
function fixture<T>(page: PageKey, type: string, data: T): T {
  const section = getPage(page)?.sections.find((candidate) => candidate.type === type);

  if (!section) {
    throw new Error(`The registry has no "${type}" section on page "${page}"`);
  }

  const result = validateSectionData(page, section.key, data);
  if (!result.success) {
    throw new Error(
      `Fixture for ${page}/${section.key} (${type}) does not match its schema:\n${result.error.message}`,
    );
  }
  return data;
}

describe("MissionVision", () => {
  const data = fixture("about/mission-vision-values", "mission-vision", {
    missionHeading: "Mission",
    mission: "To provide exceptional care to children.",
    visionHeading: "Vision",
    vision: "To encourage open minds and creative thinkers.",
    mottoHeading: "Motto",
    motto: "In God We Trust.",
    mottoBody: "Because we are raising creative thinkers.",
  });

  it("gives mission and vision equal billing as headings", () => {
    render(<MissionVision data={data} />);

    expect(screen.getByRole("heading", { name: "Mission" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vision" })).toBeInTheDocument();
  });

  it("shows the school's motto", () => {
    render(<MissionVision data={data} />);
    expect(screen.getByText("In God We Trust.")).toBeInTheDocument();
  });
});

describe("Letter", () => {
  const data = fixture("about/principal", "letter", {
    heading: "A message from our Principal",
    portrait: { mediaId: "principal", alt: "The Kedland crest" },
    body: "Welcome to Kedland.",
    signOff: "Warm regards,",
    name: "Mrs Mary Hayford",
    role: "Principal",
    cta: { label: "Come and see us", href: "/contact" },
  });

  it("carries the page's h1", () => {
    render(<Letter data={data} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A message from our Principal");
  });

  it("attributes the letter and links onward", () => {
    render(<Letter data={data} />);

    expect(screen.getByText("Mrs Mary Hayford")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /come and see us/i })).toHaveAttribute("href", "/contact");
  });

  it("uses the portrait label the schema requires rather than an empty one", () => {
    render(<Letter data={data} />);
    expect(screen.getByRole("img", { name: "The Kedland crest" })).toBeInTheDocument();
  });
});

describe("FeatureGrid", () => {
  const data = fixture("about/facilities", "feature-grid", {
    heading: "Our facilities",
    intro: "Purpose-built for little learners.",
    items: [
      { icon: "book", label: "Library" },
      { icon: "music", label: "Music room" },
      { icon: "ball", label: "Play area" },
    ],
  });

  it("lists every facility", () => {
    render(<FeatureGrid data={data} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("keeps the decorative star out of the accessible name", () => {
    const { container } = render(<FeatureGrid data={data} />);
    expect(container.querySelectorAll("svg[aria-hidden='true']").length).toBeGreaterThan(0);
  });
});

describe("EyfsAreas", () => {
  const data = fixture("academics/early-years", "eyfs-areas", {
    heading: "The seven areas of learning",
    intro: "Kedland uses an international curriculum.",
    areas: [
      { number: 1, title: "Communication and Language", body: "Rich opportunities to speak." },
      { number: 2, title: "Physical Development", body: "Coordination and control." },
      { number: 3, title: "Personal, Social and Emotional", body: "Social skills." },
      { number: 4, title: "Literacy", body: "Reading and writing." },
      { number: 5, title: "Understanding the World", body: "People and places." },
      { number: 6, title: "Expressive Arts and Design", body: "Media and materials." },
      { number: 7, title: "Mathematics", body: "Numbers and shapes." },
    ],
    assessmentHeading: "Assessment",
    assessment: "An EYFS profile is completed at the end of the early years.",
  });

  /**
   * Build package §4.3a is explicit that the seven areas must be real text,
   * not a picture of a honeycomb — otherwise neither a screen reader nor a
   * search engine can read the curriculum the school is judged on.
   */
  it("renders the seven areas as readable text in an ordered list", () => {
    const { container } = render(<EyfsAreas data={data} />);

    expect(container.querySelectorAll("ol > li")).toHaveLength(7);
    expect(screen.getByText("Communication and Language")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
  });

  it("keeps the area numbers decorative — the list already conveys order", () => {
    const { container } = render(<EyfsAreas data={data} />);
    const numbers = [...container.querySelectorAll("li span[aria-hidden='true']")].map(
      (el) => el.textContent,
    );

    expect(numbers).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  });

  it("shows how progress is assessed", () => {
    render(<EyfsAreas data={data} />);
    expect(screen.getByRole("heading", { name: "Assessment" })).toBeInTheDocument();
  });
});

describe("SubjectsGrid", () => {
  const data = fixture("academics/primary", "subjects-grid", {
    heading: "What our Stars learn",
    intro: "A broad and balanced curriculum.",
    subjects: [
      { icon: "abc", title: "English", body: "Reading, writing and speaking." },
      { icon: "sum", title: "Mathematics", body: "Number and reasoning." },
      { icon: "flask", title: "Science", body: "Curiosity about the world." },
      { icon: "globe", title: "Humanities", body: "People, places and the past." },
    ],
  });

  it("lists every subject", () => {
    render(<SubjectsGrid data={data} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("names each subject as a heading", () => {
    render(<SubjectsGrid data={data} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  });
});

describe("Steps", () => {
  const data = fixture("admissions", "steps", {
    heading: "How to enrol — 4 simple steps",
    steps: [
      { title: "Download & complete the form", body: "Grab the admission form." },
      { title: "Send it back or bring it in", body: "Return the completed form." },
      { title: "Visit us", body: "Book a tour." },
      { title: "Welcome to Kedland!", body: "Receive your offer." },
    ],
  });

  it("numbers the steps in order", () => {
    const { container } = render(<Steps data={data} />);
    const numbers = [...container.querySelectorAll("li span[aria-hidden='true']")].map(
      (el) => el.textContent,
    );

    expect(numbers).toEqual(["1", "2", "3", "4"]);
  });

  it("renders them as an ordered list, so the sequence survives without CSS", () => {
    const { container } = render(<Steps data={data} />);
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
  });
});

describe("DownloadBlock", () => {
  const data = fixture("admissions", "download-block", {
    heading: "Download the Kedland admission form",
    body: "Complete it at home and return it to the school office.",
    buttonLabel: "Download the Admission Form (PDF)",
    note: "Prefer to talk first? Contact us.",
  });

  /**
   * Build package §5.2: the form is a static download. If this ever becomes a
   * submitting form, the school starts receiving children's data through a
   * route nobody designed for it.
   */
  it("offers the form as a download and not as a submitting form", () => {
    const { container } = render(<DownloadBlock data={data} available />);
    const link = screen.getByRole("link", { name: /download the admission form/i });

    expect(link).toHaveAttribute("download");
    expect(link.getAttribute("href")).toMatch(/\.pdf$/);
    expect(container.querySelector("form")).toBeNull();
  });

  /**
   * The school has not supplied the PDF yet. Shipping the button anyway would
   * put a 404 behind the main admissions call to action, so it falls back to
   * the route that always works.
   */
  it("sends people to the office instead of 404ing when the PDF is not there", () => {
    render(<DownloadBlock data={data} />);

    expect(screen.queryByRole("link", { name: /download the admission form/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ask us for the admission form/i })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});

describe("Timeline", () => {
  const data = fixture("student-life", "timeline", {
    heading: "A day in the life of a Star",
    intro: "Everything we do is centred on our Stars.",
    moments: [
      { icon: "sun", title: "Warm welcome", body: "Every child is greeted by name." },
      { icon: "book", title: "Circle & story time", body: "We gather to share news." },
      { icon: "ball", title: "Snack & outdoor play", body: "Healthy snacks and active play." },
      { icon: "home", title: "Home time", body: "A safe, orderly pickup." },
    ],
  });

  it("renders the day as an ordered list of moments", () => {
    const { container } = render(<Timeline data={data} />);

    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
    expect(screen.getByText("Warm welcome")).toBeInTheDocument();
  });
});

describe("ChipsBand", () => {
  const data = fixture("student-life", "chips-band", {
    heading: "Beyond the classroom",
    body: "We encourage every Star to explore.",
    chips: ["Sports & games", "Art & craft", "Music"],
  });

  it("lists each activity", () => {
    render(<ChipsBand data={data} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Art & craft")).toBeInTheDocument();
  });
});

describe("Trio", () => {
  const data = fixture("student-life", "trio", {
    heading: "Arts, music & sport",
    cards: [
      { icon: "art", title: "Art & design", body: "A rich environment for creativity." },
      { icon: "music", title: "Music", body: "A well-furnished music room." },
      { icon: "ball", title: "Active play & sport", body: "Plenty of room to run." },
    ],
  });

  it("renders all three cards", () => {
    render(<Trio data={data} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});

describe("ContactDetails", () => {
  const data = fixture("contact", "contact-details", {
    heading: "Get in touch",
    body: "We would love to hear from you.",
    formHeading: "Send us a message",
    mapHeading: "Find us",
  });

  /**
   * The enquiry form arrives in Phase 5. Until then this page must still give
   * a parent a way to reach the school — a contact page with no contact
   * details is worse than no page.
   */
  it("gives every phone number as a dialable link", () => {
    render(<ContactDetails data={data} />);
    const phones = screen.getAllByRole("link", { name: /\+233/ });

    expect(phones).toHaveLength(3);
    expect(phones[0]).toHaveAttribute("href", "tel:+233257130333");
  });

  it("marks the school's address up as an address", () => {
    const { container } = render(<ContactDetails data={data} />);
    expect(container.querySelector("address")).toHaveTextContent("Lashibi-Tema");
  });

  /**
   * A link out rather than an embedded map: an iframe would load Google's
   * scripts and cookies onto a page a parent visits before agreeing to
   * anything, for a map most people open in their phone's app anyway.
   */
  it("links out for directions instead of embedding a third-party map", () => {
    const { container } = render(<ContactDetails data={data} />);
    const directions = screen.getByRole("link", { name: /get directions/i });

    expect(directions.getAttribute("href")).toContain("google.com/maps");
    expect(directions).toHaveAttribute("target", "_blank");
    expect(container.querySelector("iframe")).toBeNull();
  });

  /**
   * A caption, not a heading, and that is the redesign's point: the label used
   * to outweigh the address underneath it. It is still the CMS's words.
   */
  it("uses the CMS's own words to label the location block", () => {
    render(<ContactDetails data={data} />);
    expect(screen.getByText(data.mapHeading)).toBeInTheDocument();
  });

  it("gives the phone number more weight than the label above it", () => {
    // The thing a parent came for should not be the quietest text on the card.
    render(<ContactDetails data={data} />);
    const primary = screen.getAllByRole("link", { name: /\+233/ })[0];

    expect(primary?.className).toContain("text-h3");
  });
});

describe("FaqIntro", () => {
  const data = fixture("faqs", "faq-intro", {
    heading: "Frequently asked questions",
    body: "The things parents ask us most.",
    closingHeading: "Still have a question?",
    closingCta: { label: "Contact us", href: "/contact" },
  });

  it("ends with a route onward for anything unanswered", () => {
    render(<FaqIntro data={data} />);
    expect(screen.getByRole("link", { name: /contact us/i })).toHaveAttribute("href", "/contact");
  });
});

describe("NewsIntro", () => {
  const data = fixture("news", "news-intro", {
    heading: "News & Events",
    body: "What is happening at Kedland.",
    emptyStateHeading: "Our first story is on its way",
    emptyStateBody: "Follow us on Instagram in the meantime.",
  });

  it("carries the page's h1", () => {
    render(<NewsIntro data={data} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("News & Events");
  });

  /**
   * The regression this exists for: the intro used to render the empty state
   * itself, which it cannot do correctly because it has no idea whether any
   * posts exist. The live page announced "our first story is on its way"
   * directly above a list of published stories.
   */
  it("does not claim there are no posts — it cannot know", () => {
    render(<NewsIntro data={data} />);

    expect(screen.queryByText(data.emptyStateHeading)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /instagram/i })).not.toBeInTheDocument();
  });
});

describe("NewsEmptyState", () => {
  it("shows the CMS's own copy, so the words stay editable", () => {
    render(<NewsEmptyState heading="Nothing yet" body="Check back soon." />);

    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
    expect(screen.getByText("Check back soon.")).toBeInTheDocument();
  });

  it("links out to Instagram safely", () => {
    render(<NewsEmptyState heading="Nothing yet" body="Check back soon." />);
    const link = screen.getByRole("link", { name: /follow us on instagram/i });

    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });
});

describe("Legal", () => {
  const data = fixture("privacy", "legal", {
    heading: "Privacy Policy",
    body: "How we handle your information.",
    lastUpdated: "January 2026",
  });

  it("says when the policy last changed", () => {
    render(<Legal data={data} />);
    expect(screen.getByText(/January 2026/)).toBeInTheDocument();
  });
});

describe("Shell and Measure", () => {
  it("puts children on the rail", () => {
    const { container } = render(
      <Shell>
        <p>On the rail</p>
      </Shell>,
    );

    expect(container.querySelector(".mx-auto")).toHaveClass("max-w-6xl");
  });

  it("varies vertical rhythm without touching the rail width", () => {
    const { container } = render(
      <Shell space="loose">
        <p>Loose</p>
      </Shell>,
    );

    expect(container.querySelector("section")).toHaveClass("py-14");
    expect(container.querySelector(".mx-auto")).toHaveClass("max-w-6xl");
  });

  it("left-aligns a narrow measure rather than re-centring it", () => {
    // Centring a 3xl column inside a 6xl rail is the misalignment `Shell`
    // exists to remove, so `Measure` must never carry `mx-auto`.
    const { container } = render(
      <Measure>
        <p>Prose</p>
      </Measure>,
    );
    const measure = container.firstElementChild;

    expect(measure).toHaveClass("max-w-3xl");
    expect(measure).not.toHaveClass("mx-auto");
  });

  it("offers a wider measure for stacked cards", () => {
    const { container } = render(
      <Measure size="wide">
        <p>Cards</p>
      </Measure>,
    );

    expect(container.firstElementChild).toHaveClass("max-w-4xl");
  });
});
