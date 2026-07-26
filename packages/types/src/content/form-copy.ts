/**
 * What each field is called, in the words of the person editing it.
 *
 * The dashboard is used by the school office, not by whoever wrote the schema.
 * "standfirst" is a newspaper term, "mediaId" is an implementation detail, and
 * `emptyStateHeading` is three words jammed together — none of them belong in
 * front of a secretary updating the term dates.
 *
 * Keyed by the *last* segment of a field's path, so `heading` reads the same
 * everywhere it appears and there is one place to improve the wording. Where a
 * name genuinely means different things in different sections, the section-scoped
 * map below wins — see `mission` and `motto`.
 *
 * `form-spec.spec.ts` walks all 24 section schemas and fails if any field would
 * fall through to the humanised fallback. That is deliberate: the fallback keeps
 * a new field from crashing the form, and the test keeps it from shipping.
 */

export interface FieldCopy {
  label: string;
  /** One short line under the control. Omitted when the label says it all. */
  help?: string;
}

/** Labels by field name, good in every section that uses the name. */
const BY_NAME: Record<string, FieldCopy> = {
  /* ── Headings and prose ─────────────────────────────────────────────── */
  eyebrow: {
    label: "Small label above the heading",
    help: "A few words, shown in capitals. Sets the scene — “Our approach”, “Why Kedland”.",
  },
  heading: { label: "Heading" },
  subheading: { label: "Opening paragraph", help: "The sentence or two directly under the heading." },
  standfirst: { label: "Introduction", help: "One short paragraph introducing the page." },
  intro: { label: "Introduction" },
  body: { label: "Main text" },
  title: { label: "Title" },
  name: { label: "Name" },
  label: { label: "Label" },
  role: { label: "Job title" },
  blurb: { label: "Short description", help: "One or two lines." },
  note: { label: "Small print", help: "Shown quietly beneath, for a caveat or a reminder." },
  quote: { label: "Quotation", help: "In their own words. Quotation marks are added for you." },
  signOff: { label: "Sign-off", help: "How the letter ends — “Warm regards”." },
  handle: {
    label: "Instagram handle",
    help: "Including the @ — for example @kedlandintlschool.",
  },
  lastUpdated: {
    label: "Last reviewed",
    help: "Shown to visitors so they know how current this is. Free text, such as “January 2026”.",
  },
  motto: { label: "Motto" },
  mission: { label: "Mission statement" },
  vision: { label: "Vision statement" },
  assessment: { label: "How progress is assessed" },
  buttonLabel: { label: "Button text", help: "What the download button says." },
  number: { label: "Order", help: "Which position this takes in the sequence." },
  chips: { label: "Activities" },
  trustChips: {
    label: "Reassurance badges",
    help: "The four short claims under the hero — “British curriculum”, “Small classes”.",
  },

  /* ── Sub-headings that name their own block ──────────────────────────── */
  missionHeading: { label: "Mission card title" },
  visionHeading: { label: "Vision card title" },
  mottoHeading: { label: "Motto card title" },
  assessmentHeading: { label: "Assessment heading" },
  formHeading: { label: "Heading above the enquiry form" },
  mapHeading: { label: "Heading above the map" },
  closingHeading: { label: "Closing heading", help: "The prompt at the foot of the page." },
  emptyStateHeading: {
    label: "Heading when there is no news yet",
    help: "Visitors see this instead of an empty list.",
  },
  emptyStateBody: { label: "Message when there is no news yet" },

  /* ── Links and buttons ──────────────────────────────────────────────── */
  cta: { label: "Button" },
  link: { label: "Link" },
  primaryCta: { label: "Main button" },
  secondaryCta: { label: "Second button" },
  closingCta: { label: "Closing button" },
  href: {
    label: "Goes to",
    help: "A page on this site, starting with a slash — /admissions, /contact.",
  },

  /* ── Media ──────────────────────────────────────────────────────────── */
  image: { label: "Image" },
  portrait: { label: "Photograph" },
  mediaId: { label: "Image", help: "Choose from the media library." },
  alt: {
    label: "Describe the image",
    help: "For visitors who cannot see it, and read aloud by screen readers. Say what is happening.",
  },
  icon: { label: "Icon" },

  /* ── Repeating groups ───────────────────────────────────────────────── */
  cards: { label: "Cards" },
  items: { label: "Items" },
  levels: { label: "Year groups" },
  tiles: { label: "Letter tiles" },
  letter: { label: "Letter", help: "One capital letter." },
  areas: { label: "Areas of learning" },
  subjects: { label: "Subjects" },
  steps: { label: "Steps" },
  moments: { label: "Moments in the day" },
};

/**
 * Where a name means something different in one section.
 *
 * Keyed `section-type:field-path`. Only for genuine collisions — adding an entry
 * here that merely reads slightly better is how 54 labels become 154.
 */
const BY_SECTION: Record<string, FieldCopy> = {
  "values-tiles:heading": {
    label: "Heading",
    help: "The KEDLAND letters below spell the school's name — there are exactly seven, and the section does not work with any other number.",
  },
  "eyfs-areas:intro": {
    label: "Introduction",
    help: "Explains the seven areas of learning. Also what search engines and screen readers read, so keep it in plain sentences.",
  },
  "legal:body": {
    label: "Policy text",
    help: "The full notice. Long is fine here.",
  },
  "letter:body": { label: "The letter", help: "The Principal's message, in full." },
  "instagram:heading": { label: "Heading" },
  "download-block:body": { label: "Text above the button" },
  "mission-vision:motto": { label: "Motto", help: "The school's motto, in a few words." },
  "mission-vision:mottoBody": { label: "What the motto means" },
};

/** `emptyStateHeading` → `Empty state heading`. The last-resort label. */
export function humaniseFieldName(name: string): string {
  const spaced = name
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll(/[-_]+/g, " ")
    .trim()
    .toLowerCase();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The copy for one field.
 *
 * `path` is dotted, with `[]` marking a repeated group — `cards[].title`. The
 * lookup uses the last segment, so a field inside a repeating group is labelled
 * the same as it would be outside one.
 */
export function fieldCopy(sectionType: string, path: string): FieldCopy & { fromFallback: boolean } {
  const scoped = BY_SECTION[`${sectionType}:${path}`];
  if (scoped) return { ...scoped, fromFallback: false };

  const name = path.split(".").pop()?.replace("[]", "") ?? path;
  const byName = BY_NAME[name];
  if (byName) return { ...byName, fromFallback: false };

  return { label: humaniseFieldName(name), fromFallback: true };
}
