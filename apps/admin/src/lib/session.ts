import "server-only";

import { cookies } from "next/headers";

import { ACCESS_MAX_AGE, COOKIE_BASE, REFRESH_MAX_AGE, SESSION_COOKIES } from "./session-cookies";

/**
 * The staff session.
 *
 * Tokens live in **httpOnly cookies**, never in `localStorage` and never in a
 * JavaScript variable the page can read. The dashboard is where the school's
 * content, its enquiry inbox and its user list all live behind one login, so
 * the difference matters: a single injected script anywhere in this app could
 * read a token out of `localStorage` and use it from anywhere, and no amount of
 * care elsewhere would undo that. A cookie the browser will not hand to script
 * removes the entire class.
 *
 * This app is therefore a back-end-for-frontend: the browser talks to Next,
 * Next talks to the API with the bearer token, and the token never crosses into
 * the browser at all.
 */

const ACCESS_COOKIE = SESSION_COOKIES.access;
const REFRESH_COOKIE = SESSION_COOKIES.refresh;

/**
 * The cookie is deliberately longer-lived than the token inside it.
 *
 * The JWT expires on the API's schedule and the API still enforces that — this
 * is only how long the browser keeps the cookie. Matching the two meant the
 * cookie vanished at the same moment the token did, so the very next request
 * arrived with no credential at all. Keeping the cookie for the refresh window
 * instead means a lapsed token is *presented* and cleanly refused, which is the
 * path that recovers.
 *
 * A stale token in a cookie is not a risk: it is signed, expired, and the API
 * checks both.
 */
const BASE = COOKIE_BASE;

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** What is actually in the jar — either token may be absent independently. */
export interface StoredSession {
  accessToken: string | undefined;
  refreshToken: string | undefined;
}

export async function readSession(): Promise<StoredSession> {
  const jar = await cookies();

  return {
    accessToken: jar.get(ACCESS_COOKIE)?.value,
    refreshToken: jar.get(REFRESH_COOKIE)?.value,
  };
}

export async function writeSession(tokens: SessionTokens): Promise<void> {
  const jar = await cookies();

  jar.set(ACCESS_COOKIE, tokens.accessToken, { ...BASE, maxAge: ACCESS_MAX_AGE });
  jar.set(REFRESH_COOKIE, tokens.refreshToken, { ...BASE, maxAge: REFRESH_MAX_AGE });
}

/**
 * Whether a new session could actually be stored right now.
 *
 * Next permits `cookies().set()` in a Server Action or a Route Handler and
 * throws during a Server Component render. That asymmetry is dangerous here
 * rather than merely inconvenient, because the API rotates the refresh token on
 * every use and revokes the old one: refreshing somewhere the result cannot be
 * saved spends a token, throws the replacement away, and leaves the browser
 * holding one the API has already retired. The next request presents it, the
 * API reads a replay of a revoked token as theft, and the entire token family
 * is revoked — the editor is signed out of everything, immediately.
 *
 * So this is asked *before* refreshing, never after. The probe is a rewrite of
 * the cookie's own current value, which changes nothing when it succeeds.
 */
export async function canWriteSession(): Promise<boolean> {
  try {
    const jar = await cookies();
    const current = jar.get(ACCESS_COOKIE)?.value;
    if (current === undefined) return false;

    jar.set(ACCESS_COOKIE, current, { ...BASE, maxAge: ACCESS_MAX_AGE });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears both cookies.
 *
 * Deleting rather than expiring, and both together: leaving a refresh token
 * behind after a sign-out is leaving the session usable.
 */
export async function clearSession(): Promise<void> {
  const jar = await cookies();

  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}
