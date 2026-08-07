import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as ApiModule from "@/lib/api";

const apiFetch = vi.fn();
const redirect = vi.fn((_to: string) => {
  // Next's `redirect` throws to unwind the render; mirroring that keeps the
  // control flow under test honest.
  throw new Error("NEXT_REDIRECT");
});

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof ApiModule>()),
  apiFetch: (path: string, options?: unknown) => apiFetch(path, options) as unknown,
}));
vi.mock("@/lib/session", () => ({ clearSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));

const { createPostAction, updatePostAction } = await import("./actions");

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  data.set("title", "A morning in Reception");
  data.set("category", "news");
  data.set("excerpt", "What the children did.");
  data.set("body", "A short article body.");
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

/** The body sent to the API by the single call the action made. */
function sentBody(): Record<string, unknown> {
  const options = apiFetch.mock.calls[0]?.[1] as { body?: Record<string, unknown> } | undefined;
  return options?.body ?? {};
}

async function run(action: (data: FormData) => Promise<never>, data: FormData): Promise<void> {
  // Every one of these actions ends in a redirect, which throws.
  await expect(action(data)).rejects.toThrow("NEXT_REDIRECT");
}

describe("post actions — header image", () => {
  beforeEach(() => {
    apiFetch.mockReset().mockResolvedValue({});
    redirect.mockClear();
  });

  it("sends the chosen image and its description", async () => {
    await run(createPostAction, form({ coverMediaId: "kedland/play-garden", coverAlt: "A green garden" }));

    expect(sentBody()["coverImage"]).toEqual({ mediaId: "kedland/play-garden", alt: "A green garden" });
  });

  /**
   * The distinction the whole feature rests on. `null` tells the API to remove
   * the cover; omitting the key tells it to leave whatever is there alone. If
   * this ever becomes `undefined`, the "No header image" tile silently stops
   * working and a withdrawn photograph stays on the article.
   */
  it("sends null — not undefined — when the image is taken away", async () => {
    await run(updatePostAction, form({ id: "p1", coverMediaId: "", coverAlt: "" }));

    const body = sentBody();
    expect(body["coverImage"]).toBeNull();
    expect("coverImage" in body).toBe(true);
  });

  /** A draft created without a cover is not a draft with a broken one. */
  it("creates a draft with no cover when none was chosen", async () => {
    await run(createPostAction, form({ coverMediaId: "" }));

    expect(sentBody()["coverImage"]).toBeNull();
  });

  /**
   * Alt text is sent exactly as typed, empty included: the API refuses a cover
   * without a description, and that refusal is the right outcome — quietly
   * substituting a placeholder would put an unhelpful sentence in front of
   * every screen reader and nobody would ever go back to fix it.
   */
  it("does not invent a description for an image that has none", async () => {
    await run(createPostAction, form({ coverMediaId: "kedland/play-garden", coverAlt: "" }));

    expect(sentBody()["coverImage"]).toEqual({ mediaId: "kedland/play-garden", alt: "" });
  });
});
