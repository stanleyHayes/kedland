import Link from "next/link";

import { buttonClasses } from "@kedland/ui";

import type { Paginated, PostSummary } from "@kedland/types";

import {
  AttentionRow,
  DataError,
  EmptyState,
  Metric,
  PageHeader,
  Panel,
  PanelHeader,
  QuickAction,
  StatusChip,
  type MetricProps,
  type Tone,
} from "@/components/ui/primitives";
import { ApiError, apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/auth";

/**
 * What somebody signing in needs to know first.
 *
 * Not a wall of statistics. This is a back office for three people whose job is
 * publishing news and answering parents, so the page answers two questions: is
 * anything waiting for me, and what do I do next.
 */

interface EnquiryCounts {
  unread: number;
  undelivered: number;
}

const ENQUIRIES_PATH = "/enquiries";
const POSTS_PATH = "/posts";

/**
 * Reads a figure, or reports that it could not be read.
 *
 * `null` on failure rather than `0`, deliberately: showing "0 enquiries" when
 * the API is unreachable tells the office there is nothing waiting, which is
 * the one wrong answer that costs them a parent.
 */
async function safely<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

/**
 * The three metrics, decided in one place.
 *
 * Extracted from the JSX because each figure needs a value, a context line and
 * a tone, and expressing that as nested ternaries inline made the page hard to
 * read and impossible to test. A metric's *meaning* is logic, not markup.
 */
function metrics(counts: EnquiryCounts | null, posts: Paginated<PostSummary> | null): MetricProps[] {
  const drafts = posts?.items.filter((post) => post.status === "draft").length;
  const waiting = counts?.unread ?? 0;
  const undelivered = counts?.undelivered ?? 0;

  return [
    {
      label: "New enquiries",
      value: counts?.unread,
      context: waiting > 0 ? "Parents waiting for a reply" : "Nothing waiting — all replied to",
      icon: "heart",
      tone: waiting > 0 ? "info" : "healthy",
      href: ENQUIRIES_PATH,
    },
    {
      label: "Drafts",
      value: drafts,
      context: drafts === 0 ? "Nothing unfinished" : "Started but not published",
      icon: "book",
      tone: "neutral",
      href: POSTS_PATH,
    },
    /*
     * The one figure that is always a problem when it is not zero: the parent's
     * message was saved but the school was never emailed, so nobody knows it is
     * there.
     */
    {
      label: "Not emailed",
      value: counts?.undelivered,
      context:
        undelivered > 0 ? "Saved, but the school was not notified" : "Every enquiry reached the office",
      icon: "shield",
      tone: undelivered > 0 ? "urgent" : "healthy",
      href: ENQUIRIES_PATH,
    },
  ];
}

/** Which data source failed, said plainly and scoped to what it affects. */
function failureNotice(counts: unknown, posts: unknown): string | null {
  if (counts === null && posts === null) {
    return "The API could not be reached, so no figures below are current.";
  }
  if (counts === null) return "Enquiry figures could not be loaded. They show “—” rather than zero.";
  if (posts === null) return "Posts could not be loaded just now.";

  return null;
}

interface AttentionItem {
  icon: string;
  title: string;
  body: string;
  tone: Tone;
  href: string;
  actionLabel: string;
}

function attentionItems(counts: EnquiryCounts | null, posts: Paginated<PostSummary> | null): AttentionItem[] {
  const items: AttentionItem[] = [];
  const drafts = posts?.items.filter((post) => post.status === "draft").length ?? 0;

  if (counts && counts.undelivered > 0) {
    items.push({
      icon: "shield",
      title: `${String(counts.undelivered)} ${
        counts.undelivered === 1 ? "enquiry was" : "enquiries were"
      } not emailed`,
      body: "The messages were saved, but the school was not notified. Review these first.",
      tone: "urgent",
      href: ENQUIRIES_PATH,
      actionLabel: "Review inbox",
    });
  }

  if (counts && counts.unread > 0) {
    items.push({
      icon: "message",
      title: `${String(counts.unread)} new ${
        counts.unread === 1 ? "enquiry needs" : "enquiries need"
      } a response`,
      body: "Parents are waiting for the school to read and respond.",
      tone: "info",
      href: ENQUIRIES_PATH,
      actionLabel: "Open enquiries",
    });
  }

  if (posts && drafts > 0) {
    items.push({
      icon: "book",
      title: `${String(drafts)} ${drafts === 1 ? "draft is" : "drafts are"} still in progress`,
      body: "Continue editing when the story is ready for review or publication.",
      tone: "attention",
      href: POSTS_PATH,
      actionLabel: "Continue writing",
    });
  }

  return items;
}

function AttentionList({ items, incomplete }: Readonly<{ items: AttentionItem[]; incomplete: boolean }>) {
  if (items.length > 0) {
    return (
      <div className="divide-y divide-sky/55">
        {items.map((item) => (
          <AttentionRow key={item.title} {...item} />
        ))}
      </div>
    );
  }

  if (incomplete) {
    return (
      <EmptyState
        icon="shield"
        title="Attention list is incomplete"
        body="Some operational data is unavailable. The figures above show exactly which source failed."
      />
    );
  }

  return (
    <EmptyState
      icon="sparkle"
      title="Nothing urgent is waiting"
      body="All enquiries were delivered, no parent is waiting unread, and there are no unfinished drafts."
    />
  );
}

export default async function OverviewPage() {
  const user = await requireUser();

  const [counts, posts] = await Promise.all([
    safely(() => apiFetch<EnquiryCounts>("/admin/enquiries/counts")),
    safely(() => apiFetch<Paginated<PostSummary>>("/admin/posts?pageSize=5")),
  ]);

  const notice = failureNotice(counts, posts);
  const attention = attentionItems(counts, posts);
  const dataTone: Tone = notice ? "attention" : "healthy";

  return (
    <div className="mx-auto max-w-[88rem]">
      <PageHeader
        eyebrow="Daily briefing"
        title={`Good to see you, ${user.displayName.split(" ")[0] ?? "there"}`}
        description="Here is what needs attention across enquiries and publishing today."
        action={
          <Link href={POSTS_PATH} className={buttonClasses({ size: "sm", className: "!rounded-md" })}>
            Write a post
          </Link>
        }
      />

      {/* Scoped to what failed, above the figures it affects, rather than
          replacing a page whose other sections are working. */}
      {notice && (
        <div className="mt-6">
          <DataError>{notice}</DataError>
        </div>
      )}

      <section aria-labelledby="waiting" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PanelHeader id="waiting" title="School operations" />
          <StatusChip tone={dataTone}>{notice ? "Partial data" : "Live data"}</StatusChip>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {metrics(counts, posts).map((metric) => (
            <Metric key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <div className="mt-9 grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.75fr)]">
        <section aria-labelledby="attention">
          <PanelHeader id="attention" title="Needs attention" />
          <Panel flush className="mt-4 overflow-hidden">
            <AttentionList items={attention} incomplete={counts === null || posts === null} />
          </Panel>
        </section>

        <section aria-labelledby="quick-actions">
          <PanelHeader id="quick-actions" title="Quick actions" />
          <Panel className="mt-4 p-2">
            <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
              <QuickAction
                icon="book"
                label="Write a post"
                description="Create a school story or update."
                href={POSTS_PATH}
              />
              <QuickAction
                icon="message"
                label="Review enquiries"
                description="Read and respond to parent messages."
                href={ENQUIRIES_PATH}
              />
              <QuickAction
                icon="images"
                label="Manage media"
                description="Review images, alt text and consent."
                href="/media"
              />
            </div>
          </Panel>
        </section>
      </div>

      <section aria-labelledby="recent" className="mt-9">
        <PanelHeader
          id="recent"
          title="Latest posts"
          action={
            <Link href={POSTS_PATH} className="text-small font-bold text-blue hover:underline">
              All posts →
            </Link>
          }
        />

        <Panel flush className="mt-4 overflow-hidden">
          {posts && posts.items.length > 0 ? (
            <ul>
              {posts.items.map((post, index) => (
                <li key={post.id} className={index === 0 ? "" : "border-t border-sky/60"}>
                  <Link
                    href={`/posts/${post.id}`}
                    className="admin-row-hover group flex items-center gap-4 px-5 py-4 transition-colors"
                  >
                    <span className="admin-icon-button grid size-9 shrink-0 place-items-center text-navy">
                      <span className="size-2 rounded-pill bg-blue" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display font-bold text-navy group-hover:text-blue">
                        {post.title}
                      </span>
                      <span className="mt-0.5 block text-small capitalize text-grey">{post.category}</span>
                    </span>
                    <StatusChip tone={post.status === "published" ? "healthy" : "attention"}>
                      {post.status === "published" ? "Live" : "Draft"}
                    </StatusChip>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            /* An empty list and a failed call must not look the same: one is
               good news waiting to be written, the other is a fault. */
            <PostsPlaceholder failed={posts === null} />
          )}
        </Panel>
      </section>
    </div>
  );
}

function PostsPlaceholder({ failed }: Readonly<{ failed: boolean }>) {
  if (failed) {
    return (
      <EmptyState
        icon="shield"
        title="Posts could not be loaded"
        body="This is a connection problem, not an empty school. Try again in a moment."
      />
    );
  }

  return (
    <EmptyState
      icon="book"
      title="No posts yet"
      body="Write the school's first story — parents check this page more than any other."
      action={
        <Link href={POSTS_PATH} className={buttonClasses({ size: "sm", className: "!rounded-md" })}>
          Write a post
        </Link>
      }
    />
  );
}
