import { z } from "zod";

import { imageSchema } from "./content/fields";
import { postCategorySchema, postStatusSchema } from "./enums";

/**
 * The school's news and events posts (build package §4.6).
 *
 * The body is **Markdown**, not HTML. The dashboard's editor is a rich-text
 * surface that serialises to Markdown, and the public site renders that
 * Markdown server-side with raw HTML disabled. Storing HTML instead would mean
 * either trusting whatever the editor emitted or sanitising on every render;
 * Markdown with no HTML passthrough has no injection surface at all.
 */

const title = z.string().trim().min(1).max(120);

/** Long enough for a real headline, short enough to stay a usable URL. */
const MAX_SLUG = 140;

/**
 * A URL slug.
 *
 * Lower case, no leading or trailing dash, no doubles. Generated from the
 * title but editable, because a published URL is a promise — renaming a post
 * should not have to break the link the school put on Instagram.
 */
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_SLUG)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lower-case words separated by single dashes");

/**
 * Turns a title into a slug.
 *
 * Shared rather than reimplemented on each side: the dashboard shows the slug
 * it is about to use, and the API fills one in when none is given. Those two
 * must agree, or an editor sees one URL and gets another.
 */
export function slugify(value: string): string {
  const words = value
    .normalize("NFKD")
    // Strip the combining marks NFKD just split off, so "Crèche" becomes
    // "creche" rather than "cr-che". Escapes rather than the literal
    // characters, which are invisible in an editor and easily mangled.
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    // Splitting on runs of separators and re-joining is what keeps the result
    // free of leading, trailing and doubled dashes. Trimming them afterwards
    // with an anchored `-+` alternation is the same result by a route that
    // backtracks.
    .split(/[^a-z0-9]+/u)
    .filter(Boolean);

  const slug = words.join("-");
  if (slug.length <= MAX_SLUG) return slug;

  // Cut back to a whole word rather than leaving a truncated one.
  const clipped = slug.slice(0, MAX_SLUG);
  const lastDash = clipped.lastIndexOf("-");
  return lastDash > 0 ? clipped.slice(0, lastDash) : clipped;
}

/** What an editor submits. `slug` is derived from the title when omitted. */
export const postInputSchema = z.strictObject({
  title,
  slug: slugSchema.optional(),
  category: postCategorySchema,

  /** The card and search-result summary. Required — a post with no summary
   *  lists as a bare headline, which reads as unfinished. */
  excerpt: z.string().trim().min(1).max(300),

  /** Markdown. Long, because this is the whole article. */
  body: z.string().trim().min(1).max(50_000),

  /** `null` on an update removes the image; omitting it leaves it alone. */
  coverImage: imageSchema.nullable().optional(),

  /**
   * Publishing is a separate action, not a field an editor can typo into.
   * A create always lands as a draft; `POST /:id/publish` moves it.
   */
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(180).optional(),
});
export type PostInput = z.infer<typeof postInputSchema>;

/** Every field optional — a PATCH may carry one. */
export const postUpdateSchema = postInputSchema.partial();
export type PostUpdate = z.infer<typeof postUpdateSchema>;

/** What both the site and the dashboard read. */
export interface Post {
  id: string;
  title: string;
  slug: string;
  category: z.infer<typeof postCategorySchema>;
  excerpt: string;
  /** Markdown as authored. The site renders it; the dashboard edits it. */
  body: string;
  coverImage: z.infer<typeof imageSchema> | null;
  status: z.infer<typeof postStatusSchema>;
  /** Null until first published, and kept thereafter — the date the school
   *  told the world, which is not the date a typo was later fixed. */
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  readingMinutes: number;
  createdAt: string;
  updatedAt: string;
  authorId: string | null;
}

/** A post in a list. Omits the body, which is the expensive part. */
export type PostSummary = Omit<Post, "body">;

export const postQuerySchema = z.object({
  q: z.string().trim().min(1).max(80).optional(),
  category: postCategorySchema.optional(),
  status: postStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(9),
});
export type PostQuery = z.infer<typeof postQuerySchema>;

/** Words per minute, for the "4 min read" label. */
const READING_SPEED = 200;

/**
 * How long a post takes to read.
 *
 * Computed rather than stored, so it can never disagree with the body. A
 * one-word post still reads as "1 min" — rounding to zero would be strange.
 */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / READING_SPEED));
}

export const POST_CATEGORY_LABELS: Record<z.infer<typeof postCategorySchema>, string> = {
  news: "News",
  events: "Events",
  learning: "Learning",
};
