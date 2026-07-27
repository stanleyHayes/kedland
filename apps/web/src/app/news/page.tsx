import Image from "next/image";
import Link from "next/link";

import { POST_CATEGORY_LABELS, postCategorySchema, type PostSummary } from "@kedland/types";
import { Card, Icon, Star, Watermark } from "@kedland/ui";

import type { Metadata } from "next";

import { PostCard } from "@/components/posts/post-card";
import { NewsEmptyState } from "@/components/sections/blocks-extra";
import { findSection, getPageSections, getPosts } from "@/lib/api";
import { postCoverUrl } from "@/lib/post-cover";

export const metadata: Metadata = {
  title: "News & Blog | Kedland International School",
  description: "The latest news, events and stories from Kedland International School in Lashibi-Tema.",
  alternates: { canonical: "/news" },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The first value of a query parameter, ignoring repeats. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: Readonly<PageProps>) {
  const params = await searchParams;

  // An unknown category is treated as no filter rather than as an error: a
  // mistyped URL should still show a parent the school's news.
  const category = postCategorySchema.safeParse(first(params["category"]));
  const page = Math.max(1, Number.parseInt(first(params["page"]) ?? "1", 10) || 1);
  const q = (first(params["q"]) ?? "").trim().slice(0, 80);

  const posts = await getPosts({
    page,
    ...(q ? { q } : {}),
    ...(category.success ? { category: category.data } : {}),
  });

  const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];

  // The empty-state copy is CMS-editable and lives on this page's `intro`
  // section, but only this component knows whether the list is actually empty —
  // rendering it from the section itself announced "our first story is on its
  // way" directly above a list of published stories.
  const intro = findSection(await getPageSections("news"), "intro")?.data as
    | {
        heading?: string;
        body?: string;
        emptyStateHeading?: string;
        emptyStateBody?: string;
      }
    | undefined;

  const featuredPost = posts.items.at(0);
  const remainingPosts = posts.items.slice(1);

  return (
    <>
      <section className="relative overflow-hidden bg-navy px-6 pb-24 pt-16 text-white sm:pb-28 sm:pt-20">
        <Star className="pointer-events-none absolute -right-12 top-8 size-64 text-yellow/[0.07]" />
        <span className="pointer-events-none absolute -left-32 -top-40 size-[30rem] rounded-pill bg-blue/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-end gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20">
          <div>
            <p className="text-small font-bold uppercase tracking-[0.16em] text-yellow">
              The Kedland journal
            </p>
            <h1 className="mt-5 max-w-4xl text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.98] text-white">
              {intro?.heading ?? "News & Stars in Action"}
            </h1>
          </div>
          <div className="border-l border-white/20 pl-6 lg:mb-1">
            <p className="text-[1.08rem] leading-relaxed text-white/72">
              {intro?.body ?? "The latest news, events and stories from Kedland International School."}
            </p>
            <p className="mt-5 flex items-center gap-2 text-small font-bold uppercase tracking-[0.1em] text-white/45">
              <Icon name="star" className="size-4 text-yellow" />
              Learning, growing and celebrating together
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-12 px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg bg-white p-4 shadow-lift sm:p-5">
            <form action="/news" method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
              {category.success && <input type="hidden" name="category" value={category.data} />}
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search news and stories</span>
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-blue"
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  maxLength={80}
                  placeholder="Search Kedland stories"
                  className="min-h-12 w-full rounded-pill border border-sky bg-cream py-3 pl-12 pr-4 text-navy outline-none transition focus:border-blue focus:ring-3 focus:ring-blue/15"
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-pill bg-navy px-6 font-display font-bold text-white transition hover:bg-blue"
              >
                Search
              </button>
              {q && (
                <Link
                  href={category.success ? `/news?category=${category.data}` : "/news"}
                  className="inline-flex min-h-12 items-center justify-center rounded-pill border border-sky px-5 font-display font-bold text-navy hover:bg-sky/35"
                >
                  Clear
                </Link>
              )}
            </form>
            <div className="mt-4 flex flex-col gap-3 border-t border-sky/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-small font-bold uppercase tracking-[0.11em] text-grey">Explore stories</p>
              <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
                <CategoryLink
                  label="All stories"
                  href={q ? `/news?q=${encodeURIComponent(q)}` : "/news"}
                  active={!category.success}
                />
                {postCategorySchema.options.map((option) => (
                  <CategoryLink
                    key={option}
                    label={POST_CATEGORY_LABELS[option]}
                    href={categoryHref(option, q)}
                    active={category.success && category.data === option}
                  />
                ))}
              </nav>
            </div>
          </div>

          {featuredPost ? (
            <div className="mt-12">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="text-small font-bold uppercase tracking-[0.12em] text-red">
                    {category.success ? POST_CATEGORY_LABELS[category.data] : "Latest from Kedland"}
                  </p>
                  <h2 className="mt-2">Featured story</h2>
                </div>
                <p className="hidden max-w-sm text-right text-small text-grey md:block">
                  Moments from school life, shared with our families and community.
                </p>
              </div>

              <FeaturedPost post={featuredPost} cloudName={cloudName} />

              {remainingPosts.length > 0 && (
                <div className="mt-16">
                  <div className="flex items-center gap-4">
                    <h2 className="text-h3">More stories</h2>
                    <span className="h-px flex-1 bg-sky/70" />
                  </div>
                  <ul className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {remainingPosts.map((post) => (
                      <li key={post.id}>
                        <PostCard post={post} cloudName={cloudName} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-12">
              <NewsResultsEmpty
                q={q}
                category={category.success ? category.data : undefined}
                heading={intro?.emptyStateHeading}
                body={intro?.emptyStateBody}
              />
            </div>
          )}

          {posts.totalPages > 1 && (
            <Pager
              page={posts.page}
              totalPages={posts.totalPages}
              category={category.success ? category.data : undefined}
              q={q || undefined}
            />
          )}

          <aside className="public-instagram-callout relative mt-16 overflow-hidden rounded-lg p-8 sm:flex sm:items-center sm:justify-between sm:gap-10 sm:p-10">
            <Watermark name="star" className="text-navy" />
            <div className="relative">
              <p className="text-small font-bold uppercase tracking-[0.11em] text-red">
                More day-to-day moments
              </p>
              <h2 className="mt-2 text-h3">Follow our Stars beyond the stories</h2>
              <p className="mt-2 max-w-2xl text-small text-grey">
                See classroom moments, celebrations and school updates as they happen.
              </p>
            </div>
            <a
              href="https://www.instagram.com/kedlandintlschool"
              target="_blank"
              rel="noreferrer noopener"
              className="public-instagram-callout-action relative mt-6 inline-flex min-h-12 shrink-0 items-center gap-2 rounded-pill px-6 py-3 font-display font-bold text-white sm:mt-0"
            >
              Follow on Instagram <span aria-hidden="true">→</span>
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}

function CategoryLink({ label, href, active }: Readonly<{ label: string; href: string; active: boolean }>) {
  return (
    <Link
      href={href}
      // `aria-current` rather than colour alone: which filter is applied is
      // information, and information carried only by colour is information a
      // screen-reader user does not get.
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-pill px-4 font-display text-small font-bold transition-colors sm:px-5 ${
        active ? "bg-navy text-white" : "bg-cream text-navy hover:bg-sky/45"
      }`}
    >
      {label}
    </Link>
  );
}

function categoryHref(category: string, q: string): string {
  const params = new URLSearchParams({ category });
  if (q) params.set("q", q);
  return `/news?${params.toString()}`;
}

function NewsResultsEmpty({
  q,
  category,
  heading,
  body,
}: Readonly<{
  q: string;
  category?: string | undefined;
  heading?: string | undefined;
  body?: string | undefined;
}>) {
  if (q) {
    return (
      <Card className="text-center">
        <Icon name="search" className="mx-auto size-10 text-blue" />
        <h2 className="mt-4 text-h3">No stories match “{q}”</h2>
        <p className="mx-auto mt-3 max-w-lg text-grey">
          Try another phrase or clear the search to explore every Kedland story.
        </p>
        <Link
          href={category ? `/news?category=${category}` : "/news"}
          className="mt-6 inline-flex min-h-12 items-center rounded-pill bg-navy px-6 font-display font-bold text-white"
        >
          Clear search
        </Link>
      </Card>
    );
  }
  if (category) {
    return (
      <Card className="text-center">
        <h2 className="text-h3">Nothing here just yet</h2>
        <p className="mx-auto mt-3 max-w-lg text-grey">
          There are no posts in this category yet. Do have a look at the others.
        </p>
      </Card>
    );
  }
  return (
    <NewsEmptyState
      heading={heading ?? "Our first story is on its way"}
      body={body ?? "We are getting ready to share what our Stars have been up to."}
    />
  );
}

const FEATURE_TONES = {
  news: "from-blue to-navy",
  events: "from-pink to-red",
  learning: "from-green to-navy",
} as const;

function formatDate(iso: string | null): string {
  if (!iso) return "";

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function FeaturedPost({ post, cloudName }: Readonly<{ post: PostSummary; cloudName: string | undefined }>) {
  const published = formatDate(post.publishedAt);
  const coverUrl = post.coverImage ? postCoverUrl(post.coverImage.mediaId, cloudName, 1200) : null;

  return (
    <article className="group relative mt-7 overflow-hidden rounded-lg bg-white shadow-lift lg:grid lg:min-h-[27rem] lg:grid-cols-[1.05fr_0.95fr]">
      {coverUrl && post.coverImage ? (
        <div className="relative m-3 min-h-64 overflow-hidden rounded-md sm:m-4 lg:mr-0 lg:min-h-[calc(27rem_-_2rem)]">
          <Image
            src={coverUrl}
            alt={post.coverImage.alt}
            fill
            priority
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
          />
        </div>
      ) : (
        <div
          className={`relative flex min-h-64 items-center justify-center overflow-hidden bg-linear-to-br ${FEATURE_TONES[post.category]} lg:min-h-full`}
        >
          <Star className="size-40 text-white/12 sm:size-52" />
          <span className="absolute bottom-6 left-6 text-small font-bold uppercase tracking-[0.13em] text-white/65">
            A story from Kedland
          </span>
          <span className="absolute -right-10 -top-10 size-40 rounded-pill border-[28px] border-white/[0.04]" />
        </div>
      )}

      <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
        <p className="flex items-center gap-2 text-small font-bold uppercase tracking-[0.11em] text-red">
          <Icon name="star" className="size-4" />
          {POST_CATEGORY_LABELS[post.category]}
        </p>
        <h3 className="mt-5 text-[clamp(1.8rem,4vw,3rem)] leading-[1.06]">
          <Link
            href={`/news/${post.slug}`}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-blue"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-5 max-w-xl leading-relaxed text-ink/70">{post.excerpt}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3 text-small text-grey">
          {published && <time dateTime={post.publishedAt ?? undefined}>{published}</time>}
          {published && <span aria-hidden="true">•</span>}
          <span>{post.readingMinutes} min read</span>
        </div>
        <p className="mt-7 inline-flex items-center gap-2 font-display font-bold text-navy">
          Read the story <span aria-hidden="true">→</span>
        </p>
      </div>
    </article>
  );
}

/**
 * Previous and next only.
 *
 * Numbered pages are a lot of links for a school that will publish a handful of
 * posts a term, and every one is another URL for a crawler to walk.
 */
function Pager({
  page,
  totalPages,
  category,
  q,
}: Readonly<{ page: number; totalPages: number; category?: string | undefined; q?: string | undefined }>) {
  const href = (target: number): string => {
    const query = new URLSearchParams();
    if (category) query.set("category", category);
    if (q) query.set("q", q);
    if (target > 1) query.set("page", String(target));

    return query.size > 0 ? `/news?${query.toString()}` : "/news";
  };

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={href(page - 1)} className="font-display font-bold text-blue hover:underline">
          ← Newer posts
        </Link>
      ) : (
        <span />
      )}

      <p className="text-small text-grey">
        Page {page} of {totalPages}
      </p>

      {page < totalPages ? (
        <Link href={href(page + 1)} className="font-display font-bold text-blue hover:underline">
          Older posts →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
