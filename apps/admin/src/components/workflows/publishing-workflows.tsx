import Image from "next/image";
import Link from "next/link";

import { Field, Icon, TextareaField } from "@kedland/ui";

import { AdminSelectField } from "./admin-select-field";
import { CollectionToolbar } from "./collection-toolbar";
import { ConfirmForm } from "./confirm-form";
import { FormDialog } from "./form-dialog";
import {
  DANGER_BUTTON,
  Feedback,
  formatDate,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TableHead,
  TableShell,
  Td,
  Th,
  WorkflowError,
  SubmitButton,
} from "./workflow-ui";

import type { MediaPickerOption } from "@/components/content/media-picker";
import type { MediaItem, Paginated, Post, PostSummary } from "@kedland/types";
import type { ReactNode } from "react";

import {
  createPostAction,
  deletePostAction,
  setPostPublicationAction,
  updatePostAction,
} from "@/app/(dashboard)/actions";
import { CoverImageField } from "@/components/posts/cover-image-field";
import {
  EmptyState,
  PageHeader,
  Pagination,
  Panel,
  PanelHeader,
  StatusChip,
} from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";

const CATEGORY_OPTIONS = [
  { value: "news", label: "News" },
  { value: "events", label: "Events" },
  { value: "learning", label: "Learning" },
];

/**
 * The media library, or an empty one.
 *
 * A library that will not load is not a reason to refuse to edit a post. The
 * picker degrades to its "nothing here yet" note and every other field on the
 * form still saves — which is better than a page that shows an error where the
 * article used to be because an optional lookup failed.
 */
async function loadMedia(): Promise<MediaItem[]> {
  try {
    return await apiFetch<MediaItem[]>("/admin/media");
  } catch {
    return [];
  }
}

/**
 * Images an editor may attach, in the picker's shape.
 *
 * Photographs of pupils without consent recorded are not offered. This is the
 * same rule the content workspace applies, and it belongs here rather than in
 * the API response because the library itself is allowed to hold them — what is
 * restricted is publishing them.
 *
 * The value is `publicId`, **not** `id`. A post's `coverImage.mediaId` is
 * resolved by the public site through `postCoverUrl`, which treats it as a
 * Cloudinary public ID (or a bundled starter key) and never looks anything up
 * in the library. Sending the Mongo id would save cleanly, render a plausible
 * Cloudinary URL, and 404 on every visitor's screen.
 */
function mediaOptionsFrom(media: readonly MediaItem[]): MediaPickerOption[] {
  return media
    .filter((item) => !item.depictsPupils || (item.consentOnFile && Boolean(item.consentRef)))
    .map((item) => ({ value: item.publicId, label: item.alt, imageUrl: item.url }));
}

interface FeedbackProps {
  notice?: string | undefined;
  error?: string | undefined;
}

export async function PostsWorkflow({
  page = 1,
  q,
  category,
  status,
  notice,
  error,
}: Readonly<
  FeedbackProps & {
    page?: number | undefined;
    q?: string | undefined;
    category?: string | undefined;
    status?: string | undefined;
  }
>) {
  let posts: Paginated<PostSummary> | null = null;
  let loadError: string | null = null;
  const mediaOptions = mediaOptionsFrom(await loadMedia());
  try {
    const query = new URLSearchParams({ pageSize: "9", page: String(page) });
    if (q) query.set("q", q);
    if (CATEGORY_OPTIONS.some((option) => option.value === category)) query.set("category", category ?? "");
    if (status === "draft" || status === "published") query.set("status", status);
    posts = await apiFetch<Paginated<PostSummary>>(`/admin/posts?${query.toString()}`);
  } catch (caught) {
    loadError = caught instanceof Error ? caught.message : "Posts could not be loaded.";
  }
  const postListTitle = posts ? `All posts (${String(posts.total)})` : "All posts";
  const postHref = (target: number): string => {
    const params = new URLSearchParams();
    if (target > 1) params.set("page", String(target));
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    return params.size ? `/posts?${params.toString()}` : "/posts";
  };

  return (
    <div className="mx-auto max-w-[92rem]">
      <PageHeader
        eyebrow="Publishing workspace"
        title="Posts"
        description="Create drafts, edit the full article and control what is published."
        action={
          <FormDialog
            title="Create a draft"
            description="Start the article here. It will remain private until a staff member publishes it."
            triggerLabel="New draft"
            size="xl"
          >
            <PostForm action={createPostAction} submitLabel="Create draft" mediaOptions={mediaOptions} />
          </FormDialog>
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>
      <CollectionToolbar
        action="/posts"
        query={q}
        placeholder="Search titles and excerpts"
        filters={[
          {
            name: "category",
            label: "Category",
            value: category,
            options: [{ value: "", label: "All categories" }, ...CATEGORY_OPTIONS],
          },
          {
            name: "status",
            label: "Status",
            value: status,
            options: [
              { value: "", label: "All statuses" },
              { value: "draft", label: "Drafts" },
              { value: "published", label: "Published" },
            ],
          },
        ]}
      />

      <div className="mt-8">
        <section aria-labelledby="post-list">
          <PanelHeader id="post-list" title={postListTitle} />
          <Panel flush className="mt-4 overflow-hidden">
            {loadError && <WorkflowError message={loadError} />}
            {posts?.items.length === 0 && (
              <EmptyState
                icon={q || category || status ? "search" : "book"}
                title={q || category || status ? "No matching posts" : "No posts yet"}
                body={
                  q || category || status
                    ? "Try a broader search or clear the filters to see every post."
                    : "Create the first draft and it will appear here for editing and publication."
                }
                action={
                  q || category || status ? (
                    <Link href="/posts" className={SECONDARY_BUTTON}>
                      Clear filters
                    </Link>
                  ) : undefined
                }
              />
            )}
            {posts && posts.items.length > 0 && (
              <TableShell label="Posts">
                <TableHead>
                  <Th>Post</Th>
                  <Th>Category</Th>
                  <Th>Status</Th>
                  <Th>Updated</Th>
                  <Th align="right">Action</Th>
                </TableHead>
                <tbody>
                  {posts.items.map((post) => (
                    <tr key={post.id}>
                      <Td>
                        <p className="font-display font-bold text-navy">{post.title}</p>
                        <p className="mt-0.5 max-w-lg truncate text-grey">{post.excerpt}</p>
                      </Td>
                      <Td className="capitalize">{post.category}</Td>
                      <Td>
                        <StatusChip tone={post.status === "published" ? "healthy" : "attention"}>
                          {post.status === "published" ? "Published" : "Draft"}
                        </StatusChip>
                      </Td>
                      <Td className="whitespace-nowrap text-grey">{formatDate(post.updatedAt)}</Td>
                      <Td className="text-right">
                        <Link href={`/posts/${post.id}`} className={SECONDARY_BUTTON}>
                          Edit
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </Panel>
          {posts && <Pagination page={posts.page} totalPages={posts.totalPages} href={postHref} />}
        </section>
      </div>
    </div>
  );
}

export async function PostEditorWorkflow({ id, notice, error }: Readonly<{ id: string } & FeedbackProps>) {
  let post: Post;
  let cover: MediaItem | null = null;
  try {
    post = await apiFetch<Post>(`/admin/posts/${id}`);
  } catch (caught) {
    return (
      <WorkflowError message={caught instanceof Error ? caught.message : "The post could not be loaded."} />
    );
  }
  const media = await loadMedia();
  const mediaOptions = mediaOptionsFrom(media);
  let coverMediaId: string | undefined;

  if (post.coverImage) {
    cover =
      media.find(
        (item) => item.id === post.coverImage?.mediaId || item.publicId === post.coverImage?.mediaId,
      ) ?? null;

    // Prefer the library's own public ID. When the stored value is a Mongo id —
    // written before covers were addressed this way — selecting the matching
    // tile and saving quietly migrates it to the form the site can resolve.
    coverMediaId = cover ? cover.publicId : post.coverImage.mediaId;

    // Whatever is currently on the post is always offered, even when the library
    // does not account for it: the seeded articles point at images bundled with
    // the site and have no library row at all, and a pupil photograph can lose
    // its consent record after publication. Omitting it would show "No header
    // image" above an article that visibly has one, and the next save would
    // delete a cover nobody chose to remove.
    if (!mediaOptions.some((option) => option.value === coverMediaId)) {
      mediaOptions.unshift({
        value: coverMediaId,
        label: `${post.coverImage.alt} (in use)`,
        imageUrl: cover?.url,
      });
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Publishing · Posts"
        title={post.title}
        description={`/${post.slug} · Last saved ${formatDate(post.updatedAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/posts" className={SECONDARY_BUTTON}>
              Back to posts
            </Link>
            <FormDialog
              title={`Edit ${post.title}`}
              description="Update the article, publishing metadata and search description."
              triggerLabel="Edit post"
              size="xl"
            >
              <PostForm
                action={updatePostAction}
                submitLabel="Save changes"
                post={post}
                returnTo={`/posts/${post.id}`}
                mediaOptions={mediaOptions}
                coverMediaId={coverMediaId}
              />
            </FormDialog>
          </div>
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>

      <Panel className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusChip tone={post.status === "published" ? "healthy" : "attention"}>
            {post.status === "published" ? "Published" : "Draft"}
          </StatusChip>
          <div className="flex flex-wrap gap-2">
            <form action={setPostPublicationAction}>
              <input type="hidden" name="id" value={post.id} />
              <input type="hidden" name="returnTo" value={`/posts/${post.id}`} />
              <input
                type="hidden"
                name="operation"
                value={post.status === "published" ? "unpublish" : "publish"}
              />
              <SubmitButton className={SECONDARY_BUTTON}>
                {post.status === "published" ? "Return to draft" : "Publish"}
              </SubmitButton>
            </form>
            <ConfirmForm action={deletePostAction} message={`Delete “${post.title}”? This cannot be undone.`}>
              <input type="hidden" name="id" value={post.id} />
              <SubmitButton className={DANGER_BUTTON}>Delete</SubmitButton>
            </ConfirmForm>
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="admin-panel overflow-hidden rounded-lg">
          {cover && post.coverImage && (
            <div className="relative min-h-72 overflow-hidden border-b border-sky/55 bg-sky/20 sm:min-h-96">
              <Image
                src={cover.url}
                alt={post.coverImage.alt}
                fill
                sizes="(min-width: 1280px) 60rem, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-small">
              <StatusChip tone="info">{post.category}</StatusChip>
              <span className="text-grey">{String(post.readingMinutes)} min read</span>
            </div>
            <p className="mt-5 text-pretty text-h3 font-semibold leading-relaxed text-navy">{post.excerpt}</p>
            <div className="mt-6 border-t border-sky/55 pt-6">
              <h2 className="text-h3">Article</h2>
              <div className="mt-4 whitespace-pre-wrap text-pretty leading-8 text-ink">{post.body}</div>
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <Panel>
            <PanelHeader title="Publishing details" />
            <dl className="admin-detail-list mt-5">
              <DetailValue label="Status">
                <StatusChip tone={post.status === "published" ? "healthy" : "attention"}>
                  {post.status === "published" ? "Published" : "Draft"}
                </StatusChip>
              </DetailValue>
              <DetailValue label="Category" value={post.category} capitalize />
              <DetailValue label="Published" value={formatDate(post.publishedAt)} />
              <DetailValue label="Created" value={formatDate(post.createdAt)} />
              <DetailValue label="Last updated" value={formatDate(post.updatedAt)} />
              <DetailValue label="Author record" value={post.authorId ?? "System or seed content"} />
            </dl>
          </Panel>

          <Panel>
            <PanelHeader title="Search preview" />
            <dl className="admin-detail-list mt-5">
              <DetailValue label="SEO title" value={post.seoTitle ?? post.title} />
              <DetailValue label="SEO description" value={post.seoDescription ?? post.excerpt} />
              <DetailValue label="URL path" value={`/news/${post.slug}`} />
            </dl>
            {post.status === "published" && (
              <a
                href={`${process.env["NEXT_PUBLIC_SITE_URL"] ?? ""}/news/${post.slug}`}
                target="_blank"
                rel="noreferrer"
                className={`${SECONDARY_BUTTON} mt-5`}
              >
                View public story
              </a>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function DetailValue({
  label,
  value,
  children,
  capitalize = false,
}: Readonly<{
  label: string;
  value?: string;
  children?: ReactNode;
  capitalize?: boolean;
}>) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={capitalize ? "capitalize" : ""}>{children ?? value ?? "—"}</dd>
    </div>
  );
}

function PostForm({
  action,
  submitLabel,
  post,
  returnTo,
  mediaOptions = [],
  coverMediaId,
}: Readonly<{
  action: (formData: FormData) => Promise<never>;
  submitLabel: string;
  post?: Post;
  returnTo?: string;
  mediaOptions?: readonly MediaPickerOption[];
  /**
   * The library id of the current header image.
   *
   * Resolved by the caller rather than read straight off `post.coverImage`:
   * older posts store a Cloudinary `publicId` there, which matches no option in
   * the picker, and an unmatched value would render as "No header image" —
   * quietly offering to delete a cover the editor can plainly see above.
   */
  coverMediaId?: string | undefined;
}>) {
  return (
    <form action={action} className="grid gap-5">
      {post && <input type="hidden" name="id" value={post.id} />}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <Field
        id={`${post?.id ?? "new"}-title`}
        name="title"
        label="Title"
        required
        defaultValue={post?.title}
      />
      <Field
        id={`${post?.id ?? "new"}-slug`}
        name="slug"
        label="URL slug"
        defaultValue={post?.slug}
        hint="Leave blank on a new post to derive it from the title."
      />
      <AdminSelectField
        id={`${post?.id ?? "new"}-category`}
        name="category"
        label="Category"
        required
        options={CATEGORY_OPTIONS}
        defaultValue={post?.category ?? "news"}
      />
      <TextareaField
        id={`${post?.id ?? "new"}-excerpt`}
        name="excerpt"
        label="Excerpt"
        rows={3}
        required
        defaultValue={post?.excerpt}
      />
      <TextareaField
        id={`${post?.id ?? "new"}-body`}
        name="body"
        label="Article body"
        rows={post ? 18 : 9}
        required
        defaultValue={post?.body}
        hint="Markdown is supported for headings, emphasis, lists and links."
      />
      <CoverImageField
        idPrefix={post?.id ?? "new"}
        options={mediaOptions}
        defaultMediaId={coverMediaId}
        defaultAlt={post?.coverImage?.alt}
      />
      <Field
        id={`${post?.id ?? "new"}-seo-title`}
        name="seoTitle"
        label="SEO title"
        defaultValue={post?.seoTitle ?? ""}
      />
      <TextareaField
        id={`${post?.id ?? "new"}-seo-description`}
        name="seoDescription"
        label="SEO description"
        rows={3}
        defaultValue={post?.seoDescription ?? ""}
      />
      <SubmitButton className={PRIMARY_BUTTON}>
        <Icon name="book" className="mr-2 size-4" />
        {submitLabel}
      </SubmitButton>
    </form>
  );
}

export async function CategoriesWorkflow() {
  const categories = await Promise.all(
    CATEGORY_OPTIONS.map(async (category) => {
      try {
        const response = await apiFetch<Paginated<PostSummary>>(
          `/admin/posts?category=${category.value}&pageSize=1`,
        );
        return { ...category, count: response.total, error: null };
      } catch (caught) {
        return {
          ...category,
          count: null,
          error: caught instanceof Error ? caught.message : "Unavailable",
        };
      }
    }),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Publishing workspace"
        title="Categories"
        description="Kedland uses three code-owned categories so the public news filters stay coherent."
      />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {categories.map((category) => (
          <Panel key={category.value} className="relative overflow-hidden">
            <Icon
              name="blocks"
              className="pointer-events-none absolute -bottom-5 -right-4 size-24 text-navy opacity-[0.05]"
            />
            <p className="font-display text-h3 font-bold text-navy">{category.label}</p>
            <p className="mt-3 font-display text-4xl font-extrabold text-navy">{category.count ?? "—"}</p>
            <p className="mt-2 text-small text-grey">
              {category.error ?? `${String(category.count)} posts use this category.`}
            </p>
            <Link
              href={`/posts?category=${category.value}`}
              className="mt-5 inline-block font-bold text-blue"
            >
              View posts →
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}
