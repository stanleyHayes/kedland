import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as ApiModule from "@/lib/api";

const apiFetch = vi.fn();
const writeSession = vi.fn();
const clearSession = vi.fn();
const redirect = vi.fn((_to: string) => {
  // Next's `redirect` throws to unwind the render; mirroring that keeps the
  // control flow under test honest.
  throw new Error("NEXT_REDIRECT");
});

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof ApiModule>()),
  apiFetch: (path: string, options?: unknown) => apiFetch(path, options) as unknown,
}));
vi.mock("@/lib/session", () => ({
  writeSession: (t: unknown) => writeSession(t) as unknown,
  clearSession: () => clearSession() as unknown,
}));
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));

const { ApiError } = await import("@/lib/api");
const { signIn, signOut } = await import("./actions");

const TOKENS = { accessToken: "a", refreshToken: "r", user: { id: "1" } };

function form(email: string, password: string): FormData {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

describe("signIn", () => {
  beforeEach(() => {
    apiFetch.mockReset().mockResolvedValue(TOKENS);
    writeSession.mockReset();
    redirect.mockReset().mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("stores the session and sends the editor to the dashboard", async () => {
    await expect(signIn({}, form("mary@kedland.edu.gh", "correct-horse"))).rejects.toThrow("NEXT_REDIRECT");

    expect(writeSession).toHaveBeenCalledWith(TOKENS);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("asks for both fields before troubling the API", async () => {
    await expect(signIn({}, form("", ""))).resolves.toEqual({
      error: "Enter your email address and password.",
    });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  /**
   * One message for every rejection. Telling "no such account" apart from
   * "wrong password" is an enumeration oracle — somebody can discover which
   * staff addresses exist by watching which error comes back. The API answers
   * both in constant time for the same reason.
   */
  it.each([400, 401, 403, 404])("gives nothing away when the API returns %s", async (code) => {
    apiFetch.mockRejectedValue(new ApiError(code, "whatever the API said"));

    await expect(signIn({}, form("someone@example.com", "guess"))).resolves.toEqual({
      error: "That email address and password do not match an account.",
    });
  });

  it("explains a rate limit, which is not about the credentials", async () => {
    apiFetch.mockRejectedValue(new ApiError(429, "slow down"));

    const state = await signIn({}, form("mary@kedland.edu.gh", "correct-horse"));
    expect(state.error).toMatch(/too many attempts/i);
  });

  it("distinguishes the server being down from a bad password", async () => {
    apiFetch.mockRejectedValue(new ApiError(503, "unreachable"));

    const state = await signIn({}, form("mary@kedland.edu.gh", "correct-horse"));
    expect(state.error).toMatch(/could not reach/i);
  });

  it("never stores a session when sign-in failed", async () => {
    apiFetch.mockRejectedValue(new ApiError(401, "nope"));

    await signIn({}, form("someone@example.com", "guess"));
    expect(writeSession).not.toHaveBeenCalled();
  });

  it("ignores a non-string field rather than stringifying it", async () => {
    // A crafted multipart body can send a File, which becomes "[object File]".
    const data = new FormData();
    data.set("email", new File([], "x"));
    data.set("password", "something");

    await expect(signIn({}, data)).resolves.toEqual({
      error: "Enter your email address and password.",
    });
  });
});

describe("signOut", () => {
  beforeEach(() => {
    apiFetch.mockReset().mockResolvedValue(undefined);
    clearSession.mockReset();
    redirect.mockReset().mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("revokes the token server-side, not just locally", async () => {
    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");
    expect(apiFetch).toHaveBeenCalledWith("/auth/logout", expect.objectContaining({ method: "POST" }));
  });

  /**
   * Somebody pressing "sign out" on the shared office computer needs the
   * cookies gone whether or not the API answered.
   */
  it("clears the session even when the API call fails", async () => {
    apiFetch.mockRejectedValue(new ApiError(503, "unreachable"));

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");
    expect(clearSession).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
