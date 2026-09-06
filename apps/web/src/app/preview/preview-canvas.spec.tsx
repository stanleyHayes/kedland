import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PreviewCanvas } from "./preview-canvas";

/**
 * The preview contract.
 *
 * This used to be mostly about theme — the frame cannot read the dashboard's
 * localStorage, so a dark/light choice arrived as data and was applied to
 * `<html>`. The public site is light-only now, so that half of the contract is
 * gone and the dashboard's `theme` is simply ignored.
 *
 * What is left is the half that matters most: the frame accepts drafts from the
 * dashboard's origin and from nowhere else. An unchecked `message` handler would
 * take a draft from any page that managed to frame this one.
 */

const ORIGIN = "http://localhost:3101";

function draftMessage(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: "kedland-preview",
    section: { key: "hero", type: "not-a-real-type", data: {} },
    ...extra,
  };
}

function post(data: unknown, origin = ORIGIN): void {
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data, origin }));
  });
}

describe("PreviewCanvas", () => {
  it("renders a draft posted from the dashboard's origin", () => {
    render(<PreviewCanvas allowedOrigin={ORIGIN} />);
    post(draftMessage());

    // Reaching the "no preview for this type" branch proves the draft was
    // accepted; the placeholder below would still be showing if it were not.
    expect(screen.getByText(/no preview for/)).toBeInTheDocument();
  });

  it("ignores drafts from any other origin", () => {
    render(<PreviewCanvas allowedOrigin={ORIGIN} />);
    post(draftMessage(), "https://example.invalid");

    expect(screen.getByText(/Start typing/)).toBeInTheDocument();
  });

  it("ignores a message that is not a preview draft", () => {
    render(<PreviewCanvas allowedOrigin={ORIGIN} />);
    post({ kind: "something-else", section: { type: "hero", data: {} } });

    expect(screen.getByText(/Start typing/)).toBeInTheDocument();
  });

  it("still accepts a draft that carries the dashboard's now-ignored theme", () => {
    render(<PreviewCanvas allowedOrigin={ORIGIN} />);
    post(draftMessage({ theme: "dark" }));

    expect(screen.getByText(/no preview for/)).toBeInTheDocument();
    expect(document.documentElement.dataset["theme"]).toBeUndefined();
  });
});
