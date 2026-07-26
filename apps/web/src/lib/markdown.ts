import MarkdownIt from "markdown-it";

/**
 * Renders a post's Markdown to HTML.
 *
 * **`html: false` is the security boundary.** With it, raw HTML in a post is
 * escaped and rendered as visible text rather than parsed as markup. That means
 * there is no injection surface here at all, and so no sanitiser to keep
 * configured, no allowlist to get subtly wrong, and no dependency on somebody
 * else's idea of which attributes are safe. A `<script>` in a post body shows
 * up as the literal characters `<script>`, which is exactly what an editor who
 * typed it deserves to see.
 *
 * The alternative — storing HTML and sanitising on the way out — puts the
 * safety of every page on getting a sanitiser's configuration right forever.
 */
const renderer = new MarkdownIt({
  html: false,
  // Turn bare URLs into links. Editors paste them; expecting them to write
  // link syntax by hand is expecting them to remember something they will not.
  linkify: true,
  // Curly quotes, em dashes and ellipses. The school's copy is British English
  // prose and it should look like it was typeset rather than typed.
  typographer: true,
  breaks: false,
});

/**
 * Shifts heading levels down by one, and marks up links that leave the site.
 *
 * The post's title is the page's `<h1>`, so a `#` in the body must not be a
 * second one — a document with two h1s has no clear outline, and screen-reader
 * users navigate by exactly that outline. `#` therefore becomes `<h2>`, and so
 * on down; `######` has nowhere to go and stays at `<h6>`.
 *
 * Applied to the module's own renderer rather than to a parameter: there is one
 * renderer, and passing it in only to mutate it made it look configurable when
 * it is not.
 */
{
  const md = renderer;

  md.renderer.rules["heading_open"] = (tokens, index) => {
    const level = Number.parseInt(tokens[index]?.tag.slice(1) ?? "1", 10);
    return `<h${String(Math.min(level + 1, 6))}>`;
  };

  md.renderer.rules["heading_close"] = (tokens, index) => {
    const level = Number.parseInt(tokens[index]?.tag.slice(1) ?? "1", 10);
    return `</h${String(Math.min(level + 1, 6))}>`;
  };

  const defaultLinkOpen =
    md.renderer.rules["link_open"] ??
    ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options));

  md.renderer.rules["link_open"] = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const href = token?.attrGet("href") ?? "";

    // A link to somewhere else opens in a new tab, with `noopener` so the new
    // page cannot reach back into ours. Internal links stay in place — sending
    // a visitor to a new tab to read another page of the same site is rude.
    if (/^https?:\/\//.test(href) && !href.includes("kedland.edu.gh")) {
      token?.attrSet("target", "_blank");
      token?.attrSet("rel", "noreferrer noopener");
    }

    return defaultLinkOpen(tokens, index, options, env, self);
  };
}

/**
 * HTML that came out of this module's renderer, and is therefore safe to inject.
 *
 * A branded string rather than a plain one, so the injection site in
 * `news/[slug]/page.tsx` cannot be handed anything else. Without the brand, the
 * safety of that page rests on everyone who edits it remembering where the
 * string came from; with it, passing a raw value is a type error. This is the
 * part semgrep is right to worry about — not the renderer, which cannot emit
 * unsafe markup, but the possibility of the call being swapped for something
 * that can.
 */
export type SafeHtml = string & { readonly __safeHtml: unique symbol };

/** Markdown in, HTML out. Safe to pass to `dangerouslySetInnerHTML`. */
export function renderMarkdown(markdown: string): SafeHtml {
  return renderer.render(markdown) as SafeHtml;
}

/**
 * Markdown in, plain text out.
 *
 * For meta descriptions and Open Graph tags, where markup would be shown to a
 * reader verbatim by whatever is quoting the page.
 */
export function markdownToText(markdown: string, maxLength = 200): string {
  const text = renderMarkdown(markdown)
    // The output of a renderer with `html: false` contains only the tags that
    // renderer emitted, so stripping them is safe here in a way that stripping
    // tags from arbitrary input never is.
    .replace(/<[^<>]*>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    // `&lt;` and `&gt;` are decoded and then *dropped*, not turned back into
    // angle brackets. Decoding them would resurrect markup an editor typed —
    // `&lt;script&gt;` becoming a real `<script>` in the output — which is
    // harmless in `metadata.description`, where Next escapes it, and is a live
    // injection the first time somebody passes this to JSON-LD or an OG tag
    // they build by hand. A description can never need an angle bracket badly
    // enough to be worth that, so this function guarantees it has none.
    .replace(/&lt;|&gt;|[<>]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");

  if (text.length <= maxLength) return text;

  // Cut at a word boundary; a description ending mid-word looks broken.
  const clipped = text.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped}…`;
}
