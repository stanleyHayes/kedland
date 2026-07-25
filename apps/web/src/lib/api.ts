import type { PageKey } from "@kedland/types";

/**
 * The public site's read client.
 *
 * Every call is tagged, so publishing content can purge exactly the pages it
 * affects rather than the whole site. Pages are statically rendered at build
 * and regenerated on demand when the API calls the revalidation webhook — a
 * parent's request never waits on MongoDB (agent_plan §3.1).
 */

export interface Section {
  key: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
}

/** Cache tag for one page's content. Mirrored by the revalidation route. */
export function pageTag(page: PageKey): string {
  return `content:${page}`;
}

function apiUrl(path: string): string {
  const base = process.env["API_INTERNAL_URL"] ?? process.env["NEXT_PUBLIC_API_URL"] ?? "";
  return `${base.replace(/\/$/, "")}${path}`;
}

/**
 * Fetches a page's sections.
 *
 * Returns an empty list rather than throwing when the API is unreachable. A
 * page that renders its shell with nothing in it is a bad day; a page that
 * returns a 500 to a prospective parent is a worse one, and the header, footer
 * and contact details still work without the API.
 */
export async function getPageSections(page: PageKey): Promise<Section[]> {
  try {
    const response = await fetch(apiUrl(`/content?page=${encodeURIComponent(page)}`), {
      next: { tags: [pageTag(page)], revalidate: 3600 },
      // Without a deadline an unreachable API stalls the whole build: every
      // page waits on a socket that will never answer. Five seconds is far
      // more than a healthy API needs and far less than a build can spare.
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];
    return (await response.json()) as Section[];
  } catch {
    return [];
  }
}

/** Looks one section out of a page's list. */
export function findSection(sections: Section[], key: string): Section | undefined {
  return sections.find((section) => section.key === key);
}
