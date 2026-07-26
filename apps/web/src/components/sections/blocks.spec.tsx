import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import { buildHero, buildIconCards, buildValuesTiles } from "@kedland/testing";

import {
  CtaBanner,
  Hero,
  IconCards,
  InstagramShowcase,
  LevelCards,
  PageIntro,
  ProseBand,
  ProseStrip,
  QuoteTeaser,
  ValuesTiles,
} from "./blocks";
import { canRender, RenderSections } from "./resolve";

/**
 * The section components, fed the same fixtures the API validates against.
 *
 * Using `@kedland/testing`'s factories rather than hand-written props is the
 * point: if a schema gains a field, these render against the real shape rather
 * than a stale approximation.
 */

const CTA = { label: "Enrol Now", href: "/admissions" };

describe("Hero", () => {
  it("carries the page's only h1", () => {
    render(<Hero data={buildHero()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Where little Stars learn, play, and shine.",
    );
  });

  it("shows both calls to action", () => {
    render(<Hero data={buildHero()} />);
    expect(screen.getByRole("link", { name: /enrol now/i })).toHaveAttribute("href", "/admissions");
    expect(screen.getByRole("link", { name: /book a tour/i })).toHaveAttribute("href", "/contact");
  });

  it("lists the trust chips", () => {
    render(<Hero data={buildHero()} />);
    expect(screen.getByText("Cambridge Primary")).toBeInTheDocument();
  });

  it("gives the hero image the alt text the schema requires", () => {
    render(<Hero data={buildHero()} />);
    expect(screen.getByAltText(/pupils playing together/i)).toBeInTheDocument();
  });

  it("raises the crest placeholder from the page canvas", () => {
    render(<Hero data={buildHero()} />);
    expect(screen.getByTestId("hero-crest-surface")).toHaveClass("neu-surface", "neu-interactive");
  });
});

describe("IconCards", () => {
  it("renders every card", () => {
    render(<IconCards data={buildIconCards()} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  });

  it("keeps the section heading above the cards", () => {
    render(<IconCards data={buildIconCards()} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Why little minds thrive");
  });
});

describe("ValuesTiles", () => {
  it("renders the seven values as a definition list", () => {
    // Each letter genuinely defines a value; that is what a screen reader
    // should hear, not seven unlabelled cards.
    const { container } = render(<ValuesTiles data={buildValuesTiles()} />);

    expect(container.querySelectorAll("dt")).toHaveLength(7);
    expect(container.querySelectorAll("dd")).toHaveLength(7);
  });

  it("spells KEDLAND down the tiles", () => {
    const { container } = render(<ValuesTiles data={buildValuesTiles()} />);
    const letters = [...container.querySelectorAll("dt span[aria-hidden='true']")].map(
      (el) => el.textContent,
    );

    expect(letters.join("")).toBe("KEDLAND");
  });

  it("uses dark raised tiles and raised colour badges", () => {
    const { container } = render(<ValuesTiles data={buildValuesTiles()} />);

    expect(container.querySelectorAll("dl > .neu-tile-dark")).toHaveLength(7);
    expect(container.querySelectorAll("dt .neu-colour-badge")).toHaveLength(7);
  });

  it("keeps the decorative letter out of the accessible name", () => {
    render(<ValuesTiles data={buildValuesTiles()} />);
    // "K Kindness" read aloud would be noise; the value's name is the content.
    expect(screen.getByText("Kindness")).toBeInTheDocument();
  });
});

describe("LevelCards", () => {
  const data = {
    heading: "Room to grow",
    levels: [
      { icon: "baby", name: "Daycare", blurb: "Gentle first steps." },
      { icon: "blocks", name: "Nursery 1", blurb: "Curious hands." },
      { icon: "book", name: "Primary 1–3", blurb: "Cambridge Primary." },
    ],
    cta: { label: "See admissions", href: "/admissions" },
  };

  it("lists each level", () => {
    render(<LevelCards data={data} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("links on to admissions", () => {
    render(<LevelCards data={data} />);
    expect(screen.getByRole("link", { name: /see admissions/i })).toHaveAttribute("href", "/admissions");
  });
});

describe("PageIntro", () => {
  it("renders the h1 and standfirst", () => {
    render(<PageIntro data={{ eyebrow: "ABOUT", heading: "About Kedland", standfirst: "A community." }} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("About Kedland");
    expect(screen.getByText("A community.")).toBeInTheDocument();
  });
});

describe("ProseStrip and ProseBand", () => {
  it("renders a prose strip with its link", () => {
    render(
      <ProseStrip
        data={{ heading: "Welcome", body: "Some words.", link: { label: "Read more", href: "/about" } }}
      />,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Welcome");
    expect(screen.getByRole("link", { name: /read more/i })).toHaveAttribute("href", "/about");
    expect(screen.getByTestId("prose-strip-surface")).toHaveClass("neu-surface");
  });

  it("renders a prose band with no link", () => {
    render(<ProseBand data={{ heading: "How Kedland began", body: "The story." }} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("How Kedland began");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("QuoteTeaser", () => {
  const data = {
    portrait: { mediaId: "logo", alt: "Kedland crest" },
    quote: "We foster a love for learning.",
    name: "Mary",
    role: "Principal",
    cta: { label: "Read the message", href: "/about/principal" },
  };

  it("renders the quote as a blockquote", () => {
    const { container } = render(<QuoteTeaser data={data} />);
    expect(container.querySelector("blockquote")).toHaveTextContent("We foster a love for learning.");
  });

  it("attributes it", () => {
    render(<QuoteTeaser data={data} />);
    expect(screen.getByText("Mary")).toBeInTheDocument();
  });

  it("raises the feature while recessing the portrait area", () => {
    const { container } = render(<QuoteTeaser data={data} />);

    expect(screen.getByTestId("principal-teaser-surface")).toHaveClass("neu-surface");
    expect(container.querySelector("[data-principal-photo]")).toHaveClass("neu-inset-panel");
  });
});

describe("InstagramShowcase", () => {
  const data = { heading: "Life at Kedland", handle: "@kedlandintlschool" };

  it("links out safely", () => {
    render(<InstagramShowcase data={data} />);
    const link = screen.getByRole("link", { name: /follow us on instagram/i });

    expect(link).toHaveAttribute("href", "https://www.instagram.com/kedlandintlschool");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });

  it("makes no request to Instagram — it is a link, not a feed", () => {
    // Build package §5.3: no Graph API, no tokens, no widget, no auto-sync.
    const { container } = render(<InstagramShowcase data={data} />);
    expect(container.querySelector("script, iframe")).toBeNull();
  });
});

describe("CtaBanner", () => {
  it("offers both routes onward", () => {
    render(
      <CtaBanner
        data={{
          heading: "Ready to begin?",
          body: "We would love to meet you.",
          primaryCta: CTA,
          secondaryCta: { label: "Book a Tour", href: "/contact" },
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /enrol now/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /book a tour/i })).toBeInTheDocument();
  });
});

describe("the section resolver", () => {
  it("knows the types it can render", () => {
    expect(canRender("hero")).toBe(true);
    expect(canRender("values-tiles")).toBe(true);
  });

  it("reports a type with no component yet", () => {
    expect(canRender("not-a-section-type")).toBe(false);
  });

  it("renders the sections it is given, in order", () => {
    render(
      <RenderSections
        sections={[
          { key: "hero", type: "hero", order: 0, data: buildHero() },
          {
            key: "why",
            type: "icon-cards",
            order: 1,
            data: buildIconCards(),
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("can place page-family navigation immediately before the closing section", () => {
    render(
      <RenderSections
        beforeLast={<nav aria-label="About pages">Explore About</nav>}
        sections={[
          {
            key: "intro",
            type: "page-intro",
            order: 0,
            data: { eyebrow: "ABOUT", heading: "About", standfirst: "Welcome." },
          },
          {
            key: "story",
            type: "prose-band",
            order: 1,
            data: { heading: "Story", body: "Once upon a time." },
          },
          {
            key: "closing",
            type: "prose-band",
            order: 2,
            data: { heading: "Closing", body: "Come and see us." },
          },
        ]}
      />,
    );

    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings).toEqual(["About", "Story", "Closing"]);
    expect(screen.getByRole("navigation", { name: "About pages" })).toBeInTheDocument();
  });

  it("skips a type it cannot render rather than throwing", () => {
    // During the build-out an unfinished block should quietly disappear, not
    // take the whole page down with it.
    render(
      <RenderSections
        sections={[
          { key: "hero", type: "hero", order: 0, data: buildHero() },
          { key: "mystery", type: "not-built-yet", order: 1, data: {} },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders nothing at all for an empty list", () => {
    const { container } = render(<RenderSections sections={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("section accessibility", () => {
  it.each([
    ["Hero", <Hero key="h" data={buildHero()} />],
    ["IconCards", <IconCards key="i" data={buildIconCards()} />],
    ["ValuesTiles", <ValuesTiles key="v" data={buildValuesTiles()} />],
  ])("%s has no axe violations", async (_name, element) => {
    const { container } = render(element);
    const results = await axe.run(container, { rules: { region: { enabled: false } } });

    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
