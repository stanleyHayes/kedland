import "server-only";

import { cookies } from "next/headers";

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

const ACCESS_COOKIE = "kedland_access";
const REFRESH_COOKIE = "kedland_refresh";

/** Matches the API's access-token lifetime. */
const ACCESS_MAX_AGE = 15 * 60;
/** Matches the API's refresh-token lifetime. */
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * `secure` is conditional only so that plain-HTTP localhost works. Anywhere
 * that is not development it is on, and `sameSite: "lax"` keeps the cookie off
 * cross-site requests while still surviving a normal top-level navigation back
 * into the dashboard.
 */
const BASE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

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

export const SESSION_COOKIES = { access: ACCESS_COOKIE, refresh: REFRESH_COOKIE } as const;
