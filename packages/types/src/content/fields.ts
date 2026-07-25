import { z } from "zod";

/**
 * Reusable field primitives for CMS section schemas.
 *
 * Length caps are not arbitrary: the design has fixed places for this text, and
 * a heading that overflows its band is a layout bug an editor should be stopped
 * from shipping, not one a developer discovers in production. Every cap here is
 * generous against the seeded copy from build package §4.
 */

/** Short display text — headings, labels, chips. */
export const shortText = (max = 120): z.ZodString => z.string().trim().min(1).max(max);

/** A paragraph or two of plain prose. No markup — the layout owns the styling. */
export const bodyText = (max = 1200): z.ZodString => z.string().trim().min(1).max(max);

/** An eyebrow label. Rendered uppercase with letter-spacing, so keep it tight. */
export const eyebrow = z.string().trim().min(1).max(48);

/**
 * A link target. Internal paths only by default — an editor pointing the "Enrol
 * Now" button at an external site would be a phishing surface on a school's
 * website. External links live in `settings.socials`, which is validated separately.
 */
export const internalPath = z
  .string()
  .trim()
  .regex(/^\/[a-z0-9/-]*$/, "Must be an internal path such as /admissions");

export const ctaSchema = z.strictObject({
  label: shortText(40),
  href: internalPath,
});
export type Cta = z.infer<typeof ctaSchema>;

/**
 * An image reference. `alt` is required and non-empty at the schema level —
 * build package §2.6 requires alt text on every image, and a required field is
 * the only version of that rule which survives a busy Tuesday.
 */
export const imageSchema = z.strictObject({
  mediaId: z.string().trim().min(1),
  alt: z.string().trim().min(1).max(240),
});
export type ImageRef = z.infer<typeof imageSchema>;

/** An icon chosen from the app's registered set — not a free-form string. */
export const iconName = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9-]*$/, "Must be a registered icon name in kebab-case");

/** SEO overrides. Falls back to the site defaults when omitted. */
export const seoSchema = z.strictObject({
  title: shortText(70),
  description: z.string().trim().min(1).max(180),
});
export type Seo = z.infer<typeof seoSchema>;
