import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { POST_CATEGORY_LABELS } from "@kedland/types";
import { buttonClasses, Chip, Icon, Star, Watermark } from "@kedland/ui";

import type { Metadata } from "next";

import { PostBody } from "@/components/posts/post-body";
import { getPost, getPostSlugs } from "@/lib/api";
import { markdownToText, renderMarkdown } from "@/lib/markdown";
import { postCoverUrl } from "@/lib/post-cover";
import { articleJsonLd } from "@/lib/seo/article";
import { breadcrumbList, breadcrumbsFor } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";

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

  const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
  const coverUrl = post.coverImage ? postCoverUrl(post.coverImage.mediaId, cloudName, 1600) : null;

  return {
    title: `${post.seoTitle ?? post.title} | Kedland International School`,
    description,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      title: post.seoTitle ?? post.title,
      description,
      type: "article",
      url: `/news/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      // The cover is the share image — agent_plan §6.4. A post without one
      // inherits the site-wide opengraph-image instead.
      ...(coverUrl && post.coverImage
        ? { images: [{ url: coverUrl, width: 1600, height: 900, alt: post.coverImage.alt }] }
        : {}),
    },
    twitter: { card: "summary_large_image" },
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

const CATEGORY_ART = {
  news: { background: "bg-blue", icon: "book" },
  events: { background: "bg-pink", icon: "star" },
  learning: { background: "bg-green", icon: "blocks" },
} as const;

export default async function Page({ params }: Readonly<PageProps>) {
  const { slug } = await params;
  const post = await getPost(slug);

  // A draft, a deleted post and a typo all arrive here the same way, and all
  // three should look the same to a visitor: a 404, not a hint that something
  // exists but is being withheld.
  if (!post) notFound();

  const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
  const published = formatDate(post.publishedAt);
  const body = renderMarkdown(post.body);
  const categoryArt = CATEGORY_ART[post.category];
  const coverUrl = post.coverImage ? postCoverUrl(post.coverImage.mediaId, cloudName, 1600) : null;

  return (
    <article>
      <JsonLd data={articleJsonLd(post, coverUrl)} />
      <JsonLd data={breadcrumbList(breadcrumbsFor(`/news/${post.slug}`, post.title))} />
      <header className="relative overflow-hidden bg-navy px-6 pb-28 pt-14 text-white sm:pb-36 sm:pt-20">
        <Star className="pointer-events-none absolute -left-16 top-24 size-56 text-yellow/[0.06]" />
        <span className="pointer-events-none absolute -right-48 -top-52 size-[38rem] rounded-pill bg-blue/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-end gap-12 lg:grid-cols-[minmax(0,1.3fr)_20rem] lg:gap-20">
          <div>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-small font-bold text-white/68 hover:text-yellow"
            >
              <span aria-hidden="true">←</span> Back to school news
            </Link>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Chip tone={CATEGORY_TONES[post.category]} className="public-news-hero-chip">
                {POST_CATEGORY_LABELS[post.category]}
              </Chip>
              {published && (
                <time dateTime={post.publishedAt ?? undefined} className="text-small text-white/62">
                  {published}
                </time>
              )}
              <span aria-hidden="true" className="size-1 rounded-pill bg-yellow" />
              <span className="text-small text-white/62">{post.readingMinutes} min read</span>
            </div>

            <h1 className="mt-6 max-w-4xl text-[clamp(2.7rem,6.2vw,5rem)] leading-[0.98] text-white">
              {post.title}
            </h1>
            <p className="mt-7 max-w-3xl text-[1.1rem] leading-relaxed text-white/72 sm:text-[1.2rem]">
              {post.excerpt}
            </p>
          </div>

          {!coverUrl && (
            <div
              className={`relative hidden aspect-[4/5] overflow-hidden rounded-lg ${categoryArt.background} p-8 shadow-lift lg:block`}
            >
              <Watermark name={categoryArt.icon} className="text-navy" />
              <div className="relative flex h-full flex-col justify-between">
                <span className="grid size-14 place-items-center rounded-pill bg-white text-navy shadow-card">
                  <Icon name={categoryArt.icon} className="size-7" />
                </span>
                <div>
                  <p className="text-small font-bold uppercase tracking-[0.14em] text-navy/55">
                    Kedland stories
                  </p>
                  <p className="mt-2 font-display text-h3 font-extrabold leading-tight text-navy">
                    Little moments.
                    <br />
                    Big memories.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {coverUrl && post.coverImage && (
        <div className="relative z-10 -mt-16 px-6 sm:-mt-24">
          <div className="public-news-cover mx-auto max-w-6xl overflow-hidden rounded-lg bg-sky shadow-lift">
            <Image
              src={coverUrl}
              alt={post.coverImage.alt}
              width={1600}
              height={900}
              priority
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        </div>
      )}

      <section className={`px-6 pb-20 ${coverUrl ? "pt-10 sm:pt-14" : "pt-14 sm:pt-20"}`}>
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
          <div className="min-w-0">
            <p className="font-display text-h3 font-extrabold leading-snug text-navy">
              From our school community
            </p>
            <PostBody html={body} />
          </div>

          <aside aria-label="Story details" className="lg:pt-2">
            <div className="public-news-details rounded-lg bg-sky/45 p-6 lg:sticky lg:top-28">
              <span className="grid size-11 place-items-center rounded-pill bg-white text-blue shadow-card">
                <Icon name="book" className="size-5" />
              </span>
              <p className="mt-5 text-small font-bold uppercase tracking-[0.12em] text-grey">Story details</p>
              <dl className="mt-4 divide-y divide-navy/10 text-small">
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-grey">Filed under</dt>
                  <dd className="font-bold text-navy">{POST_CATEGORY_LABELS[post.category]}</dd>
                </div>
                {published && (
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-grey">Published</dt>
                    <dd className="text-right font-bold text-navy">{published}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-grey">Reading time</dt>
                  <dd className="font-bold text-navy">{post.readingMinutes} min</dd>
                </div>
              </dl>
              <Link
                href="/news"
                className="mt-6 inline-flex font-display font-bold text-blue hover:underline"
              >
                Explore more stories →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="public-news-tour relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 overflow-hidden rounded-lg bg-yellow p-8 sm:p-10 md:flex-row md:items-center md:p-12">
          <Watermark name="star" className="-bottom-12 -right-8 size-52 text-navy" />
          <div className="relative max-w-2xl">
            <p className="public-news-tour-eyebrow text-small font-bold uppercase tracking-[0.12em] text-ink/55">
              See the story in person
            </p>
            <h2 className="public-news-tour-heading mt-2">Come and experience Kedland</h2>
            <p className="public-news-tour-copy mt-3 text-ink/70">
              Meet our teachers, explore the classrooms and imagine your child learning here.
            </p>
          </div>
          <Link
            href="/contact"
            className={buttonClasses({ variant: "secondary", size: "lg", className: "relative shrink-0" })}
          >
            Book a school tour <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </article>
  );
}
