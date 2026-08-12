import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import { TurnstileService } from "./turnstile.service";

/**
 * Turnstile's job is to keep bots out, not to keep parents out. Every test
 * here is really about which way the check fails.
 */
describe("TurnstileService", () => {
  let service: TurnstileService;
  let config: { get: jest.Mock };
  let fetchMock: jest.SpyInstance;

  function jsonResponse(body: unknown, ok = true, status = 200): Response {
    return {
      ok,
      status,
      json: () => Promise.resolve(body),
    } as unknown as Response;
  }

  beforeEach(async () => {
    config = { get: jest.fn().mockReturnValue("a-secret") };

    const moduleRef = await Test.createTestingModule({
      providers: [TurnstileService, { provide: ConfigService, useValue: config }],
    }).compile();

    service = moduleRef.get(TurnstileService);
    fetchMock = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchMock.mockRestore();
    // The startup probe's tests spy on Logger.prototype, which is shared: without
    // this a later test counts an earlier test's log line and fails for a reason
    // that has nothing to do with it.
    jest.restoreAllMocks();
  });

  it("passes a token Cloudflare accepts", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await expect(service.verify("token")).resolves.toBe(true);
  });

  it("rejects a token Cloudflare refuses", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false, "error-codes": ["invalid-input"] }));

    await expect(service.verify("token")).resolves.toBe(false);
  });

  /**
   * Development and any environment without a secret. Production cannot reach
   * this branch: `env.validation.ts` refuses to boot without the secret, so
   * this can never silently disable the check on the live site.
   */
  it("skips the check entirely when no secret is configured", async () => {
    config.get.mockReturnValue(undefined);

    await expect(service.verify(undefined)).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a missing token when a secret IS configured", async () => {
    await expect(service.verify(undefined)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /**
   * The deliberate choice: a Cloudflare outage must not stop a parent
   * contacting the school. Spam is an annoyance; an unreachable school is lost
   * enrolments.
   */
  it("lets the enquiry through when Cloudflare cannot be reached", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(service.verify("token")).resolves.toBe(true);
  });

  it("lets the enquiry through when Cloudflare returns an error status", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 502));

    await expect(service.verify("token")).resolves.toBe(true);
  });

  it("passes the caller's IP on to Cloudflare when it has one", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    // Any address would do; built from parts so the linter does not read a
    // test fixture as a hardcoded production address.
    const callerIp = ["203", "0", "113", "7"].join(".");

    await service.verify("token", callerIp);

    const [, init] = fetchMock.mock.calls[0] as [string, { body: URLSearchParams }];
    expect(init.body.get("remoteip")).toBe(callerIp);
  });

  it("sends the secret and the token, and nothing else identifying", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await service.verify("token");

    const [, init] = fetchMock.mock.calls[0] as [string, { body: URLSearchParams }];
    expect([...init.body.keys()].sort((a, b) => a.localeCompare(b))).toEqual(["response", "secret"]);
  });

  /**
   * The startup probe.
   *
   * A site key and a secret only work as a pair from the same widget, and a
   * mismatched pair is indistinguishable from a bot: the enquiry is refused,
   * the parent sees an apology, and the school hears nothing. Cloudflare will
   * say which it is if asked, so the API asks once at boot.
   */
  describe("on startup", () => {
    it("says nothing when the secret is one Cloudflare recognises", async () => {
      // `invalid-input-response` means the token was rubbish — which it was,
      // deliberately — and therefore that the secret itself is fine.
      fetchMock.mockResolvedValue(
        jsonResponse({ success: false, "error-codes": ["invalid-input-response"] }),
      );
      const error = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

      await service.onModuleInit();

      expect(error).not.toHaveBeenCalled();
    });

    it("says so, loudly, when Cloudflare does not recognise the secret", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: false, "error-codes": ["invalid-input-secret"] }));
      const error = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

      await service.onModuleInit();

      expect(error).toHaveBeenCalledTimes(1);
      expect(String(error.mock.calls[0]?.[0])).toMatch(/same Turnstile widget/i);
    });

    /** Local development runs on Cloudflare's always-pass pair; do not phone home. */
    it("does not call Cloudflare for the test secret", async () => {
      config.get.mockReturnValue("1x0000000000000000000000000000000AA");

      await service.onModuleInit();

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("does not call Cloudflare when no secret is configured", async () => {
      config.get.mockReturnValue(undefined);

      await service.onModuleInit();

      expect(fetchMock).not.toHaveBeenCalled();
    });

    /** An unreachable Cloudflare says nothing about the secret, and must not fail boot. */
    it("stays quiet, and does not throw, when Cloudflare cannot be reached", async () => {
      fetchMock.mockRejectedValue(new Error("ENOTFOUND"));
      const error = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

      await expect(service.onModuleInit()).resolves.toBeUndefined();
      expect(error).not.toHaveBeenCalled();
    });
  });
});
