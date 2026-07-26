import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Reveal } from "./reveal";

/** A controllable IntersectionObserver, since jsdom ships none. */
function stubObserver() {
  const instances: { trigger: (isIntersecting: boolean) => void; disconnect: () => void }[] = [];

  class Stub {
    private readonly callback: IntersectionObserverCallback;
    readonly disconnect = vi.fn();

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      instances.push({
        trigger: (isIntersecting) => {
          this.callback([{ isIntersecting } as IntersectionObserverEntry], this as never);
        },
        disconnect: this.disconnect,
      });
    }

    observe = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn(() => []);
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [];
  }

  vi.stubGlobal("IntersectionObserver", Stub);
  return instances;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("starts hidden and reveals when scrolled into view", () => {
    const observers = stubObserver();
    const { container } = render(<Reveal>Content</Reveal>);

    expect(container.firstElementChild).toHaveAttribute("data-visible", "false");

    act(() => {
      observers[0]?.trigger(true);
    });
    expect(container.firstElementChild).toHaveAttribute("data-visible", "true");
  });

  /**
   * Content that fades out again on the way back up turns re-reading a
   * paragraph into a fight with the page.
   */
  it("stays revealed once it has appeared", () => {
    const observers = stubObserver();
    const { container } = render(<Reveal>Content</Reveal>);

    act(() => {
      observers[0]?.trigger(true);
      observers[0]?.trigger(false);
    });

    expect(container.firstElementChild).toHaveAttribute("data-visible", "true");
  });

  it("stops observing once it has revealed", () => {
    const observers = stubObserver();
    render(<Reveal>Content</Reveal>);

    act(() => {
      observers[0]?.trigger(true);
    });
    expect(observers[0]?.disconnect).toHaveBeenCalled();
  });

  /**
   * The failure direction that matters. An effect whose job is to hide content
   * must fail towards showing it — otherwise a browser without the API, or a
   * script that never runs, leaves the whole site blank.
   */
  it("shows the content outright when the browser has no IntersectionObserver", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    const { container } = render(<Reveal>Content</Reveal>);

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute("data-visible", "true");
    });
  });

  it("renders its children regardless", () => {
    stubObserver();
    render(<Reveal>Something a parent should read</Reveal>);

    expect(screen.getByText("Something a parent should read")).toBeInTheDocument();
  });

  it("applies a stagger delay only when asked for one", () => {
    stubObserver();
    const { container: without } = render(<Reveal>A</Reveal>);
    const { container: with_ } = render(<Reveal delay={120}>B</Reveal>);

    expect(without.firstElementChild).not.toHaveStyle({ transitionDelay: "0ms" });
    expect(with_.firstElementChild).toHaveStyle({ transitionDelay: "120ms" });
  });
});
