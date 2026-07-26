import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPost, getPosts, getPostSlugs, getRecentPosts, POSTS_TAG } from "./api";

/**
 * The post reads.
 *
 * Every one of these degrades rather than throwing, and that is the whole
 * point: the site is statically rendered, so an unreachable API during a build
 * would otherwise fail the deploy, and during a request would 500 at a
 * prospective parent. An empty list is a bad day; a broken site is worse.
 */

const OK = (body: unknown): Response =>
  ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as Response;

const LIST = { items: [], total: 0, page: 1, pageSize: 9, totalPages: 0 };

describe("the post reads", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(OK(LIST));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_INTERNAL_URL", "http://api.test/api/v1");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  /** The options object `fetch` was called with. */
  function optionsOf(call = 0): { next?: { tags?: string[] }; signal?: AbortSignal } {
    const [, options] = fetchMock.mock.calls[call] as [string, { next?: { tags?: string[] } }];
    return options;
  }

  function urlOf(call = 0): string {
    return (fetchMock.mock.calls[call] as [string])[0];
  }

  describe("getPosts", () => {
    it("asks the API for the published list", async () => {
      await getPosts();
      expect(urlOf()).toBe("http://api.test/api/v1/posts");
    });

    it("omits page 1 from the query, keeping the canonical URL clean", async () => {
      await getPosts({ page: 1 });
      expect(urlOf()).not.toContain("page=");
    });

    it("passes a later page through", async () => {
      await getPosts({ page: 3 });
      expect(urlOf()).toContain("page=3");
    });

    it("passes a category through", async () => {
      await getPosts({ category: "events" });
      expect(urlOf()).toContain("category=events");
    });

    it("tags the request so publishing can purge it", async () => {
      await getPosts();
      expect(optionsOf().next?.tags).toEqual([POSTS_TAG]);
    });

    /**
     * Without a deadline, an unreachable API stalls the whole static build:
     * every page waits on a socket that will never answer.
     */
    it("gives up rather than hanging the build", async () => {
      await getPosts();
      expect(optionsOf().signal).toBeInstanceOf(AbortSignal);
    });

    it("returns an empty list when the API is unreachable", async () => {
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(getPosts()).resolves.toEqual(LIST);
    });

    it("returns an empty list when the API errors", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      await expect(getPosts()).resolves.toEqual(LIST);
    });
  });

  describe("getPost", () => {
    it("encodes the slug, so a stray character cannot alter the path", async () => {
      await getPost("a b/c");
      expect(urlOf()).toBe("http://api.test/api/v1/posts/a%20b%2Fc");
    });

    /**
     * A 404 is a real answer here, not a failure — the page turns it into
     * `notFound()`, which is what somebody following a dead link should get.
     */
    it("returns null for a post that is not published", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404 });

      await expect(getPost("a-draft")).resolves.toBeNull();
    });

    it("returns null rather than throwing when the API is unreachable", async () => {
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(getPost("anything")).resolves.toBeNull();
    });
  });

  describe("getPostSlugs", () => {
    it("returns an empty list when the API is unreachable", async () => {
      // This one runs during `generateStaticParams`: throwing would fail the
      // build outright rather than simply prerendering no posts.
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(getPostSlugs()).resolves.toEqual([]);
    });
  });

  describe("getRecentPosts", () => {
    it("returns an empty list when the API is unreachable", async () => {
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(getRecentPosts()).resolves.toEqual([]);
    });

    it("asks the API for its own recent endpoint", async () => {
      fetchMock.mockResolvedValue(OK([]));

      await getRecentPosts();

      expect(urlOf()).toBe("http://api.test/api/v1/posts/recent");
    });
  });

  it("prefers the server-to-server URL over the public one", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://public.test/api/v1");

    await getPosts();

    // During rendering the internal host avoids a round trip out and back.
    expect(urlOf()).toContain("http://api.test");
  });
});
