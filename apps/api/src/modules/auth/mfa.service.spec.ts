import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import { UsersService } from "../users/users.service";

import { encryptSecret } from "./mfa-crypto";
import { MfaService } from "./mfa.service";
import { currentCode, generateSecret } from "./totp";

const KEY = "a-long-enough-mfa-encryption-key-for-tests";

/**
 * Two-factor enrolment and verification.
 *
 * The properties worth protecting are about *ordering and state*, not about the
 * algorithm — that is covered against the RFC's own vectors in `totp.spec.ts`.
 * Here: nothing is stored until a code proves the app works, a recovery code
 * cannot be spent twice, and turning the factor off costs the password.
 */
describe("MfaService", () => {
  let service: MfaService;
  let users: {
    findForMfa: jest.Mock;
    enableMfa: jest.Mock;
    disableMfa: jest.Mock;
    consumeRecoveryCode: jest.Mock;
  };

  /*
   * `null` means "no key", not `undefined`.
   *
   * A default parameter is applied when the argument *is* `undefined`, so
   * `build(undefined)` would quietly hand back the configured key and the test
   * below would assert the opposite of what it reads.
   */
  const build = async (key: string | null = KEY): Promise<void> => {
    users = {
      findForMfa: jest.fn(),
      enableMfa: jest.fn().mockResolvedValue(undefined),
      disableMfa: jest.fn().mockResolvedValue(undefined),
      consumeRecoveryCode: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MfaService,
        { provide: UsersService, useValue: users },
        { provide: ConfigService, useValue: { get: () => key ?? undefined } },
      ],
    }).compile();

    service = moduleRef.get(MfaService);
  };

  beforeEach(async () => {
    await build();
  });

  describe("availability", () => {
    it("is available when a key is configured", () => {
      expect(service.isAvailable()).toBe(true);
    });

    /**
     * Refused rather than degraded. A deployment without a key must not end up
     * believing it has two-factor while storing secrets in the clear.
     */
    it("refuses to start an enrolment with no key", async () => {
      await build(null);

      expect(service.isAvailable()).toBe(false);
      expect(() => service.begin("mary@kedland.edu.gh")).toThrow(BadRequestException);
    });
  });

  describe("beginning an enrolment", () => {
    it("returns a secret and a scannable URI", () => {
      const { secret, uri } = service.begin("mary@kedland.edu.gh");

      expect(secret).toHaveLength(32);
      expect(uri).toContain("otpauth://totp/");
      expect(uri).toContain(`secret=${secret}`);
    });

    /**
     * The point of splitting begin from enable: an abandoned enrolment — the tab
     * closed, the phone flat — must leave the account exactly as it was, not
     * demanding codes from a secret nobody scanned.
     */
    it("stores nothing", () => {
      service.begin("mary@kedland.edu.gh");

      expect(users.enableMfa).not.toHaveBeenCalled();
    });
  });

  describe("enabling", () => {
    it("refuses a wrong code, and changes nothing", async () => {
      await expect(service.enable("u1", generateSecret(), "000000")).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(users.enableMfa).not.toHaveBeenCalled();
    });

    it("stores the secret encrypted, never in the clear", async () => {
      const secret = generateSecret();
      await service.enable("u1", secret, currentCode(secret));

      const [, stored] = users.enableMfa.mock.calls[0] as [string, string, string[]];
      expect(stored).not.toContain(secret);
    });

    it("hands back recovery codes, and stores only their hashes", async () => {
      const secret = generateSecret();
      const codes = await service.enable("u1", secret, currentCode(secret));

      expect(codes).toHaveLength(10);
      const [, , hashes] = users.enableMfa.mock.calls[0] as [string, string, string[]];
      for (const code of codes) expect(hashes).not.toContain(code);
    });

    /** Written on paper and read back later, often by somebody else. */
    it("uses an alphabet without characters that get misread", async () => {
      // No 0/O, no 1/I/L.
      const secret = generateSecret();
      const codes = await service.enable("u1", secret, currentCode(secret));

      for (const code of codes) expect(code).not.toMatch(/[01OIL]/);
    });
  });

  describe("verifying at sign-in", () => {
    const secret = generateSecret();

    const enrolled = (recoveryCodes: string[] = []) => ({
      mfaSecret: encryptSecret(secret, KEY),
      mfaRecoveryCodes: recoveryCodes,
      passwordHash: "irrelevant",
    });

    it("accepts the app's current code", async () => {
      users.findForMfa.mockResolvedValue(enrolled());

      await expect(service.verify("u1", currentCode(secret))).resolves.toBe(true);
    });

    it("refuses a wrong code", async () => {
      users.findForMfa.mockResolvedValue(enrolled());

      await expect(service.verify("u1", "000000")).resolves.toBe(false);
    });

    it("refuses an account that has not enrolled", async () => {
      users.findForMfa.mockResolvedValue({ mfaSecret: null, mfaRecoveryCodes: [] });

      await expect(service.verify("u1", currentCode(secret))).resolves.toBe(false);
    });

    /**
     * A secret that will not decrypt is a wrong key or a tampered record. It must
     * not fall through to the recovery codes — that would let a corrupted record
     * widen what an attacker can try.
     */
    it("refuses outright when the stored secret cannot be decrypted", async () => {
      users.findForMfa.mockResolvedValue({
        mfaSecret: encryptSecret(secret, "a-completely-different-key-here"),
        mfaRecoveryCodes: [],
      });

      await expect(service.verify("u1", currentCode(secret))).resolves.toBe(false);
      expect(users.consumeRecoveryCode).not.toHaveBeenCalled();
    });

    describe("recovery codes", () => {
      /** Phones get lost; a school locked out of its own site is the worse outcome. */
      it("accepts one, and spends it", async () => {
        const plain = await service.enable("u1", secret, currentCode(secret));
        const [, , hashes] = users.enableMfa.mock.calls[0] as [string, string, string[]];
        users.findForMfa.mockResolvedValue(enrolled(hashes));

        await expect(service.verify("u1", plain[0]!)).resolves.toBe(true);
        expect(users.consumeRecoveryCode).toHaveBeenCalledWith("u1", hashes[0]);
      });

      it("accepts one typed without its dash, in lower case", async () => {
        const plain = await service.enable("u1", secret, currentCode(secret));
        const [, , hashes] = users.enableMfa.mock.calls[0] as [string, string, string[]];
        users.findForMfa.mockResolvedValue(enrolled(hashes));

        await expect(service.verify("u1", plain[0]!.replace("-", "").toLowerCase())).resolves.toBe(true);
      });

      /**
       * Spent means gone. The service removes it from the list rather than
       * flagging it, so there is no state in which a used code still works —
       * this asserts the second presentation fails once it is no longer stored.
       */
      it("refuses one that has already been spent", async () => {
        const plain = await service.enable("u1", secret, currentCode(secret));
        const [, , hashes] = users.enableMfa.mock.calls[0] as [string, string, string[]];

        users.findForMfa.mockResolvedValue(enrolled(hashes.slice(1)));

        await expect(service.verify("u1", plain[0]!)).resolves.toBe(false);
      });
    });
  });

  describe("disabling", () => {
    it("requires the current password", async () => {
      users.findForMfa.mockResolvedValue({
        passwordHash: await UsersService.hashPassword("the-real-password"),
      });

      await expect(service.disable("u1", "not-the-password")).rejects.toBeInstanceOf(UnauthorizedException);
      expect(users.disableMfa).not.toHaveBeenCalled();
    });

    /**
     * Otherwise anyone at an unlocked laptop could remove the factor protecting
     * it, which would make the whole thing decorative.
     */
    it("turns it off with the right password", async () => {
      users.findForMfa.mockResolvedValue({
        passwordHash: await UsersService.hashPassword("the-real-password"),
      });

      await service.disable("u1", "the-real-password");
      expect(users.disableMfa).toHaveBeenCalledWith("u1");
    });
  });
});
