/**
 * The site's Content-Security-Policy.
 *
 * Lives here rather than inline in `next.config.ts` so it can be tested. The
 * one bug this file exists to prevent cost a working contact form: the browser
 * refuses a `fetch` that `connect-src` does not allow, *before* making it, so
 * nothing on the server ever sees a request and no unit test, type check or
 * build catches it. Only opening a real browser does.
 *
 * The API is on a different origin from the site in every environment — Render
 * and Vercel — so `'self'` never covers it.
 */

export interface CspOptions {
  /** The public API base URL, e.g. `https://api.kedland.edu.gh/api/v1`. */
  apiUrl?: string | undefined;
  /** React's development build uses `eval()`; the production build never does. */
  isDev?: boolean;
}

/** The origin of a URL, or "" if it is absent or unparseable. */
function originOf(url: string | undefined): string {
  if (!url) return "";

  try {
    return new URL(url).origin;
  } catch {
    // A malformed value must not take the whole build down. The form will fail
    // loudly in the browser, which is where a bad API URL belongs.
    return "";
  }
}

const TURNSTILE = "https://challenges.cloudflare.com";
const CLOUDINARY = "https://res.cloudinary.com";

export function buildCsp({ apiUrl, isDev = false }: CspOptions = {}): string {
  const api = originOf(apiUrl);

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${TURNSTILE}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${CLOUDINARY}`,
    "font-src 'self'",
    ["connect-src 'self'", api, TURNSTILE].filter(Boolean).join(" "),
    `frame-src ${TURNSTILE}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}
