import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

import { contrastMatchers } from "@kedland/testing";

// Makes `expect(fg).toMeetContrastAgainst(bg)` available to component tests.
expect.extend(contrastMatchers);

afterEach(() => {
  cleanup();
});
