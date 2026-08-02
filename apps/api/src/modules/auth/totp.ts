import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Time-based one-time passwords, to RFC 6238.
 *
 * Written against `node:crypto` rather than pulled from npm. TOTP is forty lines
 * of HMAC and a counter, it has not changed since 2011, and every authenticator
 * app implements the same spec — so a dependency here would buy nothing and cost
 * the one thing this repo is careful about: another package in the supply chain
 * of the service that holds the school's credentials.
 *
 * Everything below is the standard's defaults, which is what Google
 * Authenticator, 1Password, Aegis and the rest assume when a URI omits them:
 * SHA-1, six digits, a thirty-second step. They are *not* good defaults in the
 * abstract — SHA-1 would be an odd choice today — but interoperability is the
 * whole point of a second factor the user already has an app for, and the
 * construction's security does not rest on the hash's collision resistance.
 */

/** Seconds per code. */
const STEP_SECONDS = 30;
const DIGITS = 6;

/**
 * How many steps either side of now are accepted.
 *
 * One, so a code entered as it rolls over still works, and a phone whose clock
 * is half a minute out is not locked out of the dashboard. That widens the
 * window to ninety seconds — the accepted trade, and the reason enrolment and
 * sign-in are both rate-limited.
 */
const DRIFT_STEPS = 1;

/* ── base32, which is what authenticator apps speak ──────────────────────── */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * One symbol, by its 5-bit value.
 *
 * A helper rather than `ALPHABET[i]` inline: indexing a string is
 * `string | undefined` under `noUncheckedIndexedAccess`, and the mask above
 * already guarantees 0–31. Saying so once here beats asserting it at each use.
 */
function symbol(value: number): string {
  return ALPHABET.charAt(value & 31);
}

export function toBase32(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += symbol(value >>> (bits - 5));
      bits -= 5;
    }
  }

  if (bits > 0) output += symbol(value << (5 - bits));

  // No `=` padding: apps accept it, but every QR byte saved is a QR that scans
  // on a cracked phone screen in a school office.
  return output;
}

export function fromBase32(secret: string): Buffer {
  // Case-insensitive and forgiving of the spaces apps insert when displaying a
  // key for manual entry — somebody *will* type it with them.
  const normalised = secret.replaceAll(/[\s=]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const character of normalised) {
    const index = ALPHABET.indexOf(character);
    if (index === -1) throw new Error("Not a valid authenticator key");

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/* ── The algorithm ───────────────────────────────────────────────────────── */

/**
 * A 160-bit secret, which is what RFC 4226 recommends and what apps expect.
 */
export function generateSecret(): string {
  return toBase32(randomBytes(20));
}

/** The code for one counter value. */
function hotp(secret: Buffer, counter: number): string {
  const message = Buffer.alloc(8);
  // The counter is 64-bit big-endian. `writeBigUInt64BE` rather than two 32-bit
  // writes, so this stays correct past 2038.
  message.writeBigUInt64BE(BigInt(counter));

  // HMAC-SHA1 is mandated by RFC 6238 — see the note at the top of this file for
  // why interoperability wins over a more modern hash here.
  const digest = createHmac("sha1", secret).update(message).digest();

  // Dynamic truncation, RFC 4226 §5.3: the low nibble of the last byte picks
  // where to read four bytes from, and the top bit is masked off so the result
  // is positive on every platform.
  //
  // `readUInt32BE` rather than four indexed reads shifted together: identical
  // arithmetic, and it does not need a non-null assertion per byte to satisfy
  // `noUncheckedIndexedAccess` — assertions that would be hiding a genuine
  // question about whether the offset is in range.
  const offset = digest.readUInt8(digest.length - 1) & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fff_ffff;

  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/** The code an authenticator app is showing right now. */
export function currentCode(secret: string, at: number = Date.now()): string {
  return hotp(fromBase32(secret), Math.floor(at / 1000 / STEP_SECONDS));
}

/**
 * Whether a submitted code is valid.
 *
 * Compared in constant time. A timing difference here leaks how many leading
 * digits were right, which turns a million-guess space into six thousand-guess
 * ones — the classic reason not to compare secrets with `===`.
 */
export function verifyCode(secret: string, submitted: string, at: number = Date.now()): boolean {
  const cleaned = submitted.replaceAll(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;

  const counter = Math.floor(at / 1000 / STEP_SECONDS);
  const submittedBuffer = Buffer.from(cleaned, "utf8");

  let matched = false;
  for (let drift = -DRIFT_STEPS; drift <= DRIFT_STEPS; drift += 1) {
    const candidate = Buffer.from(hotp(fromBase32(secret), counter + drift), "utf8");

    // No early return: leaving the loop on the first match would make a code
    // from the previous step measurably faster to reject than one from the next.
    if (candidate.length === submittedBuffer.length && timingSafeEqual(candidate, submittedBuffer)) {
      matched = true;
    }
  }

  return matched;
}

/**
 * The `otpauth://` URI an authenticator app scans.
 *
 * The issuer appears twice — once as a label prefix and once as a parameter —
 * because apps disagree about which they read, and an entry that shows up as a
 * bare email address among thirty others is one nobody can identify later.
 */
export function provisioningUri(secret: string, account: string, issuer = "Kedland"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const parameters = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });

  return `otpauth://totp/${label}?${parameters.toString()}`;
}
