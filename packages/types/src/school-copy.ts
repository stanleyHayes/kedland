/** School-approved terminology, applied to copy rather than identifiers or URLs. */
export function schoolCopy(text: string): string {
  return text
    .replace(/\bMary\b/g, "the Principal")
    .replace(/\bthe the Principal\b/gi, "the Principal")
    .replace(/\bPrimary\s+1\s*(?:[–—-]|to)\s*3\b/gi, "Primary")
    .replace(/\bPrimary\s+3\b/gi, "Primary")
    .replace(/\bCambridge Primary for Primary\b/g, "Cambridge Primary")
    .replace(/\bthe Principal, Principal\b/g, "the Principal");
}

const IDENTIFIERS = new Set([
  "mediaId",
  "src",
  "url",
  "href",
  "slug",
  "icon",
  "id",
  "key",
  "type",
  "author",
  "authorName",
]);

/** Preserves media IDs, routes and the structure of existing CMS documents. */
export function normalizeSchoolContent(value: unknown, key = ""): unknown {
  if (IDENTIFIERS.has(key)) return value;
  if (typeof value === "string") return schoolCopy(value);
  if (Array.isArray(value)) return value.map((item) => normalizeSchoolContent(item));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([name, item]) => [name, normalizeSchoolContent(item, name)]),
  );
}
