/**
 * One JSON-LD block, rendered where crawlers expect it.
 *
 * `JSON.stringify` alone is not safe inside a `<script>` element: a
 * `</script>` inside any string value closes the tag early and hands the rest
 * of the document to whatever an editor typed. Escaping every `<` as its
 * `<` escape sequence is the standard guard — the JSON parses to the
 * identical object, and the tag can never terminate early (the same class of
 * injection `markdownToText` refuses to reintroduce).
 */
export function JsonLd({ data }: Readonly<{ data: Record<string, unknown> }>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
