import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readSession = vi.fn();
const writeSession = vi.fn();
/**
 * Whether cookies can be written here.
 *
 * `refresh()` asks this *before* spending the refresh token, because the API
 * revokes the old one as it issues the new. Refreshing where the replacement
 * cannot be stored would leave the browser replaying a revoked token, which the
 * API reads as theft and answers by revoking every session the editor has.
 */
const canWriteSession = vi.fn(() => Promise.resolve(true));

vi.mock("./session", () => ({
  readSession: () => readSession() as unknown,
  writeSession: (tokens: unknown) => writeSession(tokens) as unknown,
  canWriteSession: () => canWriteSession() as unknown,
}));

const { ApiError, apiFetch } = await import("./api");

const ok = (body: unknown): Response =>
  ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as Response;

const status = (code: number, body: unknown = {}): Response =>
  ({ ok: false, status: code, json: () => Promise.resolve(body) }) as Response;

describe("apiFetch", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    readSession.mockResolvedValue({ accessToken: "access", refreshToken: "refresh" });
    writeSession.mockResolvedValue(undefined);
    canWriteSession.mockReset().mockResolvedValue(true);
    fetchMock = vi.fn().mockResolvedValue(ok({ id: "1" }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_INTERNAL_URL", "http://api.test/api/v1");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function headersOf(call = 0): Record<string, string> {
    const [, init] = fetchMock.mock.calls[call] as [string, { headers: Record<string, string> }];
    return init.headers;
  }

  it("sends the access token", async () => {
    await apiFetch("/auth/me");
    expect(headersOf()["Authorization"]).toBe("Bearer access");
  });

  it("sends no token for a call that does not need one", async () => {
    await apiFetch("/auth/login", { method: "POST", body: {}, authenticated: false });
    expect(headersOf()["Authorization"]).toBeUndefined();
  });

  it("never caches — the dashboard shows what is true now", async () => {
    // A stale enquiry list, or a draft that reappears after deletion, would be
    // worse than a slower page.
    await apiFetch("/auth/me");
    const [, init] = fetchMock.mock.calls[0] as [string, { cache: string }];

    expect(init.cache).toBe("no-store");
  });

  describe("when the access token has expired", () => {
    beforeEach(() => {
      fetchMock
        .mockResolvedValueOnce(status(401))
        .mockResolvedValueOnce(ok({ accessToken: "fresh", refreshToken: "fresh-refresh" }))
        .mockResolvedValueOnce(ok({ id: "1" }));
    });

    /**
     * The access token lives fifteen minutes. An editor halfway through writing
     * a post should not be thrown back to a login screen because of it.
     */
    it("refreshes and retries once, transparently", async () => {
      await expect(apiFetch("/auth/me")).resolves.toEqual({ id: "1" });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(headersOf(2)["Authorization"]).toBe("Bearer fresh");
    });

    it("stores the new pair, so the next request does not repeat the dance", async () => {
      await apiFetch("/auth/me");
      expect(writeSession).toHaveBeenCalledWith({
        accessToken: "fresh",
        refreshToken: "fresh-refresh",
      });
    });
  });

  it("gives up honestly when the refresh itself has expired", async () => {
    fetchMock.mockResolvedValueOnce(status(401)).mockResolvedValueOnce(status(401));

    await expect(apiFetch("/auth/me")).rejects.toThrow(/session has expired/i);
  });

  /**
   * The refresh token is spent by using it, and the API revokes the old one as
   * it issues the replacement. So refreshing somewhere the replacement cannot
   * be stored is worse than not refreshing at all: the browser goes on holding
   * a revoked token, the next request replays it, and the API — reading a
   * replay as theft — revokes every session the editor has. Renewal belongs in
   * middleware, which runs before the render and can set cookies.
   */
  it("will not spend the refresh token where the new one cannot be stored", async () => {
    canWriteSession.mockResolvedValueOnce(false);
    fetchMock.mockResolvedValueOnce(status(401));

    await expect(apiFetch("/auth/me")).rejects.toThrow(/session has expired/i);

    // One call: the original request. No refresh was attempted.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry anything other than a 401", async () => {
    // Retrying a 500 on a POST risks performing the write twice.
    fetchMock.mockResolvedValue(status(500));

    await expect(apiFetch("/posts", { method: "POST", body: {} })).rejects.toThrow(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("carries the API's field-level errors through, for the form to use", async () => {
    fetchMock.mockResolvedValue(status(400, { errors: { title: ["Required"] } }));

    const thrown = await apiFetch("/posts", { method: "POST", body: {} }).then(
      () => undefined,
      (error: unknown) => error as InstanceType<typeof ApiError>,
    );

    expect(thrown?.errors).toEqual({ title: ["Required"] });
  });

  it("says plainly when the API cannot be reached at all", async () => {
    // "fetch failed" in a dashboard tells an editor nothing.
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(apiFetch("/auth/me")).rejects.toThrow(/Could not reach the API/);
  });

  it("returns nothing for a 204, rather than trying to parse a body", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204 });

    await expect(apiFetch("/posts/1", { method: "DELETE" })).resolves.toBeUndefined();
  });
});
