import Link from "next/link";

import { POST_CATEGORY_LABELS, postCategorySchema } from "@kedland/types";
import { Card } from "@kedland/ui";

import type { Metadata } from "next";

import { PostCard } from "@/components/posts/post-card";
import { NewsEmptyState } from "@/components/sections/blocks-extra";
import { ContentPage } from "@/components/sections/content-page";
import { findSection, getPageSections, getPosts } from "@/lib/api";

export const metadata: Metadata = {
  title: "News & Blog | Kedland International School",
  description: "The latest news, events and stories from Kedland International School in Lashibi-Tema.",
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

  const posts = await getPosts({
    page,
    ...(category.success ? { category: category.data } : {}),
  });

  const cloudName = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"];

  // The empty-state copy is CMS-editable and lives on this page's `intro`
  // section, but only this component knows whether the list is actually empty —
  // rendering it from the section itself announced "our first story is on its
  // way" directly above a list of published stories.
  const intro = findSection(await getPageSections("news"), "intro")?.data as
    { emptyStateHeading?: string; emptyStateBody?: string } | undefined;

  return (
    <>
      {/* The heading and standfirst are CMS-editable, like every other page.
          Only the list below is generated. */}
      <ContentPage page="news" />

      <section className="px-6 pb-14">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Filter by category" className="flex flex-wrap gap-2.5">
            <CategoryLink label="All" href="/news" active={!category.success} />
            {postCategorySchema.options.map((option) => (
              <CategoryLink
                key={option}
                label={POST_CATEGORY_LABELS[option]}
                href={`/news?category=${option}`}
                active={category.success && category.data === option}
              />
            ))}
          </nav>

          {posts.items.length > 0 ? (
            <ul className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.items.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} cloudName={cloudName} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-9">
              {category.success ? (
                // A category with nothing in it is a different message from a
                // site with nothing in it: the school has published, just not
                // here, and pointing a parent at the other tabs is more use
                // than telling them to wait.
                <Card className="text-center">
                  <h2 className="text-h3">Nothing here just yet</h2>
                  <p className="mx-auto mt-3 max-w-lg text-grey">
                    There are no posts in this category yet. Do have a look at the others.
                  </p>
                </Card>
              ) : (
                <NewsEmptyState
                  heading={intro?.emptyStateHeading ?? "Our first story is on its way"}
                  body={
                    intro?.emptyStateBody ?? "We are getting ready to share what our Stars have been up to."
                  }
                />
              )}
            </div>
          )}

          {posts.totalPages > 1 && (
            <Pager
              page={posts.page}
              totalPages={posts.totalPages}
              category={category.success ? category.data : undefined}
            />
          )}
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
      className={`inline-flex min-h-11 items-center rounded-pill px-5 font-display font-bold transition-colors ${
        active ? "bg-navy text-white" : "bg-white text-navy shadow-card hover:bg-sky/40"
      }`}
    >
      {label}
    </Link>
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
}: Readonly<{ page: number; totalPages: number; category?: string | undefined }>) {
  const href = (target: number): string => {
    const query = new URLSearchParams();
    if (category) query.set("category", category);
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
