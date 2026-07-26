import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { toFormSpec } from "@kedland/types/content";

import { SectionForm } from "./section-form";

/**
 * The form an editor actually uses.
 *
 * The thing worth protecting here is not the markup but the contract: whatever
 * the person types has to arrive at the server action as valid JSON for the
 * section's schema. Everything else — which control appears, what it is called —
 * is derived and tested in `form-spec.spec.ts`. These tests are about the round
 * trip, and about the list bounds, which are the one place the form makes a
 * decision of its own.
 */

const MEDIA = [{ value: "hero-1", label: "A sunlit reading corner" }];

/** The `data` field, which is the only thing the form submits. */
function submitted(container: HTMLElement): Record<string, unknown> {
  const input = container.querySelector<HTMLInputElement>('input[name="data"]');
  return JSON.parse(input?.value ?? "{}") as Record<string, unknown>;
}

function renderHero(value: Record<string, unknown>) {
  return render(
    <SectionForm
      page="home"
      sectionKey="hero"
      sectionType="hero"
      spec={toFormSpec("hero")}
      value={value}
      mediaOptions={MEDIA}
      action={vi.fn()}
      submitClassName="btn"
    />,
  );
}

const HERO = {
  eyebrow: "THE FUTURE BEGINS HERE",
  heading: "Where little Stars learn, play, and shine.",
  subheading: "A warm, British-curriculum school in Lashibi-Tema.",
  primaryCta: { label: "Enrol Now", href: "/admissions" },
  secondaryCta: { label: "Book a Tour", href: "/contact" },
  image: { mediaId: "hero-1", alt: "Happy young pupils" },
  trustChips: ["British curriculum", "Small classes", "Warm staff", "Safe campus"],
};

describe("SectionForm", () => {
  it("shows the stored values in their controls", () => {
    renderHero(HERO);

    expect(screen.getByLabelText("Heading")).toHaveValue(HERO.heading);
    expect(screen.getByLabelText("Opening paragraph")).toHaveValue(HERO.subheading);
  });

  it("posts the section as JSON, not as separate fields", () => {
    const { container } = renderHero(HERO);

    // The server action validates one `data` field against the schema. Splitting
    // this into named inputs would mean reassembling it there, and a second place
    // that decides what the shape is.
    expect(container.querySelectorAll('input[name="data"]')).toHaveLength(1);
    expect(submitted(container)).toEqual(HERO);
  });

  it("carries the page and section key so the action knows what it is saving", () => {
    const { container } = renderHero(HERO);

    expect(container.querySelector('input[name="page"]')).toHaveValue("home");
    expect(container.querySelector('input[name="key"]')).toHaveValue("hero");
  });

  it("puts an edit into the submitted JSON", async () => {
    const { container } = renderHero(HERO);

    await userEvent.clear(screen.getByLabelText("Heading"));
    await userEvent.type(screen.getByLabelText("Heading"), "Known by name");

    expect(submitted(container)["heading"]).toBe("Known by name");
  });

  /** A nested value must not flatten, or the schema rejects the whole section. */
  it("keeps a button's label and target nested under the button", async () => {
    const { container } = renderHero(HERO);

    const button = screen.getByRole("group", { name: "Main button" });
    await userEvent.clear(within(button).getByLabelText("Label"));
    await userEvent.type(within(button).getByLabelText("Label"), "Apply");

    expect(submitted(container)["primaryCta"]).toEqual({ label: "Apply", href: "/admissions" });
  });

  /**
   * Arrays have to stay arrays. Spreading one into an object gives `{0: …, 1: …}`,
   * which passes a shape check and then fails the schema in a way that reads like
   * the data is corrupt.
   */
  it("keeps a list a list when one of its items changes", async () => {
    const { container } = renderHero(HERO);

    await userEvent.clear(screen.getByLabelText("Reassurance badges 2"));
    await userEvent.type(screen.getByLabelText("Reassurance badges 2"), "Tiny classes");

    const chips = submitted(container)["trustChips"];
    expect(Array.isArray(chips)).toBe(true);
    expect(chips).toEqual(["British curriculum", "Tiny classes", "Warm staff", "Safe campus"]);
  });

  it("offers no way to add or remove a fixed-length list", () => {
    renderHero(HERO);

    // Exactly four, because they sit in one row. An add button here would only
    // ever produce a validation error.
    expect(screen.queryByRole("button", { name: /add another/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });
});

describe("a list with room to grow", () => {
  const FACILITIES = {
    heading: "Our facilities",
    intro: "Rooms built for small children.",
    items: [
      { icon: "star", label: "Library" },
      { icon: "star", label: "Playground" },
      { icon: "star", label: "Art room" },
    ],
  };

  const renderGrid = () =>
    render(
      <SectionForm
        page="about/facilities"
        sectionKey="facilities"
        sectionType="feature-grid"
        spec={toFormSpec("feature-grid")}
        value={FACILITIES}
        mediaOptions={MEDIA}
        action={vi.fn()}
        submitClassName="btn"
      />,
    );

  it("says how many there are and what the limits are", () => {
    renderGrid();
    // Three of 3–12: an editor should not have to save to discover the ceiling.
    expect(screen.getByText(/3 of 3–12/)).toBeInTheDocument();
  });

  it("adds an item, and the new one reaches the submitted JSON", async () => {
    const { container } = renderGrid();

    await userEvent.click(screen.getByRole("button", { name: /add another/i }));

    const items = submitted(container)["items"] as unknown[];
    expect(items).toHaveLength(4);
    // Seeded rather than empty: `icon` is patterned, and "" fails its rule.
    expect(items[3]).toEqual({ icon: "star", label: "" });
  });

  /**
   * Disabled rather than hidden at the minimum. A control that vanishes leaves
   * someone wondering whether they imagined it.
   */
  it("disables remove at the minimum instead of hiding it", () => {
    renderGrid();
    const removes = screen.getAllByRole("button", { name: /remove/i });

    expect(removes).toHaveLength(3);
    for (const button of removes) expect(button).toBeDisabled();
  });

  it("enables remove once there is one to spare", async () => {
    renderGrid();
    await userEvent.click(screen.getByRole("button", { name: /add another/i }));

    expect(screen.getAllByRole("button", { name: /remove/i })[0]).toBeEnabled();
  });

  it("removes the row that was clicked, not the last one", async () => {
    const { container } = renderGrid();
    await userEvent.click(screen.getByRole("button", { name: /add another/i }));
    await userEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]!);

    const items = submitted(container)["items"] as { label: string }[];
    expect(items.map((item) => item.label)).toEqual(["Playground", "Art room", ""]);
  });
});

describe("blank sections", () => {
  it("renders controls for a section that has never been filled in", () => {
    render(
      <SectionForm
        page="home"
        sectionKey="hero"
        sectionType="hero"
        spec={toFormSpec("hero")}
        value={{}}
        mediaOptions={MEDIA}
        action={vi.fn()}
        submitClassName="btn"
      />,
    );

    expect(screen.getByLabelText("Heading")).toHaveValue("");
  });

  it("says so when there are no approved images to choose from", () => {
    render(
      <SectionForm
        page="home"
        sectionKey="hero"
        sectionType="hero"
        spec={toFormSpec("hero")}
        value={HERO}
        mediaOptions={[]}
        action={vi.fn()}
        submitClassName="btn"
      />,
    );

    expect(screen.getByText(/no approved images yet/i)).toBeInTheDocument();
  });

  /** Without a site URL there is nothing to preview against, so it is omitted. */
  it("omits the preview when the site address is not configured", () => {
    render(
      <SectionForm
        page="home"
        sectionKey="hero"
        sectionType="hero"
        spec={toFormSpec("hero")}
        value={HERO}
        mediaOptions={MEDIA}
        action={vi.fn()}
        submitClassName="btn"
      />,
    );

    expect(screen.queryByTitle(/preview of/i)).not.toBeInTheDocument();
  });
});
