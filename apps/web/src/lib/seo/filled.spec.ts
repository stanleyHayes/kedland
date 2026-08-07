import { describe, expect, it } from "vitest";

import { filled } from "./filled";

describe("filled", () => {
  it("keeps a real value", () => {
    expect(filled("Sports Day 2026")).toBe("Sports Day 2026");
  });

  it("treats null and undefined as absent", () => {
    expect(filled(null)).toBeNull();
    expect(filled(undefined)).toBeNull();
  });

  /**
   * The case `??` gets wrong, and the reason this exists. Clearing an SEO field
   * in the dashboard submits "", which `??` would keep — publishing a page
   * titled " | Kedland International School".
   */
  it("treats a cleared field as absent", () => {
    expect(filled("")).toBeNull();
  });

  it("treats whitespace as absent", () => {
    expect(filled("   ")).toBeNull();
    expect(filled("\n\t ")).toBeNull();
  });

  /** A value that survives is trimmed, so it cannot carry stray padding. */
  it("trims what it keeps", () => {
    expect(filled("  Sports Day  ")).toBe("Sports Day");
  });
});
