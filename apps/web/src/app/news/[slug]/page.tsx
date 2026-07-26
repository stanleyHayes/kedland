import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { cloudinaryUrl, POST_CATEGORY_LABELS } from "@kedland/types";
import { buttonClasses, Chip } from "@kedland/ui";

import type { Metadata } from "next";

import { PostBody } from "@/components/posts/post-body";
import { getPost, getPostSlugs } from "@/lib/api";
import { markdownToText, renderMarkdown } from "@/lib/markdown";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Prerenders every published post at build time.
 *
 * A post published afterwards is rendered on first request and then cached, so
 * the school never waits for a deploy to publish — and the revalidation
 * webhook means it appears immediately rather than within the hour.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getPostSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Readonly<PageProps>): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: "Post not found | Kedland International School" };

  // The editor's own SEO field wins; otherwise the excerpt, which the schema
  // requires — so a description is never empty, and Google is never left to
  // invent one from whatever it finds on the page.
  //
  // Truncated to 160 because that is roughly what a search result shows, while
  // an excerpt may run to 300. `markdownToText` also guarantees the result
  // carries no angle brackets, whatever an editor typed.
  const description = markdownToText(post.seoDescription ?? post.excerpt, 160);

  return {
    title: `${post.seoTitle ?? post.title} | Kedland International School`,
    description,
    openGraph: {
      title: post.seoTitle ?? post.title,
      description,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const CATEGORY_TONES = { news: "blue", events: "pink", learning: "green" } as const;

export default async function Page({ params }: Readonly<PageProps>) {
  const { slug } = await params;
  const post = await getPost(slug);

  // A draft, a deleted post and a typo all arrive here the same way, and all
  // three should look the same to a visitor: a 404, not a hint that something
  // exists but is being withheld.
  if (!post) notFound();

  const cloudName = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"];
  const published = formatDate(post.publishedAt);
  const body = renderMarkdown(post.body);

  return (
    <article className="px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <p className="text-small">
          <Link href="/news" className="font-display font-bold text-blue hover:underline">
            ← All news
          </Link>
        </p>

        <div className="mt-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <Chip tone={CATEGORY_TONES[post.category]}>{POST_CATEGORY_LABELS[post.category]}</Chip>
            {published && (
              <time dateTime={post.publishedAt ?? undefined} className="text-small text-grey">
                {published}
              </time>
            )}
            <span className="text-small text-grey">·</span>
            <span className="text-small text-grey">{post.readingMinutes} min read</span>
          </div>

          <h1 className="mt-4">{post.title}</h1>
          <p className="mt-5 text-[1.1rem] leading-relaxed text-ink/80">{post.excerpt}</p>
        </div>

        {post.coverImage && cloudName && (
          <Image
            src={cloudinaryUrl(cloudName, post.coverImage.mediaId, { width: 1600 })}
            alt={post.coverImage.alt}
            width={1600}
            height={900}
            priority
            className="mt-9 aspect-[16/9] w-full rounded-lg object-cover shadow-card"
          />
        )}

        <PostBody html={body} />

        <p className="mt-12">
          <Link href="/contact" className={buttonClasses()}>
            Come and see us
          </Link>
        </p>
      </div>
    </article>
  );
}
