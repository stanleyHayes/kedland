import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const revalidateTag = vi.fn<(tag: string, profile: unknown) => undefined>();
const revalidatePath = vi.fn<(path: string) => undefined>();

vi.mock("next/cache", () => ({
  revalidateTag: (tag: string, profile: unknown): undefined => {
    revalidateTag(tag, profile);
  },
  revalidatePath: (path: string): undefined => {
    revalidatePath(path);
  },
}));

const SECRET = "a-development-secret";

/**
 * `null` means the header is absent; a string means it carries that value.
 *
 * Not `undefined`: passing `undefined` to a parameter with a default *uses the
 * default*, so an "absent secret" case written that way silently sends the
 * correct one and passes for the wrong reason.
 */
function request(body: unknown, secret: string | null = SECRET): Request {
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers: secret === null ? {} : { "x-revalidate-secret": secret },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/**
 * The cache-purge endpoint.
 *
 * It is the one route on the public site that accepts a write of any kind, so
 * everything worth testing here is about who is allowed to call it and what
 * they are allowed to make it do.
 */
describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.stubEnv("REVALIDATE_SECRET", SECRET);
    revalidateTag.mockClear();
    revalidatePath.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("purges the tags and paths it was given", async () => {
    const response = await POST(request({ tags: ["posts"], paths: ["/news"] }));

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("posts", expect.anything());
    expect(revalidatePath).toHaveBeenCalledWith("/news");
  });

  it("says what it purged, so a failing publish is diagnosable", async () => {
    const response = await POST(request({ tags: ["posts"], paths: ["/news"] }));

    await expect(response.json()).resolves.toEqual({
      revalidated: true,
      tags: ["posts"],
      paths: ["/news"],
    });
  });

  describe("authentication", () => {
    it("rejects a caller with the wrong secret", async () => {
      const response = await POST(request({ tags: ["posts"] }, "wrong"));

      expect(response.status).toBe(401);
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("rejects a caller with no secret at all", async () => {
      expect((await POST(request({ tags: ["posts"] }, null))).status).toBe(401);
    });

    it("tells an unauthorised caller nothing about why", async () => {
      // Somebody guessing secrets should learn nothing from the response, and
      // the API — the only legitimate caller — never sees this branch.
      const body = (await (await POST(request({}, "wrong"))).json()) as Record<string, unknown>;

      expect(body).toEqual({ revalidated: false });
    });

    /**
     * The important direction of failure. An unconfigured deployment must be
     * closed, not open — accepting an unauthenticated purge because nobody set
     * a variable is how a misconfiguration becomes a vulnerability.
     */
    it("is closed, not open, when no secret is configured", async () => {
      vi.stubEnv("REVALIDATE_SECRET", "");

      const response = await POST(request({ tags: ["posts"] }, null));

      expect(response.status).toBe(503);
      expect(revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe("what a caller may ask for", () => {
    it("refuses a malformed body rather than throwing", async () => {
      const response = await POST(request("not json at all"));

      expect(response.status).toBe(400);
    });

    it("ignores an absolute URL among the paths", async () => {
      // `revalidatePath` takes a site-relative path; an absolute URL is a sign
      // the caller has misunderstood, and passing it on would do nothing useful.
      await POST(request({ paths: ["https://evil.example/news", "/news"] }));

      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith("/news");
    });

    it("ignores non-strings in the arrays", async () => {
      await POST(request({ tags: [42, null, "posts", { a: 1 }] }));

      expect(revalidateTag).toHaveBeenCalledTimes(1);
      expect(revalidateTag).toHaveBeenCalledWith("posts", expect.anything());
    });

    it("caps how much one call can purge", async () => {
      // A caller asking for a thousand tags is broken or hostile; either way it
      // should not become a workload.
      await POST(request({ tags: Array.from({ length: 500 }, (_, index) => `tag-${String(index)}`) }));

      expect(revalidateTag).toHaveBeenCalledTimes(50);
    });

    it("accepts a body with neither tags nor paths without complaint", async () => {
      const response = await POST(request({}));

      expect(response.status).toBe(200);
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("ignores tags and paths that are not arrays", async () => {
      const response = await POST(request({ tags: "posts", paths: "/news" }));

      expect(response.status).toBe(200);
      expect(revalidateTag).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});
