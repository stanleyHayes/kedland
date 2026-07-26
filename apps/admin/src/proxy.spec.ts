import { describe, expect, it, vi } from "vitest";

import { config, proxy } from "./proxy";

const redirect = vi.fn((url: URL) => ({ redirected: url.pathname }));
const next = vi.fn(() => ({ passed: true }));

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL) => redirect(url),
    next: () => next(),
  },
}));

/** The bits of NextRequest this reads. */
function request(hasCookie: boolean, url = "http://localhost:3001/posts"): never {
  return { cookies: { has: () => hasCookie }, url } as never;
}

/**
 * A convenience, not a control.
 *
 * It can only see whether a cookie exists — not whether the token is valid,
 * expired, or belongs to a suspended account. `requireUser()` in the layout and
 * each page is what actually decides; this saves an obviously signed-out
 * visitor a round trip.
 */
describe("proxy", () => {
  it("sends a visitor with no session to sign in", () => {
    proxy(request(false));
    expect(redirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/login" }));
  });

  it("lets a request carrying a session through", () => {
    proxy(request(true));
    expect(next).toHaveBeenCalled();
  });

  it("keeps public images outside the authentication matcher", () => {
    expect(config.matcher[0]).toContain("|images");
  });
});
