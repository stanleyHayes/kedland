import Image from "next/image";
import Link from "next/link";

import { cloudinaryUrl, POST_CATEGORY_LABELS, type PostSummary } from "@kedland/types";
import { Card, Chip } from "@kedland/ui";

/**
 * One post in a listing.
 *
 * The whole card is a link, but only the title carries the link text: a card
 * where the image, the category and the date are each separately focusable
 * makes a keyboard user press Tab four times to move past one post, and gives
 * a screen reader four links that all go to the same place.
 */

const CATEGORY_TONES = {
  news: "blue",
  events: "pink",
  learning: "green",
} as const;

/** The date a parent reads, not an ISO string. */
function formatDate(iso: string | null): string {
  if (!iso) return "";

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PostCard({
  post,
  cloudName,
}: Readonly<{ post: PostSummary; cloudName: string | undefined }>) {
  const published = formatDate(post.publishedAt);

  return (
    <Card interactive className="flex h-full flex-col overflow-hidden p-0">
      {post.coverImage && cloudName ? (
        <Image
          src={cloudinaryUrl(cloudName, post.coverImage.mediaId, { width: 800 })}
          alt={post.coverImage.alt}
          width={800}
          height={500}
          className="aspect-[8/5] w-full object-cover"
        />
      ) : (
        // A card with no image still needs a top edge that reads as deliberate
        // rather than as a failed load.
        <div aria-hidden="true" className="aspect-[8/5] w-full bg-sky/40" />
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3">
          <Chip tone={CATEGORY_TONES[post.category]}>{POST_CATEGORY_LABELS[post.category]}</Chip>
          {published && (
            <time dateTime={post.publishedAt ?? undefined} className="text-small text-grey">
              {published}
            </time>
          )}
        </div>

        <h3 className="mt-3">
          <Link href={`/news/${post.slug}`} className="underline-offset-4 hover:underline">
            {post.title}
          </Link>
        </h3>

        <p className="mt-2 flex-1 text-small leading-relaxed text-grey">{post.excerpt}</p>

        <p className="mt-4 text-small text-grey">{post.readingMinutes} min read</p>
      </div>
    </Card>
  );
}
