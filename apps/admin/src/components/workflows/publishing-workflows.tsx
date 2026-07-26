import Link from "next/link";

import { Field, Icon, TextareaField } from "@kedland/ui";

import { AdminSelectField } from "./admin-select-field";
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
} from "./workflow-ui";

import type { Paginated, Post, PostSummary } from "@kedland/types";

import {
  createPostAction,
  deletePostAction,
  setPostPublicationAction,
  updatePostAction,
} from "@/app/(dashboard)/actions";
import { EmptyState, PageHeader, Panel, PanelHeader, StatusChip } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";

const CATEGORY_OPTIONS = [
  { value: "news", label: "News" },
  { value: "events", label: "Events" },
  { value: "learning", label: "Learning" },
];

interface FeedbackProps {
  notice?: string | undefined;
  error?: string | undefined;
}

export async function PostsWorkflow({ notice, error }: Readonly<FeedbackProps>) {
  let posts: Paginated<PostSummary> | null = null;
  let loadError: string | null = null;
  try {
    posts = await apiFetch<Paginated<PostSummary>>("/admin/posts?pageSize=50");
  } catch (caught) {
    loadError = caught instanceof Error ? caught.message : "Posts could not be loaded.";
  }
  const postListTitle = posts ? `All posts (${String(posts.total)})` : "All posts";

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
            <PostForm action={createPostAction} submitLabel="Create draft" />
          </FormDialog>
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>

      <div className="mt-8">
        <section aria-labelledby="post-list">
          <PanelHeader id="post-list" title={postListTitle} />
          <Panel flush className="mt-4 overflow-hidden">
            {loadError && <WorkflowError message={loadError} />}
            {posts?.items.length === 0 && (
              <EmptyState
                icon="book"
                title="No posts yet"
                body="Create the first draft and it will appear here for editing and publication."
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
        </section>
      </div>
    </div>
  );
}

export async function PostEditorWorkflow({ id, notice, error }: Readonly<{ id: string } & FeedbackProps>) {
  let post: Post;
  try {
    post = await apiFetch<Post>(`/admin/posts/${id}`);
  } catch (caught) {
    return (
      <WorkflowError message={caught instanceof Error ? caught.message : "The post could not be loaded."} />
    );
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
              <PostForm action={updatePostAction} submitLabel="Save changes" post={post} />
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
              <input
                type="hidden"
                name="operation"
                value={post.status === "published" ? "unpublish" : "publish"}
              />
              <button type="submit" className={SECONDARY_BUTTON}>
                {post.status === "published" ? "Return to draft" : "Publish"}
              </button>
            </form>
            <ConfirmForm action={deletePostAction} message={`Delete “${post.title}”? This cannot be undone.`}>
              <input type="hidden" name="id" value={post.id} />
              <button type="submit" className={DANGER_BUTTON}>
                Delete
              </button>
            </ConfirmForm>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function PostForm({
  action,
  submitLabel,
  post,
}: Readonly<{
  action: (formData: FormData) => Promise<never>;
  submitLabel: string;
  post?: Post;
}>) {
  return (
    <form action={action} className="grid gap-5">
      {post && <input type="hidden" name="id" value={post.id} />}
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
      <button type="submit" className={PRIMARY_BUTTON}>
        <Icon name="book" className="mr-2 size-4" />
        {submitLabel}
      </button>
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
