import { canStoreSecrets, decryptSecret, encryptSecret, MfaKeyMissingError } from "./mfa-crypto";

const KEY = "a-long-enough-mfa-encryption-key-for-tests";
const SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("MFA secret storage", () => {
  it("round-trips a secret", () => {
    expect(decryptSecret(encryptSecret(SECRET, KEY), KEY)).toBe(SECRET);
  });

  it("never stores the secret in the clear", () => {
    // The whole point: a database dump must not be a working second factor.
    expect(encryptSecret(SECRET, KEY)).not.toContain(SECRET);
  });

  /** A fresh IV each time, or identical secrets would be identifiable as such. */
  it("produces different ciphertext for the same secret each time", () => {
    expect(encryptSecret(SECRET, KEY)).not.toBe(encryptSecret(SECRET, KEY));
  });

  it("refuses a secret encrypted under a different key", () => {
    expect(() => decryptSecret(encryptSecret(SECRET, KEY), "a-different-key-entirely-here")).toThrow();
  });

  /**
   * GCM authenticates as well as encrypts. A record altered in the database
   * fails loudly rather than decrypting to some other secret that no
   * authenticator app would ever match — which would present as an
   * unexplainable lockout.
   */
  it("refuses a record that has been tampered with", () => {
    const stored = encryptSecret(SECRET, KEY);
    const [iv, ciphertext, tag] = stored.split(".");
    const flipped = Buffer.from(ciphertext!, "base64url");
    flipped.writeUInt8(flipped.readUInt8(0) ^ 0x01, 0);

    expect(() => decryptSecret([iv, flipped.toString("base64url"), tag].join("."), KEY)).toThrow();
  });

  it("refuses a record that is not in the expected format", () => {
    expect(() => decryptSecret("not-a-real-record", KEY)).toThrow(/expected format/);
  });

  /**
   * Loud, not silent. Falling back to plaintext or to a constant key would leave
   * a deployment believing it had two-factor authentication.
   */
  it("refuses to encrypt at all without a key", () => {
    expect(() => encryptSecret(SECRET, undefined)).toThrow(MfaKeyMissingError);
    expect(() => encryptSecret(SECRET, "")).toThrow(MfaKeyMissingError);
  });

  it("reports whether the deployment can store secrets", () => {
    expect(canStoreSecrets(KEY)).toBe(true);
    expect(canStoreSecrets(undefined)).toBe(false);
  });

  it("accepts a long passphrase as readily as a short one", () => {
    // HKDF, so whatever an operator pastes becomes a 256-bit key.
    const long = "x".repeat(500);
    expect(decryptSecret(encryptSecret(SECRET, long), long)).toBe(SECRET);
  });
});
