import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as ApiModule from "./api";

const apiFetch = vi.fn();
const readSession = vi.fn();
const redirect = vi.fn((_to: string) => {
  // Next's `redirect` throws to unwind the render; mirroring that keeps the
  // control flow of `requireUser` honest under test.
  throw new Error("NEXT_REDIRECT");
});

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof ApiModule>()),
  apiFetch: (path: string) => apiFetch(path) as unknown,
}));
vi.mock("./session", () => ({ readSession: () => readSession() as unknown }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));

const { ApiError } = await import("./api");
const { currentUser, requireAdmin, requireUser } = await import("./auth");

const ADMIN = {
  id: "1",
  email: "a@b.c",
  displayName: "Mary",
  role: "admin",
  roleSlug: "admin",
  permissions: [],
  status: "active",
};

describe("currentUser", () => {
  beforeEach(() => {
    readSession.mockResolvedValue({ accessToken: "a", refreshToken: "r" });
    apiFetch.mockReset();
    apiFetch.mockResolvedValue(ADMIN);
    redirect.mockClear();
  });

  it("returns the account the API reports", async () => {
    await expect(currentUser()).resolves.toEqual(ADMIN);
  });

  /**
   * Asked of the API rather than decoded from the JWT here. Decoding locally
   * would keep showing a suspended account as signed in until its token
   * expired; only the API knows whether they are still allowed in now.
   */
  it("asks the API rather than trusting the cookie", async () => {
    await currentUser();
    expect(apiFetch).toHaveBeenCalledWith("/auth/me");
  });

  it("does not call the API at all when there is no session", async () => {
    readSession.mockResolvedValue({ accessToken: undefined, refreshToken: undefined });

    await expect(currentUser()).resolves.toBeNull();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("reports a rejected session as signed out", async () => {
    apiFetch.mockRejectedValue(new ApiError(401, "expired"));
    await expect(currentUser()).resolves.toBeNull();
  });

  it("lets an unexpected error through rather than swallowing it as signed out", async () => {
    apiFetch.mockRejectedValue(new TypeError("something else entirely"));
    await expect(currentUser()).rejects.toThrow(TypeError);
  });
});

describe("requireUser", () => {
  beforeEach(() => {
    readSession.mockResolvedValue({ accessToken: "a", refreshToken: "r" });
    redirect.mockClear();
  });

  it("returns the account when signed in", async () => {
    apiFetch.mockResolvedValue(ADMIN);
    await expect(requireUser()).resolves.toEqual(ADMIN);
  });

  it("sends a signed-out visitor to sign in", async () => {
    apiFetch.mockRejectedValue(new ApiError(401, "expired"));

    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    readSession.mockResolvedValue({ accessToken: "a", refreshToken: "r" });
    redirect.mockClear();
  });

  it("lets an administrator through", async () => {
    apiFetch.mockResolvedValue(ADMIN);
    await expect(requireAdmin()).resolves.toEqual(ADMIN);
  });

  /**
   * To the dashboard, not to sign-in. An editor here is signed in correctly and
   * simply not allowed on this page; a login form would suggest otherwise.
   */
  it("sends an editor to the dashboard rather than to sign in", async () => {
    apiFetch.mockResolvedValue({ ...ADMIN, role: "editor" });

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
