import { currentCode, fromBase32, generateSecret, provisioningUri, toBase32, verifyCode } from "./totp";

/**
 * TOTP, checked against the standard rather than against itself.
 *
 * The vectors below are from RFC 6238 Appendix B — the published expected
 * outputs for the shared secret "12345678901234567890" at fixed times. Testing
 * an implementation against its own output proves only that it is consistent;
 * these prove it agrees with what Google Authenticator will actually show, which
 * is the only property that matters for a second factor somebody scans.
 */

/** RFC 6238's ASCII seed, base32-encoded as an authenticator app expects. */
const RFC_SECRET = toBase32(Buffer.from("12345678901234567890", "utf8"));

describe("base32", () => {
  it("round-trips", () => {
    const secret = generateSecret();
    expect(toBase32(fromBase32(secret))).toBe(secret);
  });

  it("encodes the RFC's seed as authenticator apps do", () => {
    expect(RFC_SECRET).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  });

  /** Apps display keys in spaced groups, and people type them back that way. */
  it("accepts a key typed with spaces and in lower case", () => {
    const spaced = "gezd gnbv gy3t qojq gezd gnbv gy3t qojq";
    expect(fromBase32(spaced).toString("utf8")).toBe("12345678901234567890");
  });

  it("refuses a key with characters base32 does not have", () => {
    // `1`, `8` and `0` are deliberately absent from the alphabet to stop them
    // being confused with I, B and O.
    expect(() => fromBase32("ABC1")).toThrow(/valid authenticator key/);
  });
});

describe("codes, against RFC 6238's published vectors", () => {
  // Appendix B, the SHA-1 rows. Seconds since the epoch → expected 8-digit code;
  // we take the low six, which is what a 6-digit authenticator shows.
  it.each([
    [59, "287082"],
    [1_111_111_109, "081804"],
    [1_111_111_111, "050471"],
    [1_234_567_890, "005924"],
    [2_000_000_000, "279037"],
  ])("at %i seconds produces %s", (seconds, expected) => {
    expect(currentCode(RFC_SECRET, seconds * 1000)).toBe(expected);
  });

  it("always produces six digits, including when the value has leading zeros", () => {
    // 1234567890 → "005924" above. A naive `String(n % 1e6)` would give "5924"
    // and every app comparing six characters would reject it.
    expect(currentCode(RFC_SECRET, 1_234_567_890 * 1000)).toHaveLength(6);
  });
});

describe("verification", () => {
  const at = 1_111_111_109 * 1000;

  it("accepts the current code", () => {
    expect(verifyCode(RFC_SECRET, currentCode(RFC_SECRET, at), at)).toBe(true);
  });

  /**
   * The window either side. A code entered as it rolls over, or from a phone
   * whose clock is half a minute out, still works — which is the difference
   * between a second factor and a support call.
   */
  it("accepts the previous and next codes", () => {
    expect(verifyCode(RFC_SECRET, currentCode(RFC_SECRET, at - 30_000), at)).toBe(true);
    expect(verifyCode(RFC_SECRET, currentCode(RFC_SECRET, at + 30_000), at)).toBe(true);
  });

  it("refuses a code two steps away", () => {
    expect(verifyCode(RFC_SECRET, currentCode(RFC_SECRET, at - 90_000), at)).toBe(false);
    expect(verifyCode(RFC_SECRET, currentCode(RFC_SECRET, at + 90_000), at)).toBe(false);
  });

  it("refuses a code from a different secret", () => {
    expect(verifyCode(RFC_SECRET, currentCode(generateSecret(), at), at)).toBe(false);
  });

  it.each(["", "12345", "1234567", "abcdef", "12 34 56 78"])("refuses %p", (submitted) => {
    expect(verifyCode(RFC_SECRET, submitted, at)).toBe(false);
  });

  it("tolerates a code typed with a space in the middle", () => {
    const code = currentCode(RFC_SECRET, at);
    expect(verifyCode(RFC_SECRET, `${code.slice(0, 3)} ${code.slice(3)}`, at)).toBe(true);
  });
});

describe("secrets", () => {
  it("is 160 bits, which is what RFC 4226 recommends", () => {
    expect(fromBase32(generateSecret())).toHaveLength(20);
  });

  it("differs every time", () => {
    const secrets = new Set(Array.from({ length: 50 }, () => generateSecret()));
    expect(secrets.size).toBe(50);
  });
});

describe("the provisioning URI", () => {
  const uri = provisioningUri("GEZDGNBVGY3TQOJQ", "mary@kedland.edu.gh");

  it("is an otpauth TOTP URI carrying the secret", () => {
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain("secret=GEZDGNBVGY3TQOJQ");
  });

  /**
   * Named on both sides of the colon *and* as a parameter, because apps disagree
   * about which they read — and an entry that lists as a bare email address is
   * one nobody can identify among thirty others a year later.
   */
  it("names the school in the label and in the parameters", () => {
    expect(uri).toContain(encodeURIComponent("Kedland:mary@kedland.edu.gh"));
    expect(uri).toContain("issuer=Kedland");
  });

  it("states the parameters rather than relying on an app's defaults", () => {
    expect(uri).toContain("algorithm=SHA1");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });
});
