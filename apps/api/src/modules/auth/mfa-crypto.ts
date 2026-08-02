import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Encryption for TOTP secrets at rest.
 *
 * A TOTP secret is a bearer credential: anyone holding it can generate valid
 * codes forever. Stored in plaintext it turns a database dump — a leaked backup,
 * an Atlas snapshot, a `mongodump` on a laptop — into a working second factor for
 * every member of staff, which is precisely the thing the second factor exists to
 * survive. Password hashes are already safe from that; the secrets have to be too.
 *
 * AES-256-GCM, so the ciphertext is authenticated as well as hidden: a secret
 * altered in the database fails to decrypt rather than silently becoming a
 * different secret that no app can match.
 *
 * The key comes from `MFA_ENCRYPTION_KEY` through HKDF, and is deliberately its
 * own environment value rather than a reuse of the JWT secrets. Sharing one would
 * mean rotating the access-token secret — a routine, low-drama thing to do after
 * a suspected leak — silently locked every member of staff out of their
 * authenticator. Those two operations should not be entangled.
 */

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const INFO = "kedland-mfa-secret-v1";

/**
 * Thrown when MFA is used without a key configured.
 *
 * Deliberately loud. The alternative — falling back to plaintext, or to a
 * constant — would leave a deployment believing it had two-factor authentication
 * while storing the secrets in the clear.
 */
export class MfaKeyMissingError extends Error {
  constructor() {
    super(
      "MFA_ENCRYPTION_KEY is not set, so authenticator secrets cannot be stored safely. " +
        "Generate one with `openssl rand -base64 48` and add it before enabling two-factor authentication.",
    );
    this.name = "MfaKeyMissingError";
  }
}

/**
 * A 256-bit key from whatever length of secret the environment supplies.
 *
 * HKDF rather than using the string's bytes directly: an operator will paste
 * something human-chosen, and a passphrase is not a uniformly random key. The
 * salt is fixed because there is nothing per-record to vary it with, which HKDF
 * explicitly permits — the entropy has to come from the secret.
 */
function keyFrom(secret: string | undefined): Buffer {
  if (!secret) throw new MfaKeyMissingError();

  return Buffer.from(hkdfSync("sha256", Buffer.from(secret, "utf8"), Buffer.alloc(0), INFO, KEY_BYTES));
}

/**
 * `iv.ciphertext.tag`, base64url, so the whole thing is one opaque string in one
 * column. Versioned by the HKDF `info` above rather than by a prefix here: if the
 * scheme ever changes, the old records fail to decrypt loudly instead of being
 * misread.
 */
export function encryptSecret(plaintext: string, key: string | undefined): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, keyFrom(key), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return [iv, ciphertext, cipher.getAuthTag()].map((part) => part.toString("base64url")).join(".");
}

/**
 * @throws when the key is wrong, the record was tampered with, or the format is
 *         not one this version wrote. Never returns a partial or guessed value —
 *         a decrypt that silently produced the wrong secret would lock somebody
 *         out with no explanation.
 */
export function decryptSecret(stored: string, key: string | undefined): string {
  const parts = stored.split(".");
  const [ivPart, ciphertextPart, tagPart] = parts;
  // Checked as three present strings rather than asserted afterwards: a record
  // written by an older scheme, or truncated in a migration, must fail here with
  // something an operator can read.
  if (parts.length !== 3 || !ivPart || !ciphertextPart || !tagPart) {
    throw new Error("Stored authenticator secret is not in the expected format");
  }

  const iv = Buffer.from(ivPart, "base64url");
  const ciphertext = Buffer.from(ciphertextPart, "base64url");
  const tag = Buffer.from(tagPart, "base64url");

  const decipher = createDecipheriv(ALGORITHM, keyFrom(key), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Whether MFA can be used at all in this deployment. */
export function canStoreSecrets(key: string | undefined): boolean {
  return Boolean(key);
}
