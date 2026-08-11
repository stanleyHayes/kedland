/**
 * The session cookie names and attributes, with no runtime dependencies.
 *
 * Separate from `session.ts` purely so middleware can import them. `session.ts`
 * imports `next/headers`, which does not exist in the middleware runtime, so
 * importing it there fails at build rather than politely doing nothing.
 */

export const SESSION_COOKIES = { access: "kedland_access", refresh: "kedland_refresh" } as const;

/** Matches the API's refresh-token lifetime, and so the length of a session. */
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * The access cookie lives as long as the session can.
 *
 * Derived from the refresh window rather than restated, because the one thing
 * that must never happen is the access cookie outliving it: that leaves the
 * dashboard holding a credential it has no way to renew, which presents as
 * being signed in until the moment anything is saved.
 */
export const ACCESS_MAX_AGE = REFRESH_MAX_AGE;

/**
 * `secure` is conditional only so that plain-HTTP localhost works. Anywhere
 * that is not development it is on, and `sameSite: "lax"` keeps the cookie off
 * cross-site requests while still surviving a normal top-level navigation back
 * into the dashboard.
 */
export const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;
