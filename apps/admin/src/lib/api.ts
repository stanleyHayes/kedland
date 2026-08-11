import "server-only";

import { canWriteSession, readSession, writeSession } from "./session";

/**
 * The dashboard's API client.
 *
 * Server-side only. Every call attaches the access token from the session
 * cookie, and a 401 is retried once against the refresh endpoint before it is
 * reported — the access token lives fifteen minutes, and an editor halfway
 * through writing a post should not be thrown back to a login screen because
 * of it.
 *
 * Nothing here is cached. The dashboard's whole job is to show what is true
 * right now, and a stale enquiry list or a draft that reappears after deletion
 * would be worse than a slower page.
 */

const TIMEOUT_MS = 10_000;

function baseUrl(): string {
  const url = process.env["API_INTERNAL_URL"] ?? process.env["NEXT_PUBLIC_API_URL"] ?? "";
  return url.replace(/\/$/, "");
}

/** A failed call, carrying enough for a surface to say something useful. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Field-keyed messages from the API's problem details, when it sent them. */
    readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ProblemBody {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

async function problemFrom(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ProblemBody;
    return new ApiError(
      response.status,
      body.detail ?? body.title ?? `Request failed (${String(response.status)})`,
      body.errors,
    );
  } catch {
    return new ApiError(response.status, `Request failed (${String(response.status)})`);
  }
}

/**
 * Exchanges the refresh token for a new pair.
 *
 * Renewal normally happens in `middleware.ts`, before anything renders. This is
 * the fallback for the case middleware cannot see: a token it judged healthy
 * that the API rejects anyway, because permissions or a password changed since
 * it was issued.
 *
 * @returns the new access token, or null when the session is over — or when the
 *          result could not be stored, which for this API amounts to the same
 *          thing. Refreshing spends the token and revokes the old one, so doing
 *          it somewhere the replacement cannot be saved would leave the browser
 *          replaying a revoked token and get the whole family revoked as theft.
 *          Better to send the editor back to sign in than to sign them out of
 *          every session they have.
 */
async function refresh(): Promise<string | null> {
  const { refreshToken } = await readSession();
  if (!refreshToken) return null;
  if (!(await canWriteSession())) return null;

  try {
    const response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const tokens = (await response.json()) as { accessToken: string; refreshToken: string };

    /*
     * This must not fail: `canWriteSession()` above established that cookies
     * are writable here, which is the whole reason the refresh was allowed to
     * happen at all.
     *
     * It is still guarded, because the consequence of being wrong is not a lost
     * write but a lost *session*. The replacement token is the only usable one
     * from here on — the API revoked the old one the moment it issued this —
     * so if it cannot be stored, the honest answer is that the session is over,
     * not that this one request succeeded.
     */
    try {
      await writeSession(tokens);
    } catch {
      return null;
    }

    return tokens.accessToken;
  } catch {
    return null;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Set false for the few calls that are fine unauthenticated. */
  authenticated?: boolean;
}

/**
 * Calls the API.
 *
 * @throws ApiError on any non-2xx, including 401 after a failed refresh, so a
 *         surface never renders as though a call succeeded when it did not.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, authenticated = true } = options;

  const send = async (token: string | undefined): Promise<Response> => {
    return fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  };

  const { accessToken } = authenticated ? await readSession() : { accessToken: undefined };

  let response: Response;
  try {
    response = await send(accessToken);
  } catch (error) {
    // A timeout or a DNS failure, not an HTTP status. Said plainly, because
    // "fetch failed" in a dashboard tells an editor nothing.
    throw new ApiError(
      503,
      `Could not reach the API (${error instanceof Error ? error.message : "unknown"})`,
    );
  }

  // One retry, and only for 401. Retrying anything else risks repeating a write.
  if (response.status === 401 && authenticated) {
    const renewed = await refresh();
    if (renewed === null) throw new ApiError(401, "Your session has expired. Please sign in again.");

    response = await send(renewed);
  }

  if (!response.ok) throw await problemFrom(response);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
