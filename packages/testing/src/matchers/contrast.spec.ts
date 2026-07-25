import { describe, expect, it } from "vitest";

import { COLOURS } from "@kedland/ui";

import { toMeetContrastAgainst } from "./contrast";

describe("toMeetContrastAgainst", () => {
  it("passes for a compliant pairing", () => {
    expect(toMeetContrastAgainst(COLOURS.ink, COLOURS.cream).pass).toBe(true);
  });

  it("fails for a pairing the brand guide bans", () => {
    expect(toMeetContrastAgainst(COLOURS.white, COLOURS.yellow).pass).toBe(false);
  });

  it("relaxes the threshold for large text", () => {
    expect(toMeetContrastAgainst(COLOURS.white, COLOURS.red, { large: true }).pass).toBe(true);
  });

  it("reports the actual and required ratios so the fix is obvious", () => {
    const message = toMeetContrastAgainst(COLOURS.white, COLOURS.yellow).message();
    expect(message).toMatch(/1\.51:1/);
    expect(message).toMatch(/needs 4\.5:1/);
  });

  it("inverts its message when used with .not", () => {
    expect(toMeetContrastAgainst(COLOURS.ink, COLOURS.cream).message()).toMatch(/NOT to meet/);
  });

  it("applies the stricter AAA threshold on request", () => {
    // navy on cream is 9.18:1 — comfortably AAA.
    expect(toMeetContrastAgainst(COLOURS.navy, COLOURS.cream, { level: "AAA" }).pass).toBe(true);
    // grey on cream is 4.51:1 — passes AA, fails AAA.
    expect(toMeetContrastAgainst(COLOURS.grey, COLOURS.cream, { level: "AAA" }).pass).toBe(false);
  });
});
