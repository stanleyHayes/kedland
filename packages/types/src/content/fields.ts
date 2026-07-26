import { z } from "zod";

/**
 * Reusable field primitives for CMS section schemas.
 *
 * Length caps are not arbitrary: the design has fixed places for this text, and
 * a heading that overflows its band is a layout bug an editor should be stopped
 * from shipping, not one a developer discovers in production. Every cap here is
 * generous against the seeded copy from build package §4.
 *
 * Each primitive also carries `.meta({ control })`, which is what lets the
 * dashboard build a real form instead of showing an editor raw JSON. The control
 * is declared here rather than guessed downstream: `shortText(90)` and
 * `bodyText(160)` are both "a string with a maximum", and no amount of
 * introspection can tell you that one wants an input and the other a textarea.
 * Zod carries `meta` through `.min()`, `.max()`, `.optional()`, object shapes and
 * array elements, so declaring it once at the bottom is enough.
 */

/** The control a field wants. Consumed by `toFormSpec`. */
export type FieldControl = "text" | "multiline" | "eyebrow" | "path" | "icon" | "number";

/**
 * Field metadata a section schema may declare.
 *
 * `blank` matters more than it looks. A field with a `regex` cannot be seeded
 * with an empty string: an editor opening a section that has never been filled in
 * was met with "Must be an internal path such as /admissions" against a control
 * they had not touched, which is an error message about a rule rather than an
 * instruction. Any patterned field must name a value that satisfies its own
 * pattern, and `form-spec.spec.ts` fails the build if one does not.
 */
export interface FieldMeta {
  control?: FieldControl;
  group?: "cta" | "image" | "seo";
  blank?: string;
}

/** Short display text — headings, labels, chips. */
export const shortText = (max = 120): z.ZodString =>
  z.string().trim().min(1).max(max).meta({ control: "text" });

/** A paragraph or two of plain prose. No markup — the layout owns the styling. */
export const bodyText = (max = 1200): z.ZodString =>
  z.string().trim().min(1).max(max).meta({ control: "multiline" });

/** An eyebrow label. Rendered uppercase with letter-spacing, so keep it tight. */
export const eyebrow = z.string().trim().min(1).max(48).meta({ control: "eyebrow" });

/**
 * A link target. Internal paths only by default — an editor pointing the "Enrol
 * Now" button at an external site would be a phishing surface on a school's
 * website. External links live in `settings.socials`, which is validated separately.
 */
export const internalPath = z
  .string()
  .trim()
  .regex(/^\/[a-z0-9/-]*$/, "Must be an internal path such as /admissions")
  .meta({ control: "path", blank: "/" });

export const ctaSchema = z
  .strictObject({
    label: shortText(40),
    href: internalPath,
  })
  .meta({ group: "cta" });
export type Cta = z.infer<typeof ctaSchema>;

/**
 * An image reference. `alt` is required and non-empty at the schema level —
 * build package §2.6 requires alt text on every image, and a required field is
 * the only version of that rule which survives a busy Tuesday.
 */
export const imageSchema = z
  .strictObject({
    mediaId: z.string().trim().min(1).meta({ control: "text" }),
    alt: z.string().trim().min(1).max(240).meta({ control: "text" }),
  })
  .meta({ group: "image" });
export type ImageRef = z.infer<typeof imageSchema>;

/** An icon chosen from the app's registered set — not a free-form string. */
export const iconName = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9-]*$/, "Must be a registered icon name in kebab-case")
  // The documented fallback in the shared icon set, so a blank form still renders.
  .meta({ control: "icon", blank: "star" });

/** SEO overrides. Falls back to the site defaults when omitted. */
export const seoSchema = z
  .strictObject({
    title: shortText(70),
    description: z.string().trim().min(1).max(180).meta({ control: "multiline" }),
  })
  .meta({ group: "seo" });
export type Seo = z.infer<typeof seoSchema>;
