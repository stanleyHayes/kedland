import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle";

const defaultMatchMedia = window.matchMedia;
const defaultStartViewTransition = document.startViewTransition;

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.dataset["theme"] = "light";
  });

  afterEach(() => {
    if (typeof defaultStartViewTransition === "function") {
      Object.defineProperty(document, "startViewTransition", {
        configurable: true,
        value: defaultStartViewTransition,
      });
    } else {
      Reflect.deleteProperty(document, "startViewTransition");
    }
    delete document.documentElement.dataset["themeTransition"];
    window.matchMedia = defaultMatchMedia;
    document.querySelectorAll(".theme-reveal-fallback").forEach((overlay) => {
      overlay.remove();
    });
    vi.restoreAllMocks();
  });

  it("reveals the new theme from the toggle when view transitions are available", async () => {
    const user = userEvent.setup();
    const animate = vi.fn();
    Object.defineProperty(document.documentElement, "animate", {
      configurable: true,
      value: animate,
    });
    const startViewTransition = vi.fn((update: () => void) => {
      update();
      return {
        ready: Promise.resolve(),
        finished: Promise.resolve(),
      } as ViewTransition;
    });
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });

    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(startViewTransition).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    await waitFor(() => {
      expect(animate).toHaveBeenCalledOnce();
    });
    expect(animate.mock.calls[0]?.[1]).toMatchObject({
      duration: 620,
      pseudoElement: "::view-transition-new(root)",
    });
  });

  it("changes immediately when reduced motion is requested", async () => {
    const user = userEvent.setup();
    const startViewTransition = vi.fn();
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });
    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;

    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(document.documentElement.dataset["theme"]).toBe("dark");
  });

  it("uses a circular overlay when view transitions are unavailable", async () => {
    const user = userEvent.setup();
    Reflect.deleteProperty(document, "startViewTransition");
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });

    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    const overlay = document.querySelector(".theme-reveal-fallback");
    expect(overlay).toHaveAttribute("data-theme", "dark");
    expect(overlay).toHaveAttribute("data-active");

    overlay?.dispatchEvent(new Event("transitionend"));
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    expect(overlay).toHaveAttribute("data-settling");
  });
});
