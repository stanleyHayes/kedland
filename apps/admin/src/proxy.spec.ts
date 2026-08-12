import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

import { SESSION_COOKIES } from "@/lib/session-cookies";

/**
 * Session renewal.
 *
 * The behaviour being pinned is not "a token gets refreshed" — it is *how often*
 * and *from where*. The API rotates the refresh token on every use and treats a
 * replay of a spent one as theft, revoking the whole family. So a second refresh
 * with the same token does not merely waste a round trip: it destroys the
 * session. Most of these tests exist to prove that does not happen.
 */

/** A JWT whose payload is readable and whose `exp` is `secondsFromNow` away. */
function token(secondsFromNow: number): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + secondsFromNow };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${encoded}.signature`;
}

function request(cookies: Record<string, string>, headers: Record<string, string> = {}): NextRequest {
  const req = new NextRequest("https://admin.test/posts", { headers: new Headers(headers) });
  for (const [name, value] of Object.entries(cookies)) req.cookies.set(name, value);
  return req;
}

const RENEWED = { accessToken: token(3600), refreshToken: "refresh-2" };

describe("proxy", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("API_INTERNAL_URL", "http://api.test/api/v1");
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(RENEWED) });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("sends a visitor with no session to sign in, without calling the API", async () => {
    const response = await proxy(request({}));

    expect(response.headers.get("location")).toContain("/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /** The common case by far, and it must not cost a round trip or a rotation. */
  it("leaves a healthy token alone", async () => {
    await proxy(request({ [SESSION_COOKIES.access]: token(3000), [SESSION_COOKIES.refresh]: "r1" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renews an expired token and persists both halves", async () => {
    const response = await proxy(
      request({ [SESSION_COOKIES.access]: token(-30), [SESSION_COOKIES.refresh]: "r1" }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.cookies.get(SESSION_COOKIES.access)?.value).toBe(RENEWED.accessToken);
    // The half that was being lost: without this the browser keeps presenting a
    // token the API has already revoked, which reads as a replay attack.
    expect(response.cookies.get(SESSION_COOKIES.refresh)?.value).toBe(RENEWED.refreshToken);
  });

  it("renews shortly before expiry, not after", async () => {
    await proxy(request({ [SESSION_COOKIES.access]: token(30), [SESSION_COOKIES.refresh]: "r1" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renews when the access cookie has gone entirely", async () => {
    await proxy(request({ [SESSION_COOKIES.refresh]: "r1" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  /**
   * Next prefetches links eagerly. Letting each prefetch rotate the token
   * recreates the very race this file removes — several requests holding one
   * refresh token, all but the first looking like a thief.
   */
  it("never renews for a prefetch", async () => {
    await proxy(
      request(
        { [SESSION_COOKIES.access]: token(-30), [SESSION_COOKIES.refresh]: "r1" },
        { "next-router-prefetch": "1" },
      ),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends them to sign in, and clears the spent token, when the refresh is refused", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    const response = await proxy(
      request({ [SESSION_COOKIES.access]: token(-30), [SESSION_COOKIES.refresh]: "spent" }),
    );

    expect(response.headers.get("location")).toContain("/login");
    // Deleted, not left in place: leaving the spent token would have the next
    // request replay it and be read as theft.
    expect(response.cookies.get(SESSION_COOKIES.access)?.value).toBe("");
    expect(response.cookies.get(SESSION_COOKIES.refresh)?.value).toBe("");
  });

  /**
   * An unreachable API is an outage, not the end of a session. Signing everyone
   * out because the API blinked would turn a blip into a support call.
   */
  it("keeps the session when the API cannot be reached", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    const response = await proxy(
      request({ [SESSION_COOKIES.access]: token(-30), [SESSION_COOKIES.refresh]: "r1" }),
    );

    expect(response.cookies.get(SESSION_COOKIES.access)).toBeUndefined();
    expect(response.cookies.get(SESSION_COOKIES.refresh)).toBeUndefined();
  });

  /** A token that cannot be read is treated as spent, never as good. */
  it("renews rather than trusting a token it cannot parse", async () => {
    await proxy(request({ [SESSION_COOKIES.access]: "not-a-jwt", [SESSION_COOKIES.refresh]: "r1" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
