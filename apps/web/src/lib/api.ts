import type { PageKey, Post, PostSummary, PublicGalleryTile, PublicMedia } from "@kedland/types";

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

export interface ResolvedImageReference {
  mediaId: string;
  alt: string;
  src?: string;
  width?: number;
  height?: number;
}

/**
 * Bundled starter photography. Each key is also a valid CMS media reference,
 * so replacing it with an uploaded library id needs no component change.
 */
export const STARTER_MEDIA: Readonly<Record<string, PublicMedia>> = {
  "placeholder-hero": {
    id: "placeholder-hero",
    url: "/images/cms-starter/classroom-hero.webp",
    alt: "A bright early-years classroom prepared with books, blocks and child-sized tables",
    width: 1774,
    height: 887,
  },
  "placeholder-admissions": {
    id: "placeholder-admissions",
    url: "/images/cms-starter/play-garden.webp",
    alt: "A green school play garden with safe climbing equipment and shaded seating",
    width: 1536,
    height: 1024,
  },
  "kedland-starter-creative-table": {
    id: "kedland-starter-creative-table",
    url: "/images/cms-starter/creative-table.webp",
    alt: "A creative learning table with paints, paper shapes and child-made artwork",
    width: 1254,
    height: 1254,
  },
  "kedland-starter-reading-corner": {
    id: "kedland-starter-reading-corner",
    url: "/images/cms-starter/reading-corner.webp",
    alt: "A sunlit reading corner with picture books, soft cushions and wooden stars",
    width: 1024,
    height: 1536,
  },
  "kedland-starter-discovery-table": {
    id: "kedland-starter-discovery-table",
    url: "/images/cms-starter/discovery-table.webp",
    alt: "A maths and science discovery table with counting, weighing and nature materials",
    width: 1024,
    height: 1536,
  },
  "kedland-starter-music-corner": {
    id: "kedland-starter-music-corner",
    url: "/images/cms-starter/music-corner.webp",
    alt: "A music and movement corner with drums, ribbons, shakers and a xylophone",
    width: 1672,
    height: 941,
  },
};

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
    const sections = (await response.json()) as Section[];
    return await Promise.all(sections.map(hydrateSectionImages));
  } catch {
    return [];
  }
}

export async function getPublicMedia(reference: string): Promise<PublicMedia | null> {
  try {
    const response = await fetch(apiUrl(`/media/${encodeURIComponent(reference)}`), {
      next: { tags: ["media"], revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) return (await response.json()) as PublicMedia;
  } catch {
    // A bundled starter remains available while the API is restarting.
  }

  return STARTER_MEDIA[reference] ?? null;
}

async function hydrateSectionImages(section: Section): Promise<Section> {
  const data = await hydrateValue(section.data);
  return { ...section, data: data as Record<string, unknown> };
}

async function hydrateValue(value: unknown): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map(hydrateValue));
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  if (typeof record["mediaId"] === "string" && typeof record["alt"] === "string") {
    const media = await getPublicMedia(record["mediaId"]);
    if (!media) return record;
    return {
      ...record,
      src: media.url,
      width: media.width,
      height: media.height,
      // The section owns contextual alt text; the library description remains
      // the safe fallback when an older section omitted it.
      alt: record["alt"] || media.alt,
    };
  }

  const entries = await Promise.all(
    Object.entries(record).map(async ([key, nested]) => [key, await hydrateValue(nested)] as const),
  );
  return Object.fromEntries(entries);
}

const INSTAGRAM_HREF = "https://www.instagram.com/kedlandintlschool";

function starterMedia(reference: string): PublicMedia {
  const media = STARTER_MEDIA[reference];
  if (!media) throw new Error(`Missing bundled starter media: ${reference}`);
  return media;
}

export const STARTER_GALLERY: PublicGalleryTile[] = [
  {
    id: "starter-learning",
    caption: "Learning through play",
    href: INSTAGRAM_HREF,
    order: 0,
    media: starterMedia("placeholder-hero"),
  },
  {
    id: "starter-creative-table",
    caption: "Creativity takes shape",
    href: INSTAGRAM_HREF,
    order: 1,
    media: starterMedia("kedland-starter-creative-table"),
  },
  {
    id: "starter-reading",
    caption: "A quiet corner for big stories",
    href: INSTAGRAM_HREF,
    order: 2,
    media: starterMedia("kedland-starter-reading-corner"),
  },
  {
    id: "starter-welcome",
    caption: "Room to move, grow and play",
    href: INSTAGRAM_HREF,
    order: 3,
    media: starterMedia("placeholder-admissions"),
  },
  {
    id: "starter-discovery",
    caption: "Curiosity becomes discovery",
    href: INSTAGRAM_HREF,
    order: 4,
    media: starterMedia("kedland-starter-discovery-table"),
  },
  {
    id: "starter-music",
    caption: "Finding rhythm together",
    href: INSTAGRAM_HREF,
    order: 5,
    media: starterMedia("kedland-starter-music-corner"),
  },
];

/** Published dashboard-curated tiles, with bundled starters as a resilient preview. */
export async function getGalleryTiles(): Promise<PublicGalleryTile[]> {
  try {
    const response = await fetch(apiUrl("/instagram"), {
      next: { tags: ["gallery"], revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return STARTER_GALLERY;
    const tiles = (await response.json()) as PublicGalleryTile[];
    return tiles.length > 0 ? tiles : STARTER_GALLERY;
  } catch {
    return STARTER_GALLERY;
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
export async function getPosts(
  params: { page?: number; category?: string; q?: string } = {},
): Promise<PostList> {
  const query = new URLSearchParams();
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.category) query.set("category", params.category);
  if (params.q) query.set("q", params.q);

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

/**
 * One published post.
 *
 * `null` means the API said 404 — a real answer, which the page turns into
 * `notFound()`. Anything else **throws**, and the distinction matters more than
 * it looks: a page that returns `notFound()` is rendered and cached as a 404,
 * so collapsing a timeout or a 500 into "no such post" would bake a permanent
 * Not Found over a live article because the API blinked once during a build.
 * Throwing surfaces `error.tsx` instead, which is retryable and is not cached.
 */
export async function getPost(slug: string): Promise<Post | null> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/posts/${encodeURIComponent(slug)}`), {
      next: { tags: [POSTS_TAG], revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    // `cause` kept, so the real network error survives into the server log
    // rather than being flattened into a message.
    throw new Error(`Could not reach the API for post "${slug}"`, { cause: error });
  }

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`The API returned ${String(response.status)} for post "${slug}"`);
  }

  return (await response.json()) as Post;
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
