import type { PageKey, Post, PostSummary } from "@kedland/types";

/**
 * The public site's read client.
 *
 * Every call is tagged, so publishing content can purge exactly the pages it
 * affects rather than the whole site. Pages are statically rendered at build
 * and regenerated on demand when the API calls the revalidation webhook — a
 * parent's request never waits on MongoDB (agent_plan §3.1).
 */

export interface Section {
  key: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
}

/** Cache tag for one page's content. Mirrored by the revalidation route. */
export function pageTag(page: PageKey): string {
  return `content:${page}`;
}

function apiUrl(path: string): string {
  const base = process.env["API_INTERNAL_URL"] ?? process.env["NEXT_PUBLIC_API_URL"] ?? "";
  return `${base.replace(/\/$/, "")}${path}`;
}

/**
 * Fetches a page's sections.
 *
 * Returns an empty list rather than throwing when the API is unreachable. A
 * page that renders its shell with nothing in it is a bad day; a page that
 * returns a 500 to a prospective parent is a worse one, and the header, footer
 * and contact details still work without the API.
 */
export async function getPageSections(page: PageKey): Promise<Section[]> {
  try {
    const response = await fetch(apiUrl(`/content?page=${encodeURIComponent(page)}`), {
      next: { tags: [pageTag(page)], revalidate: 3600 },
      // Without a deadline an unreachable API stalls the whole build: every
      // page waits on a socket that will never answer. Five seconds is far
      // more than a healthy API needs and far less than a build can spare.
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];
    return (await response.json()) as Section[];
  } catch {
    return [];
  }
}

/** Looks one section out of a page's list. */
export function findSection(sections: Section[], key: string): Section | undefined {
  return sections.find((section) => section.key === key);
}

/* ── Posts ─────────────────────────────────────────────────────────────── */

/**
 * Cache tag for the posts collection.
 *
 * One tag for all of them rather than one per post: publishing changes the
 * listing, the home page teaser and the post itself, and purging them
 * separately means remembering all three every time. The revalidation route
 * receives this same string.
 */
export const POSTS_TAG = "posts";

/** The shape the API returns for a list. Mirrors `Paginated<PostSummary>`. */
export interface PostList {
  items: PostSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const EMPTY_LIST: PostList = { items: [], total: 0, page: 1, pageSize: 9, totalPages: 0 };

/**
 * Published posts.
 *
 * Degrades the same way `getPageSections` does: an unreachable API yields an
 * empty list, so /news renders its heading and empty state rather than a 500.
 */
export async function getPosts(params: { page?: number; category?: string } = {}): Promise<PostList> {
  const query = new URLSearchParams();
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.category) query.set("category", params.category);

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    const response = await fetch(apiUrl(`/posts${suffix}`), {
      next: { tags: [POSTS_TAG], revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return EMPTY_LIST;
    return (await response.json()) as PostList;
  } catch {
    return EMPTY_LIST;
  }
}

/** One published post, or null when there is no such post. */
export async function getPost(slug: string): Promise<Post | null> {
  try {
    const response = await fetch(apiUrl(`/posts/${encodeURIComponent(slug)}`), {
      next: { tags: [POSTS_TAG], revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    // A 404 is a real answer here, not a failure: the page turns it into
    // `notFound()`, which is what a visitor following a dead link should get.
    if (!response.ok) return null;
    return (await response.json()) as Post;
  } catch {
    return null;
  }
}

/** Every published slug, for static generation and the sitemap. */
export async function getPostSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const response = await fetch(apiUrl("/posts/slugs"), {
      next: { tags: [POSTS_TAG], revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];
    return (await response.json()) as { slug: string; updatedAt: string }[];
  } catch {
    return [];
  }
}

/** The latest few posts, for the home page. */
export async function getRecentPosts(): Promise<PostSummary[]> {
  try {
    const response = await fetch(apiUrl("/posts/recent"), {
      next: { tags: [POSTS_TAG], revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];
    return (await response.json()) as PostSummary[];
  } catch {
    return [];
  }
}
