import Link from "next/link";

import { Card, Icon } from "@kedland/ui";

import type { Paginated, PostSummary } from "@kedland/types";

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

export default async function OverviewPage() {
  const user = await requireUser();

  const [counts, posts] = await Promise.all([
    safely(() => apiFetch<EnquiryCounts>("/admin/enquiries/counts")),
    safely(() => apiFetch<Paginated<PostSummary>>("/admin/posts?pageSize=5")),
  ]);

  const drafts = posts?.items.filter((post) => post.status === "draft").length ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="text-small font-bold uppercase tracking-[0.06em] text-grey">Dashboard</p>
        <h1 className="mt-1 text-h2">Good to see you, {user.displayName.split(" ")[0]}</h1>
      </header>

      <section aria-labelledby="waiting" className="mt-8">
        <h2 id="waiting" className="text-h3">
          Waiting for you
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat
            icon="heart"
            label="New enquiries"
            value={counts?.unread}
            href="/enquiries"
            tone={counts && counts.unread > 0 ? "attention" : "calm"}
          />
          <Stat icon="book" label="Drafts" value={posts ? drafts : undefined} href="/posts" tone="calm" />
          {/*
            Undelivered enquiries are the one figure that is always a problem
            when it is non-zero: the parent's message was saved but the school
            was never emailed, so nobody knows it is there.
          */}
          <Stat
            icon="shield"
            label="Not emailed"
            value={counts?.undelivered}
            href="/enquiries"
            tone={counts && counts.undelivered > 0 ? "alarm" : "calm"}
          />
        </div>

        {(counts === null || posts === null) && (
          <output className="mt-4 block text-small font-semibold text-red-text">
            Some figures could not be loaded just now — they are shown as “—” rather than as zero.
          </output>
        )}
      </section>

      <section aria-labelledby="recent" className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent" className="text-h3">
            Latest posts
          </h2>
          <Link href="/posts" className="text-small font-bold text-blue hover:underline">
            All posts →
          </Link>
        </div>

        <Card className="mt-4 p-0">
          {posts && posts.items.length > 0 ? (
            <ul>
              {posts.items.map((post, index) => (
                <li key={post.id} className={index === 0 ? "" : "border-t border-sky/60"}>
                  <Link
                    href={`/posts/${post.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-cream"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display font-bold text-navy">{post.title}</span>
                      <span className="mt-0.5 block text-small capitalize text-grey">{post.category}</span>
                    </span>
                    <StatusPill status={post.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-grey">
              {posts === null
                ? "Posts could not be loaded just now."
                : "No posts yet. Write the school's first story."}
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}

const TONES = {
  calm: "text-navy",
  attention: "text-blue",
  alarm: "text-red-text",
} as const;

function Stat({
  icon,
  label,
  value,
  href,
  tone,
}: Readonly<{
  icon: string;
  label: string;
  /** `undefined` means it could not be read — shown as a dash, never as zero. */
  value: number | undefined;
  href: string;
  tone: keyof typeof TONES;
}>) {
  return (
    <Link href={href} className="block">
      <Card interactive className="h-full">
        <span className="flex items-center gap-2 text-small font-bold uppercase tracking-[0.06em] text-grey">
          <Icon name={icon} className="size-4" />
          {label}
        </span>
        <span className={`mt-2 block font-display text-h1 font-extrabold ${TONES[tone]}`}>
          {value ?? "—"}
        </span>
      </Card>
    </Link>
  );
}

function StatusPill({ status }: Readonly<{ status: "draft" | "published" }>) {
  return (
    <span
      className={`shrink-0 rounded-pill px-3 py-1 text-small font-bold ${
        status === "published" ? "bg-green/15 text-navy" : "bg-yellow/25 text-ink"
      }`}
    >
      {status === "published" ? "Live" : "Draft"}
    </span>
  );
}
