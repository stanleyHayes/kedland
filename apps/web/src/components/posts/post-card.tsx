import Image from "next/image";
import Link from "next/link";

import { POST_CATEGORY_LABELS, type PostSummary } from "@kedland/types";
import { Card, Icon, Star } from "@kedland/ui";

import { postCoverUrl } from "@/lib/post-cover";

/**
 * One post in a listing.
 *
 * Two things this deliberately does not do, both learned from the version it
 * replaces:
 *
 *  - **It does not reserve a large empty box when a post has no cover image.**
 *    That left a blank slab occupying half the card and outweighing the
 *    headline. A post with no photograph now gets a compact coloured band
 *    carrying the school's star and the post's category — deliberate-looking,
 *    and a fifth of the height.
 *  - **It does not scatter the metadata.** Date and reading time were at
 *    opposite ends of the card with the excerpt between them; they now sit on
 *    one quiet line, because they are one kind of information.
 *
 * The whole card is a link but only the title carries the link text: four
 * separately focusable regions per card means four presses of Tab to pass one
 * post, and four links to the same place for a screen reader.
 */

const CATEGORY_TONES = {
  news: { band: "bg-blue/15", ink: "text-blue" },
  events: { band: "bg-pink/12", ink: "text-pink" },
  learning: { band: "bg-green/15", ink: "text-green" },
} as const;

/** The date a parent reads, not an ISO string. */
function formatDate(iso: string | null): string {
  if (!iso) return "";

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PostCard({
  post,
  cloudName,
}: Readonly<{ post: PostSummary; cloudName: string | undefined }>) {
  const published = formatDate(post.publishedAt);
  const tone = CATEGORY_TONES[post.category];
  const coverUrl = post.coverImage ? postCoverUrl(post.coverImage.mediaId, cloudName, 800) : null;

  return (
    <Card interactive padded={false} className="group relative flex h-full flex-col overflow-hidden">
      {coverUrl && post.coverImage ? (
        <div className="relative m-3 mb-0 overflow-hidden rounded-md">
          <Image
            src={coverUrl}
            alt={post.coverImage.alt}
            width={800}
            height={450}
            className="aspect-[16/9] w-full object-cover"
          />
          {/* Over the image, where it does not cost a line of the card. */}
          <span
            className={`absolute left-4 top-4 inline-flex items-center rounded-pill bg-white/95 px-3 py-1 text-small font-bold ${tone.ink}`}
          >
            {POST_CATEGORY_LABELS[post.category]}
          </span>
        </div>
      ) : (
        <div className={`relative flex h-20 items-center overflow-hidden px-6 ${tone.band}`}>
          <Star
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 -top-4 size-24 text-white/40"
          />
          <span
            className={`relative inline-flex items-center gap-2 text-small font-bold uppercase tracking-[0.06em] ${tone.ink}`}
          >
            <Icon name="star" className="size-4" />
            {POST_CATEGORY_LABELS[post.category]}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-balance">
          <Link
            href={`/news/${post.slug}`}
            // Stretched over the whole card, so the entire card is the click
            // target while remaining exactly one link in the accessibility
            // tree — the pointer affordance and the semantics can differ.
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-blue"
          >
            {post.title}
          </Link>
        </h3>

        {/* Three lines then an ellipsis. Excerpts vary from a sentence to a
            paragraph, and a grid whose cards are all different heights reads
            as broken rather than as varied. */}
        <p className="mt-2.5 line-clamp-3 text-small leading-relaxed text-grey">{post.excerpt}</p>

        <p className="mt-4 flex items-center gap-2 text-small text-grey">
          {published && <time dateTime={post.publishedAt ?? undefined}>{published}</time>}
          {published && <span aria-hidden="true">·</span>}
          <span>{post.readingMinutes} min read</span>
        </p>
      </div>
    </Card>
  );
}
