import { describe, expect, it } from "vitest";

import { formatPhoneNumber, normalizePhoneNumber } from "./phone";

describe("formatPhoneNumber", () => {
  it("formats a Ghanaian local number while preserving its leading zero", () => {
    expect(formatPhoneNumber("0501358915")).toBe("050 135 8915");
  });

  it("formats a Ghanaian international number", () => {
    expect(formatPhoneNumber("+233501358915")).toBe("+233 50 135 8915");
  });

  it("accepts pasted punctuation and normalizes the spacing", () => {
    expect(formatPhoneNumber("(050) 135-8915")).toBe("050 135 8915");
  });

  it("keeps partial input natural while someone is typing", () => {
    expect(formatPhoneNumber("0501")).toBe("050 1");
    expect(formatPhoneNumber("+23350")).toBe("+233 50");
  });
});

describe("normalizePhoneNumber", () => {
  it("removes display spacing without dropping the international prefix", () => {
    expect(normalizePhoneNumber("+233 50 135 8915")).toBe("+233501358915");
  });
});
