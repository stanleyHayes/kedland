"use client";

import { useSyncExternalStore } from "react";

import { Icon } from "@kedland/ui";

/**
 * Light and dark.
 *
 * The switch is wired end to end now, while the palette is still being built:
 * it writes `data-theme` on `<html>` and remembers the choice, so dark mode
 * arrives as a set of token overrides in CSS rather than a hunt through every
 * component. Nothing here needs to change when it lands.
 *
 * Three details that are easy to get wrong and unpleasant to live with:
 *
 *  - **The stored choice is applied before first paint**, by the inline script
 *    in the root layout. Doing it in an effect instead means a visible flash of
 *    the wrong theme on every page load.
 *  - **No preference is stored until the visitor expresses one.** Until then
 *    the operating system decides, so a parent whose phone is in dark mode gets
 *    dark without asking.
 *  - **The icon crossfades and rotates rather than swapping.** A hard swap at
 *    this size reads as a glitch. `prefers-reduced-motion` removes it.
 *
 * The theme is not React state. It lives on `<html>` — written before React
 * boots, and readable by CSS, which is the entire point — with the operating
 * system deciding until someone overrides it. So it is read through
 * `useSyncExternalStore` rather than copied into `useState`: one source of
 * truth, no effect that syncs a duplicate, and a server snapshot that is
 * honestly `null` because the server cannot know.
 */

type Theme = "light" | "dark";

const STORAGE_KEY = "kedland-theme";

/** What the document is showing right now, whoever decided it. */
function currentTheme(): Theme {
  if (document.documentElement.dataset["theme"] === "dark") return "dark";
  if (document.documentElement.dataset["theme"] === "light") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Re-read the theme whenever anything that decides it changes. */
function subscribe(onChange: () => void): () => void {
  // The operating system preference can change while the page is open, and it
  // decides the theme until the visitor overrides it.
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);

  // And `data-theme` itself, which is what `toggle` writes. Watching the
  // attribute rather than calling `setTheme` keeps the DOM the only source of
  // truth — and picks up any other future writer, such as a theme restored
  // from another tab.
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });

  return () => {
    query.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

/** The server has no theme to report; rendering a guess mismatches on hydration. */
const noThemeOnServer = (): Theme | null => null;

export function ThemeToggle({ className = "" }: Readonly<{ className?: string }>) {
  const theme = useSyncExternalStore(subscribe, currentTheme, noThemeOnServer);

  const toggle = (): void => {
    const next: Theme = theme === "dark" ? "light" : "dark";

    // The observer above turns this into a re-render.
    document.documentElement.dataset["theme"] = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing can refuse storage. The theme still changes for this
      // visit; only remembering it fails, which is not worth an error.
    }
  };

  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      // The label says what pressing it *does*, which is what a screen reader
      // should hear — not what the current state is.
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={`neu-icon neu-interactive grid size-11 shrink-0 place-items-center rounded-pill text-navy ${className}`.trim()}
    >
      {/* Both icons are always present and cross-fade; only one is ever
          visible. Rendering one conditionally would give React nothing to
          animate between. */}
      <span className="relative grid size-5 place-items-center">
        <Icon
          name="sun"
          className={`absolute size-5 transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
            dark ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
          }`}
        />
        <Icon
          name="moon"
          className={`absolute size-5 transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
            dark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          }`}
        />
      </span>
    </button>
  );
}
