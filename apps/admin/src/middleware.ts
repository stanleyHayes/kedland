import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

import { ACCESS_MAX_AGE, COOKIE_BASE, REFRESH_MAX_AGE, SESSION_COOKIES } from "@/lib/session-cookies";

/**
 * Renews the staff session before the page renders.
 *
 * This exists because of how the API issues refresh tokens: every refresh
 * rotates the token and revokes the old one, and presenting a revoked token is
 * treated as theft — the whole token family is revoked and the editor is signed
 * out on the spot. That policy is right, and it made the dashboard unusable for
 * two compounding reasons.
 *
 * A dashboard page fetches several things at once. When the access token
 * lapsed, *every* one of those calls got a 401 and *every* one of them called
 * refresh with the same token. The first rotated it; the rest presented a token
 * that had just been revoked, which looked exactly like a replay attack. The
 * session did not expire — it was destroyed, within a second, several times an
 * hour.
 *
 * The second reason is that a Server Component cannot write a cookie. Next only
 * permits that in a Server Action or a Route Handler, so even the refresh that
 * *did* succeed threw its new token away, leaving the browser holding the old
 * revoked one for next time.
 *
 * Middleware answers both. It runs once per request, before any rendering, and
 * it can set cookies on the response. So there is one refresh, its result is
 * persisted, and the render begins with a token that is already valid.
 */

/**
 * Renew this long before expiry.
 *
 * Long enough that a page's own API calls cannot watch the token lapse
 * underneath them mid-render, short enough not to rotate on every request.
 */
const RENEW_WITHIN_SECONDS = 120;

/** Bounded so a slow API delays a page rather than hanging it open. */
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

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(SESSION_COOKIES.refresh)?.value;
  // Nobody signed in. The page's own redirect handles it; this is not the place
  // to decide who may see what.
  if (!refreshToken) return NextResponse.next();

  const accessToken = request.cookies.get(SESSION_COOKIES.access)?.value;
  if (accessToken && !needsRenewal(accessToken)) return NextResponse.next();

  /*
   * Prefetches do not renew.
   *
   * Next prefetches links eagerly, so a single page can put several requests in
   * flight at once. Letting each of them rotate the token would recreate the
   * exact race this file exists to remove — several holders of one refresh
   * token, all but the first looking like a thief. A prefetch that renders with
   * a stale token is harmless: it is a cache entry, not something anybody is
   * looking at, and the navigation that follows renews properly.
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

    // A refused refresh is a finished session. Clearing the cookies is what
    // stops the next request presenting the same dead token and being read as
    // a replay of it.
    if (!response.ok) return signedOut(request);

    renewed = (await response.json()) as { accessToken: string; refreshToken: string };
  } catch {
    // The API being unreachable is not the same as the session being over, and
    // must not sign anybody out. Carry on with what we have; the page will
    // report the outage itself.
    return NextResponse.next();
  }

  // The render has to see the new token, not the stale one it arrived with, or
  // its first API call 401s and refreshes all over again.
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

function signedOut(request: NextRequest): NextResponse {
  const response = NextResponse.next({ request: { headers: request.headers } });
  request.cookies.delete(SESSION_COOKIES.access);
  request.cookies.delete(SESSION_COOKIES.refresh);
  response.cookies.delete(SESSION_COOKIES.access);
  response.cookies.delete(SESSION_COOKIES.refresh);
  return response;
}

/**
 * Everything except static assets and the sign-in page.
 *
 * `/login` is excluded because renewing a session on the way to signing in is
 * either pointless or actively confusing.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/health).*)"],
};
