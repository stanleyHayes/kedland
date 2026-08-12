import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_MAX_AGE, COOKIE_BASE, REFRESH_MAX_AGE, SESSION_COOKIES } from "@/lib/session-cookies";

/**
 * Runs before the dashboard renders: turns away visitors with no session, and
 * renews the session of everyone else.
 *
 * Named `proxy`, in `proxy.ts`: Next 16 deprecated the `middleware` convention
 * in favour of this one, and ships a codemod for the rename.
 *
 * **The redirect here is a convenience, not the control.** This runs before the
 * app and all it can see is whether a cookie exists — not whether the token in
 * it is valid, expired, or belongs to an account that has since been suspended.
 * Treating that as authorisation would be a hole. The real check is
 * `requireUser()` in the dashboard layout and in each page, which asks the API.
 * All the redirect does is save an obviously signed-out visitor a round trip
 * that was always going to end in one.
 *
 * **The renewal, by contrast, has to happen here and nowhere else.** The API
 * rotates the refresh token on every use and revokes the old one, and treats a
 * replay of a spent token as theft by revoking the whole family. Two things
 * followed from that, and together they made the dashboard sign people out
 * every few minutes:
 *
 *  - A dashboard page fetches several things at once. When the access token
 *    lapsed, *every* one of those calls got a 401 and *every* one of them
 *    refreshed with the same token. The first rotated it; the rest presented a
 *    token that had just been revoked, which is indistinguishable from a replay
 *    attack. The session was not expiring — it was being destroyed.
 *  - A Server Component cannot write a cookie. Next permits that only in a
 *    Server Action or a Route Handler, so even the refresh that succeeded threw
 *    its replacement away and left the browser holding the revoked one.
 *
 * Here there is exactly one refresh per request, it happens before any
 * rendering, and cookies can be set on the response. So the render begins with
 * a token that is already valid and nothing races anything.
 */

/**
 * Renew this long before expiry.
 *
 * Long enough that a page's own API calls cannot watch the token lapse
 * underneath them mid-render, short enough not to rotate on every request.
 */
const RENEW_WITHIN_SECONDS = 120;

/** Bounded, so a slow API delays a page rather than hanging it open. */
const TIMEOUT_MS = 10_000;

function apiBase(): string {
  return (process.env["API_INTERNAL_URL"] ?? process.env["NEXT_PUBLIC_API_URL"] ?? "").replace(/\/$/, "");
}

/**
 * Whether a JWT is at or near its expiry.
 *
 * The payload is *read*, not trusted — nothing here decides access, it only
 * decides whether to ask for a new token. The API verifies the signature on
 * every call regardless, so a forged `exp` buys an attacker one pointless
 * refresh attempt. Anything unparseable counts as expired: asking for a fresh
 * token costs a round trip, and being wrong the other way costs the session.
 */
function needsRenewal(token: string): boolean {
  const payload = token.split(".")[1];
  if (!payload) return true;

  try {
    const json = atob(payload.replaceAll("-", "+").replaceAll("_", "/"));
    const { exp } = JSON.parse(json) as { exp?: unknown };
    if (typeof exp !== "number") return true;

    return exp * 1000 - Date.now() <= RENEW_WITHIN_SECONDS * 1000;
  } catch {
    return true;
  }
}

function toLogin(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.url));
  // Cleared on the way out, so the next request cannot present the same spent
  // token and be read as a replay of it.
  response.cookies.delete(SESSION_COOKIES.access);
  response.cookies.delete(SESSION_COOKIES.refresh);
  return response;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(SESSION_COOKIES.refresh)?.value;
  if (!refreshToken) return NextResponse.redirect(new URL("/login", request.url));

  const accessToken = request.cookies.get(SESSION_COOKIES.access)?.value;
  if (accessToken && !needsRenewal(accessToken)) return NextResponse.next();

  /*
   * Prefetches do not renew.
   *
   * Next prefetches links eagerly, so one page can put several requests in
   * flight at once. Letting each of them rotate the token recreates the exact
   * race this exists to remove — several holders of one refresh token, all but
   * the first looking like a thief. A prefetch rendering with a stale token is
   * harmless: it is a cache entry, not something anybody is looking at, and the
   * navigation that follows renews properly.
   */
  if (request.headers.get("next-router-prefetch") === "1") return NextResponse.next();

  let renewed: { accessToken: string; refreshToken: string };
  try {
    const response = await fetch(`${apiBase()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return toLogin(request);

    renewed = (await response.json()) as { accessToken: string; refreshToken: string };
  } catch {
    // The API being unreachable is not the same as the session being over, and
    // must not sign anybody out. Carry on with what we have; the page reports
    // the outage itself.
    return NextResponse.next();
  }

  // The render has to see the new token rather than the stale one the request
  // arrived with, or its first API call 401s and refreshes all over again.
  request.cookies.set(SESSION_COOKIES.access, renewed.accessToken);
  request.cookies.set(SESSION_COOKIES.refresh, renewed.refreshToken);

  const next = NextResponse.next({ request: { headers: request.headers } });
  next.cookies.set(SESSION_COOKIES.access, renewed.accessToken, {
    ...COOKIE_BASE,
    maxAge: ACCESS_MAX_AGE,
  });
  next.cookies.set(SESSION_COOKIES.refresh, renewed.refreshToken, {
    ...COOKIE_BASE,
    maxAge: REFRESH_MAX_AGE,
  });

  return next;
}

export const config = {
  /*
   * Everything except the login page and public/static assets.
   *
   * `login` has to be excluded or a signed-out visitor is redirected to a page
   * that redirects them again, forever.
   */
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|logo|fonts|images).*)"],
};
