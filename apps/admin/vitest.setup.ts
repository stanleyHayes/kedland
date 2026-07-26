import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

import { contrastMatchers } from "@kedland/testing";

const localStorageValues = new Map<string, string>();
const localStorageStub: Storage = {
  get length() {
    return localStorageValues.size;
  },
  clear: () => {
    localStorageValues.clear();
  },
  getItem: (key) => localStorageValues.get(key) ?? null,
  key: (index) => Array.from(localStorageValues.keys())[index] ?? null,
  removeItem: (key) => {
    localStorageValues.delete(key);
  },
  setItem: (key, value) => {
    localStorageValues.set(key, value);
  },
};

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: localStorageStub,
});

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
  }),
});

// Makes `expect(fg).toMeetContrastAgainst(bg)` available to component tests.
expect.extend(contrastMatchers);

afterEach(() => {
  cleanup();
  localStorageStub.clear();
});
