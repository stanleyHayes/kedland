import { afterEach, describe, expect, it, vi } from "vitest";

import { turnstileSiteKey } from "./turnstile-site-key";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("turnstileSiteKey", () => {
  it("passes a real site key through", () => {
    expect(turnstileSiteKey("0x4AAAAAAABkMYinukE8nzY")).toBe("0x4AAAAAAABkMYinukE8nzY");
  });

  /** Development and preview deploys run without Cloudflare, and that is fine. */
  it("treats an unset key as unconfigured, quietly", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(turnstileSiteKey(undefined)).toBeUndefined();
    expect(turnstileSiteKey("")).toBeUndefined();
    expect(turnstileSiteKey("   ")).toBeUndefined();
    expect(error).not.toHaveBeenCalled();
  });

  /**
   * The live failure. A URL sat in this variable, so the widget errored, no
   * token was issued, and the API refused every enquiry while the form showed
   * only "we could not send that just now".
   */
  it("rejects a URL, and says so", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(turnstileSiteKey("https://kedland.vercel.app")).toBeUndefined();
    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0]?.[0]).toMatch(/does not look like a Turnstile site key/i);
  });

  it("rejects a secret key pasted in by mistake", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    // Secret keys are the other half of the pair and are easy to confuse; they
    // do not begin `0x`, and putting one here would publish it to every visitor.
    expect(turnstileSiteKey("1x0000000000000000000000000000000AA")).toBeUndefined();
  });

  it("does not leak the whole value into the log", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const long = `not-a-key-${"x".repeat(200)}`;

    turnstileSiteKey(long);

    expect(String(error.mock.calls[0]?.[0])).not.toContain("x".repeat(50));
  });
});
