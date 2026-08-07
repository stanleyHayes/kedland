import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CoverImageField } from "./cover-image-field";

const OPTIONS = [
  { value: "kedland/reading-corner", label: "A sunlit reading corner", imageUrl: "https://cdn.test/a.jpg" },
  { value: "kedland/play-garden", label: "A green play garden", imageUrl: "https://cdn.test/b.jpg" },
];

/** The submitted value, read the way the server action reads it. */
function submitted(container: HTMLElement, name: string): string | null {
  const form = container.querySelector("form");
  if (!form) throw new Error("no form");
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value : null;
}

function renderInForm(ui: React.ReactNode) {
  return render(<form>{ui}</form>);
}

describe("CoverImageField", () => {
  /**
   * The library being empty is not an error state, and must not render a picker
   * with a single "no image" tile that looks like a broken list.
   */
  it("explains where images come from when the library is empty", () => {
    renderInForm(<CoverImageField idPrefix="new" options={[]} />);

    expect(screen.getByText(/Upload one in Media library/i)).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  /** A new draft starts with no header image, and asks for no alt text. */
  it("defaults to no header image", () => {
    const { container } = renderInForm(<CoverImageField idPrefix="new" options={OPTIONS} />);

    expect(screen.getByRole("radio", { name: /No header image/i })).toBeChecked();
    expect(submitted(container, "coverMediaId")).toBe("");
    expect(screen.queryByLabelText(/Describe the header image/i)).not.toBeInTheDocument();
  });

  /**
   * Choosing an image must submit the value the public site can resolve, and
   * must not leave the required alt text for the editor to discover after the
   * API has already refused the save.
   */
  it("submits the chosen image and prefills its description", async () => {
    const user = userEvent.setup();
    const { container } = renderInForm(<CoverImageField idPrefix="new" options={OPTIONS} />);

    await user.click(screen.getByRole("radio", { name: /A green play garden/i }));

    expect(submitted(container, "coverMediaId")).toBe("kedland/play-garden");
    expect(submitted(container, "coverAlt")).toBe("A green play garden");
  });

  /** An editor's own words are about the article, and outrank the library's. */
  it("leaves a description the editor has written alone", async () => {
    const user = userEvent.setup();
    const { container } = renderInForm(
      <CoverImageField
        idPrefix="p1"
        options={OPTIONS}
        defaultMediaId="kedland/reading-corner"
        defaultAlt="Reception sharing books on Friday"
      />,
    );

    await user.click(screen.getByRole("radio", { name: /A green play garden/i }));

    expect(submitted(container, "coverAlt")).toBe("Reception sharing books on Friday");
  });

  /** Removing the cover is what makes the field an editor rather than an adder. */
  it("submits an empty id when the image is taken away", async () => {
    const user = userEvent.setup();
    const { container } = renderInForm(
      <CoverImageField idPrefix="p1" options={OPTIONS} defaultMediaId="kedland/reading-corner" />,
    );

    expect(submitted(container, "coverMediaId")).toBe("kedland/reading-corner");

    await user.click(screen.getByRole("radio", { name: /No header image/i }));

    expect(submitted(container, "coverMediaId")).toBe("");
    // No alt box to fill in for an image that is no longer there.
    expect(screen.queryByLabelText(/Describe the header image/i)).not.toBeInTheDocument();
  });
});
