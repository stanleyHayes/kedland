import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

import { contrastMatchers } from "@kedland/testing";

// Makes `expect(fg).toMeetContrastAgainst(bg)` available to component tests.
expect.extend(contrastMatchers);

/*
 * jsdom ships no `matchMedia`, though the DOM types insist it is there.
 *
 * Every browser has had it for a decade, so guarding each call site would be
 * defending against a condition that cannot occur in production — the honest
 * place to fix this is the test environment. Reports "no preference", i.e. the
 * light theme; a test that cares about dark replaces it.
 */
window.matchMedia = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
});

afterEach(() => {
  cleanup();
});
