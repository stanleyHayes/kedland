import type {
  Faq,
  PageKey,
  Post,
  PostSummary,
  PublicGalleryTile,
  PublicMedia,
  SiteSettings,
} from "@kedland/types";

import { FALLBACK_SOCIALS, type SchoolSocials } from "@/lib/site";

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
  "principal-mary": {
    id: "principal-mary",
    url: "/images/cms-starter/principal-mary.webp",
    alt: "Mary, the fictional head teacher of Kedland International School, in her office",
    width: 900,
    height: 1125,
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
 * How long a successful answer is trusted before the site asks again.
 *
 * A minute, not an hour. Publishing sends a webhook that purges the relevant
 * tag immediately, so this number only matters when that webhook does not
 * arrive — a restart mid-publish, a network blip, a misconfigured
 * `REVALIDATE_WEBHOOK_URL`. At an hour, one missed webhook meant the school
 * watched a deleted post sit on the site for the rest of the morning and
 * reasonably concluded the dashboard was broken. At a minute, the same failure
 * costs a minute.
 *
 * The trade is more requests to an API that is already answering in
 * milliseconds, against the school being able to trust what they see.
 */
const CACHE_SECONDS = 60;

/**
 * Long enough for a sleeping API to wake up.
 *
 * Render's free tier stops the container after fifteen minutes idle and takes
 * the better part of a minute to come back. The old five-second deadline was
 * shorter than that wake-up by an order of magnitude, so the first request after
 * any quiet spell timed out — and, because every caller turns a failure into an
 * empty result, the *empty* page was then cached as though it were the answer.
 * That is how the FAQs vanished for an hour at a time.
 */
const FIRST_TIMEOUT_MS = 12_000;
const RETRY_TIMEOUT_MS = 25_000;

/**
 * One fetch, then one retry with a longer deadline.
 *
 * The retry exists for exactly one case — the cold start — and it is why this is
 * a helper rather than nine copies of a try/catch. A second attempt costs a few
 * seconds on a page that was going to render empty anyway, and turns "the site
 * looks broken for an hour" into "the first visitor after lunch waits a moment".
 *
 * @returns the parsed body, or null. Null means *unavailable*, which every
 *          caller renders as its own sensible empty state — never as an error
 *          page. A parent who cannot reach the API can still find the phone
 *          number.
 */
async function fetchFromApi<T>(path: string, tags: string[]): Promise<T | null> {
  for (const timeout of [FIRST_TIMEOUT_MS, RETRY_TIMEOUT_MS]) {
    try {
      const response = await fetch(apiUrl(path), {
        next: { tags, revalidate: CACHE_SECONDS },
        signal: AbortSignal.timeout(timeout),
      });

      // A 4xx is an answer — the thing genuinely is not there — so retrying
      // would only slow the page down. Only a 5xx or a timeout is worth a
      // second attempt.
      if (response.ok) return (await response.json()) as T;
      if (response.status < 500) return null;
    } catch {
      // Timed out or unreachable. Fall through to the retry, or to null.
    }
  }

  return null;
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
  const sections = await fetchFromApi<Section[]>(`/content?page=${encodeURIComponent(page)}`, [
    pageTag(page),
  ]);
  if (!sections) return [];

  return Promise.all(sections.map(hydrateSectionImages));
}

export async function getPublicMedia(reference: string): Promise<PublicMedia | null> {
  const media = await fetchFromApi<PublicMedia>(`/media/${encodeURIComponent(reference)}`, ["media"]);
  if (media) return media;

  // A bundled starter remains available while the API is restarting.
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
  const tiles = await fetchFromApi<PublicGalleryTile[]>("/instagram", ["gallery"]);

  return tiles && tiles.length > 0 ? tiles : STARTER_GALLERY;
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

/** Cache tag for the CMS settings singleton (contact, socials, SEO defaults). */
export const SETTINGS_TAG = "settings";

/**
 * Public site settings from the CMS.
 *
 * Degrades to the hardcoded school facts in `lib/site` when the API is down, so
 * the footer and JSON-LD never go blank over a transient outage.
 */
export async function getPublicSettings(): Promise<Pick<SiteSettings, "socials">> {
  const settings = await fetchFromApi<SiteSettings>("/settings/public", [SETTINGS_TAG]);
  if (!settings) return { socials: FALLBACK_SOCIALS };

  return {
    socials: {
      instagram: settings.socials.instagram || FALLBACK_SOCIALS.instagram,
      facebook: settings.socials.facebook || FALLBACK_SOCIALS.facebook,
      tiktok: settings.socials.tiktok || FALLBACK_SOCIALS.tiktok,
    } satisfies SchoolSocials,
  };
}

export async function getFaqs(): Promise<Faq[]> {
  return (await fetchFromApi<Faq[]>("/faqs", ["faqs"])) ?? [];
}

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

  return (await fetchFromApi<PostList>(`/posts${suffix}`, [POSTS_TAG])) ?? EMPTY_LIST;
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
      next: { tags: [POSTS_TAG], revalidate: CACHE_SECONDS },
      // Deliberately not `fetchFromApi`: this one throws rather than failing
      // open, because a post page that wrongly renders "not found" is worse than
      // one that errors and retries. It takes the same generous deadline though.
      signal: AbortSignal.timeout(RETRY_TIMEOUT_MS),
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
  return (await fetchFromApi<{ slug: string; updatedAt: string }[]>("/posts/slugs", [POSTS_TAG])) ?? [];
}

/** The latest few posts, for the home page. */
export async function getRecentPosts(): Promise<PostSummary[]> {
  return (await fetchFromApi<PostSummary[]>("/posts/recent", [POSTS_TAG])) ?? [];
}
