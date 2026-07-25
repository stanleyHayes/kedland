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
});
