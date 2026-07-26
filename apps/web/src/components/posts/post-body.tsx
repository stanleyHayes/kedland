import type { SafeHtml } from "@/lib/markdown";

/**
 * The one place in this codebase that injects HTML.
 *
 * It takes `SafeHtml`, a branded type only `renderMarkdown` can produce, so it
 * cannot be handed a plain string — passing one is a type error rather than a
 * review comment somebody has to notice.
 *
 * Why there is no sanitiser: the renderer runs with `html: false`, so raw HTML
 * in a post body is escaped to visible text and the only markup reaching here
 * is markup the renderer itself emitted. `lib/markdown.spec.ts` proves that
 * against a parsed DOM for nine injection vectors, and fails if anyone flips
 * that flag. Adding DOMPurify would guard a surface that does not exist, at the
 * cost of a dependency and a jsdom to run it in on the server.
 *
 * Isolated in its own file so that this reasoning lives next to the code it
 * justifies, and so there is exactly one line to audit rather than one per page
 * that renders prose.
 */
export function PostBody({ html }: Readonly<{ html: SafeHtml }>) {
  return (
    <div
      className="prose-kedland mt-10 max-w-3xl"
      // nosemgrep -- Markdown rendered with html:false, proved inert by lib/markdown.spec.ts; see the note above
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
