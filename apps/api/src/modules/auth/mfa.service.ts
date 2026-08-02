import { createHash, randomBytes, randomInt } from "node:crypto";

import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { UsersService } from "../users/users.service";

import { canStoreSecrets, decryptSecret, encryptSecret } from "./mfa-crypto";
import { generateSecret, provisioningUri, verifyCode } from "./totp";

/**
 * Two-factor authentication with an authenticator app.
 *
 * The shape of the flow, and why each step is where it is:
 *
 *  1. **Begin** hands back a secret and a QR URI but changes nothing. An
 *     interrupted enrolment — the tab closed, the phone out of battery — must
 *     leave the account exactly as it was, not half-protected by a secret nobody
 *     has.
 *  2. **Enable** requires a working code from that secret. Proving the app is
 *     set up *before* the account starts demanding codes is the difference
 *     between two-factor authentication and a lockout.
 *  3. **Disable** requires the current password. Otherwise anyone who found an
 *     unlocked laptop could remove the factor protecting it, which would make
 *     the whole thing decorative.
 *
 * Recovery codes exist because phones are lost, and a school with no way back
 * into its own website is a worse outcome than one with a weaker second factor.
 */

/** Ten is enough to survive a lost phone without becoming a password list. */
const RECOVERY_CODE_COUNT = 10;

export interface MfaEnrolment {
  /** Shown once, for manual entry when a camera will not cooperate. */
  secret: string;
  /** The `otpauth://` URI to render as a QR code. */
  uri: string;
}

@Injectable()
export class MfaService {
  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private key(): string | undefined {
    return this.config.get<string>("auth.mfaEncryptionKey");
  }

  /** Whether this deployment can offer two-factor at all. */
  isAvailable(): boolean {
    return canStoreSecrets(this.key());
  }

  private assertAvailable(): void {
    if (!this.isAvailable()) {
      throw new BadRequestException(
        "Two-factor authentication is not configured on this server. " +
          "An administrator needs to set MFA_ENCRYPTION_KEY.",
      );
    }
  }

  /**
   * Step one: a secret and a QR, stored nowhere yet.
   *
   * Returned rather than persisted so an abandoned enrolment leaves no trace.
   * The secret is only committed by `enable`, and only once a code from it has
   * been shown to work.
   */
  begin(email: string): MfaEnrolment {
    this.assertAvailable();
    const secret = generateSecret();

    return { secret, uri: provisioningUri(secret, email) };
  }

  /**
   * Step two: prove the app works, then switch it on.
   *
   * @returns the recovery codes, in plain text, for the only time they exist in
   *          readable form. They are stored hashed — see the schema.
   */
  async enable(userId: string, secret: string, code: string): Promise<string[]> {
    this.assertAvailable();

    if (!verifyCode(secret, code)) {
      throw new BadRequestException(
        "That code did not match. Check the six digits currently showing in your authenticator app.",
      );
    }

    const recoveryCodes = MfaService.generateRecoveryCodes();
    await this.users.enableMfa(
      userId,
      encryptSecret(secret, this.key()),
      recoveryCodes.map((value) => MfaService.hashRecoveryCode(value)),
    );

    return recoveryCodes;
  }

  /** Step three: off again, on proof of the password. */
  async disable(userId: string, password: string): Promise<void> {
    const user = await this.users.findForMfa(userId);
    if (!user) throw new UnauthorizedException("No such account");

    const correct = await UsersService.verifyPassword(user.passwordHash, password);
    if (!correct) {
      throw new UnauthorizedException("That password is not correct.");
    }

    await this.users.disableMfa(userId);
  }

  /**
   * Checks a code at sign-in, accepting either the app's or a recovery code.
   *
   * A recovery code is consumed on use — removed from the list rather than
   * flagged, so there is no state in which a spent one could be replayed.
   */
  async verify(userId: string, submitted: string): Promise<boolean> {
    const user = await this.users.findForMfa(userId);
    if (!user?.mfaSecret) return false;

    let secret: string;
    try {
      secret = decryptSecret(user.mfaSecret, this.key());
    } catch {
      // A secret that will not decrypt is a wrong key or a tampered record.
      // Refusing is the only safe answer; it must not fall through to the
      // recovery codes, which would let a corrupted record widen the attack.
      return false;
    }

    if (verifyCode(secret, submitted)) return true;

    return this.consumeRecoveryCode(user.mfaRecoveryCodes, userId, submitted);
  }

  private async consumeRecoveryCode(
    stored: readonly string[],
    userId: string,
    submitted: string,
  ): Promise<boolean> {
    const hashed = MfaService.hashRecoveryCode(submitted);
    if (!stored.includes(hashed)) return false;

    await this.users.consumeRecoveryCode(userId, hashed);
    return true;
  }

  /**
   * Readable codes, in groups, from a reduced alphabet.
   *
   * No 0/O or 1/I/L: these get written on paper and read back later, often by
   * somebody who did not write them. `randomInt` rather than arithmetic on
   * `randomBytes`, because taking a modulus of a byte over a 32-character
   * alphabet quietly favours the first 24.
   */
  private static generateRecoveryCodes(): string[] {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const pick = (length: number): string =>
      Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join("");

    return Array.from({ length: RECOVERY_CODE_COUNT }, () => `${pick(4)}-${pick(4)}`);
  }

  /**
   * SHA-256, not Argon2.
   *
   * Deliberate, and the reasoning differs from a password: these are 40 bits of
   * uniform randomness generated by us, not something a person chose, so there
   * is no dictionary to run and nothing for a slow hash to buy. What matters is
   * that a database dump does not yield usable codes, which a fast hash of an
   * unguessable input achieves.
   */
  private static hashRecoveryCode(code: string): string {
    const normalised = code.replaceAll(/[\s-]/g, "").toUpperCase();
    return createHash("sha256").update(normalised).digest("hex");
  }

  /** A short-lived id tying a completed password check to its pending code. */
  static challengeToken(): string {
    return randomBytes(32).toString("base64url");
  }
}
