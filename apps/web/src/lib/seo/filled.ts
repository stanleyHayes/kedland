/**
 * An optional CMS text field, or `null` when the editor left it blank.
 *
 * `??` alone is not enough, and the difference is not academic. A field cleared
 * in the dashboard arrives as an empty string rather than null — the form
 * submits every input it has, blank ones included — so `post.seoTitle ?? title`
 * evaluates to `""` and the page publishes as
 * " | Kedland International School". An editor who tidies up an SEO field they
 * did not want would take the headline off a live page and see nothing in the
 * dashboard to explain it.
 *
 * Whitespace counts as blank for the same reason: a stray space is not a
 * description, and it would defeat the fallback just as thoroughly.
 */
export function filled(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  // An `if`, not a ternary: `prefer-nullish-coalescing` reads the ternary as a
  // `??` waiting to happen and would rewrite it to `trimmed ?? null`, which
  // keeps the empty string and reinstates the bug this function exists to fix.
  if (!trimmed) return null;
  return trimmed;
}
