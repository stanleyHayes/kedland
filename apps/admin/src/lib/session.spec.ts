import { beforeEach, describe, expect, it, vi } from "vitest";

const jar = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({ cookies: () => Promise.resolve(jar) }));

const { clearSession, readSession, writeSession } = await import("./session");

const TOKENS = { accessToken: "access-token", refreshToken: "refresh-token" };

/** The options `set` was called with for a named cookie. */
function optionsFor(name: string): Record<string, unknown> {
  const call = jar.set.mock.calls.find(([cookie]) => cookie === name);
  return (call?.[2] ?? {}) as Record<string, unknown>;
}

describe("the staff session", () => {
  beforeEach(() => {
    jar.get.mockReset();
    jar.set.mockReset();
    jar.delete.mockReset();
  });

  /**
   * The reason tokens are in cookies rather than `localStorage`. A single
   * injected script anywhere in this app could read a token out of storage and
   * use it from anywhere; a cookie the browser will not hand to script removes
   * the whole class of problem.
   */
  it("keeps both tokens out of JavaScript's reach", async () => {
    await writeSession(TOKENS);

    expect(optionsFor("kedland_access")["httpOnly"]).toBe(true);
    expect(optionsFor("kedland_refresh")["httpOnly"]).toBe(true);
  });

  it("keeps the cookies off cross-site requests", async () => {
    await writeSession(TOKENS);
    expect(optionsFor("kedland_access")["sameSite"]).toBe("lax");
  });

  it("scopes them to the whole dashboard, not one path", async () => {
    await writeSession(TOKENS);
    expect(optionsFor("kedland_access")["path"]).toBe("/");
  });

  /**
   * The access cookie is not the short-lived half of the pair — the token
   * inside it is. Expiring the cookie early was what logged staff out after a
   * few minutes: the credential disappeared from the browser instead of being
   * presented and refused, and the refusal is the path that recovers.
   *
   * What must still hold is the other direction. An access cookie outliving
   * the refresh cookie leaves the dashboard holding a credential it cannot
   * renew, which looks like a working session until something is saved.
   */
  it("never lets the access cookie outlive the refresh cookie", async () => {
    await writeSession(TOKENS);

    const access = optionsFor("kedland_access")["maxAge"] as number;
    const refresh = optionsFor("kedland_refresh")["maxAge"] as number;

    expect(access).toBeLessThanOrEqual(refresh);
  });

  /** An hour of inactivity is the floor the school asked for; this is a week. */
  it("keeps a session alive far longer than an hour of inactivity", async () => {
    await writeSession(TOKENS);

    expect(optionsFor("kedland_access")["maxAge"]).toBeGreaterThan(60 * 60);
    expect(optionsFor("kedland_refresh")["maxAge"]).toBeGreaterThan(60 * 60);
  });

  it("reads back what it wrote", async () => {
    jar.get.mockImplementation((name: string) =>
      name === "kedland_access" ? { value: "a" } : { value: "r" },
    );

    await expect(readSession()).resolves.toEqual({ accessToken: "a", refreshToken: "r" });
  });

  it("reports an absent cookie as undefined rather than throwing", async () => {
    jar.get.mockReturnValue(undefined);

    await expect(readSession()).resolves.toEqual({
      accessToken: undefined,
      refreshToken: undefined,
    });
  });

  /**
   * Both, together. Leaving the refresh token behind after a sign-out leaves
   * the session usable — which matters most on the shared office computer this
   * dashboard will actually be used from.
   */
  it("clears both tokens on sign-out", async () => {
    await clearSession();

    expect(jar.delete).toHaveBeenCalledWith("kedland_access");
    expect(jar.delete).toHaveBeenCalledWith("kedland_refresh");
  });
});
