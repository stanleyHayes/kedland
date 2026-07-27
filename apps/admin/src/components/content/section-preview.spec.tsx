import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SectionPreview } from "./section-preview";

/**
 * The dashboard half of the preview contract.
 *
 * The frame is the public site's origin, so the dashboard's theme has to cross
 * as data: in the frame's URL for its first paint, and in every posted draft
 * so a toggle while the editor is open reaches the frame. The draft itself is
 * posted on a debounce, which these tests simply wait out.
 */

const SITE = "http://localhost:3101";

function renderPreview() {
  return render(
    <SectionPreview
      siteUrl={SITE}
      sectionKey="letter"
      sectionType="letter"
      draft={{ heading: "A warm welcome" }}
      admissionFormAvailable={false}
    />,
  );
}

function frameReady(): void {
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", { data: { kind: "kedland-preview-ready" }, origin: SITE }),
    );
  });
}

/** The draft most recently posted into the frame. */
function lastDraft(postMessage: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const calls = postMessage.mock.calls;
  return calls.at(-1)?.[0] as Record<string, unknown>;
}

describe("SectionPreview theme", () => {
  afterEach(() => {
    delete document.documentElement.dataset["adminTheme"];
    vi.restoreAllMocks();
  });

  it("appends the dashboard's theme to the frame's URL", async () => {
    document.documentElement.dataset["adminTheme"] = "dark";
    renderPreview();
    const frame = await screen.findByTitle("Preview of letter");
    expect(frame.getAttribute("src")).toContain("theme=dark");
  });

  it("carries the theme in every posted draft, following a toggle", async () => {
    document.documentElement.dataset["adminTheme"] = "dark";
    renderPreview();
    const frame = await screen.findByTitle<HTMLIFrameElement>("Preview of letter");
    const postMessage = vi.fn();
    Object.defineProperty(frame, "contentWindow", { configurable: true, value: { postMessage } });

    frameReady();
    await waitFor(
      () => {
        expect(postMessage).toHaveBeenCalled();
      },
      { timeout: 2_000 },
    );
    expect(lastDraft(postMessage)).toMatchObject({ kind: "kedland-preview", theme: "dark" });
    expect(postMessage.mock.calls.at(-1)?.[1]).toBe(SITE);

    act(() => {
      document.documentElement.dataset["adminTheme"] = "light";
    });
    await waitFor(
      () => {
        expect(lastDraft(postMessage)).toMatchObject({ theme: "light" });
      },
      { timeout: 2_000 },
    );
  });
});
