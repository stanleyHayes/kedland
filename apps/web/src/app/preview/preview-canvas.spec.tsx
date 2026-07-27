import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PreviewCanvas } from "./preview-canvas";

/**
 * The theme half of the preview contract.
 *
 * The frame cannot read the dashboard's localStorage — they are different
 * origins — so the theme arrives as data: in the URL for the first paint and
 * in every draft after that. These tests pin both paths, and that nothing
 * else gets to set it.
 */

const ORIGIN = "http://localhost:3101";

function draftMessage(theme?: unknown): Record<string, unknown> {
  return {
    kind: "kedland-preview",
    section: { key: "hero", type: "not-a-real-type", data: {} },
    ...(theme === undefined ? {} : { theme }),
  };
}

function post(data: unknown, origin = ORIGIN): void {
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data, origin }));
  });
}

describe("PreviewCanvas theme", () => {
  afterEach(() => {
    delete document.documentElement.dataset["theme"];
  });

  it("applies the URL's theme before announcing itself", () => {
    render(<PreviewCanvas allowedOrigin={ORIGIN} initialTheme="dark" />);
    expect(document.documentElement.dataset["theme"]).toBe("dark");
  });

  it("leaves the theme alone when the URL does not carry one", () => {
    document.documentElement.dataset["theme"] = "light";
    render(<PreviewCanvas allowedOrigin={ORIGIN} />);
    expect(document.documentElement.dataset["theme"]).toBe("light");
  });

  it("applies the theme carried by a draft", () => {
    render(<PreviewCanvas allowedOrigin={ORIGIN} initialTheme="dark" />);
    post(draftMessage("light"));
    expect(document.documentElement.dataset["theme"]).toBe("light");
  });

  it("ignores a theme that is not dark or light", () => {
    render(<PreviewCanvas allowedOrigin={ORIGIN} initialTheme="dark" />);
    post(draftMessage("solarized"));
    expect(document.documentElement.dataset["theme"]).toBe("dark");
  });

  it("ignores drafts from any other origin", () => {
    render(<PreviewCanvas allowedOrigin={ORIGIN} initialTheme="dark" />);
    post(draftMessage("light"), "https://example.invalid");
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    expect(screen.getByText(/Start typing/)).toBeInTheDocument();
  });
});
