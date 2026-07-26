import { revalidatePath, revalidateTag } from "next/cache";

/**
 * The cache-purge endpoint the API calls when an editor publishes.
 *
 * The site is statically rendered with a one-hour revalidation window, which is
 * right for pages nobody edits most days and wrong for the minute after
 * somebody presses Publish. This closes that gap.
 *
 * Everything about it is deliberately small: it purges tags and paths and
 * returns. It reads nothing, writes nothing, and the only thing a caller can
 * make it do is clear a cache — so a shared secret is proportionate, where a
 * signed payload would not buy anything.
 */

/** Caps how much one call can purge. A caller asking for a thousand paths is
 *  either broken or hostile; either way it should not become a workload. */
const MAX_TARGETS = 50;

interface RevalidateBody {
  tags?: unknown;
  paths?: unknown;
}

/** The strings in an unknown array, ignoring anything else in it. */
function stringsIn(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export async function POST(request: Request): Promise<Response> {
  const expected = process.env["REVALIDATE_SECRET"];

  // No secret configured means the endpoint is closed, not open. An
  // unconfigured deployment must not accept an unauthenticated purge just
  // because nobody set a variable.
  if (!expected) {
    return Response.json({ revalidated: false, reason: "not configured" }, { status: 503 });
  }

  const offered = request.headers.get("x-revalidate-secret");
  if (offered !== expected) {
    // Nothing about what was wrong: a caller guessing secrets learns nothing
    // from this, and the API — the only legitimate caller — never sees it.
    return Response.json({ revalidated: false }, { status: 401 });
  }

  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return Response.json({ revalidated: false, reason: "malformed body" }, { status: 400 });
  }

  const tags = stringsIn(body.tags).slice(0, MAX_TARGETS);
  // Only site-relative paths. An absolute URL here would be meaningless to
  // `revalidatePath` and is a sign the caller has misunderstood the contract.
  const paths = stringsIn(body.paths)
    .filter((path) => path.startsWith("/"))
    .slice(0, MAX_TARGETS);

  // Next 16 requires a cache profile alongside the tag. `{ expire: 0 }` says
  // "this is stale now" explicitly, rather than relying on what a named profile
  // like "max" happens to mean — which is the sort of detail that changes
  // between minor versions and fails silently when it does.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  for (const path of paths) revalidatePath(path);

  return Response.json({ revalidated: true, tags, paths });
}
