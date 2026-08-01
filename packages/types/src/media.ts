import { z } from "zod";

/**
 * Media uploads (Cloudinary).
 *
 * Uploads go **from the browser straight to Cloudinary**, not through our API.
 * The API's only job is to sign the request: it returns a signature over the
 * upload parameters, and the browser posts the file to Cloudinary with it.
 *
 * Two reasons that is the right shape here. Render's instances have ephemeral
 * disks and a request-body ceiling, so proxying a parent-evening photo album
 * through them is both wasteful and fragile. And the API secret never leaves
 * the server — the browser gets a signature that is valid for one upload, into
 * one folder, for a few minutes.
 */

/** What the browser may ask to upload. */
/**
 * The largest file the dashboard will send to Cloudinary.
 *
 * Not a Cloudinary limit — their free tier allows far more — but the point at
 * which an upload from the school office stops being reasonable. A modern phone
 * photo is 3–8 MB; a 25 MB file is almost always a scan or an export nobody
 * meant to attach, and sending it over a Ghanaian mobile connection wastes
 * minutes before failing on something else.
 *
 * Enforced in the browser, where it can be said before the bytes move.
 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** For messages: `26214400` → `25 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${String(Math.round(bytes / 1024))} KB`;

  const megabytes = bytes / (1024 * 1024);
  // One decimal below 10 MB, none above: "1.4 MB" is useful, "13.7 MB" is noise.
  return `${megabytes < 10 ? megabytes.toFixed(1) : String(Math.round(megabytes))} MB`;
}

/**
 * Applied by Cloudinary *as it receives* the file, before anything is stored.
 *
 * The school will upload straight from a phone or a camera, and a 6000px
 * original is stored, backed up and counted against quota forever while no
 * layout on the site is wider than about 1600 CSS pixels. Capping on the way in
 * means the oversized original never exists rather than being politely ignored.
 *
 *  - `c_limit` only ever shrinks. An image already smaller than the cap is
 *    passed through untouched rather than being blown up and softened.
 *  - `2400` leaves headroom for a 2x retina hero without keeping a print master.
 *  - `q_auto:good` re-encodes at Cloudinary's judgement of "good", which is
 *    where most of the saving on a phone photo actually comes from.
 *
 * Delivery-time `f_auto,q_auto` still applies on top; this is about what gets
 * *stored*, which is what the ceiling and the bandwidth bill are measured on.
 */
export const UPLOAD_TRANSFORMATION = "c_limit,w_2400,h_2400,q_auto:good";

export const uploadRequestSchema = z.strictObject({
  /**
   * A folder *within* the school's configured root. Constrained so a signature
   * request cannot be used to write anywhere else in a shared Cloudinary
   * account — the API prefixes its own root and validates this shape.
   */
  folder: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/, "Use lower-case words separated by dashes or slashes")
    .optional(),
});
export type UploadRequest = z.infer<typeof uploadRequestSchema>;

/**
 * The signed parameters, handed to the browser.
 *
 * Everything here is sent to Cloudinary verbatim. `signature` covers exactly
 * the fields Cloudinary will hash back, so adding a parameter to the upload
 * without adding it here invalidates the signature — which is the intended
 * failure, not a bug to work around.
 */
export interface UploadSignature {
  /** Where to POST. Includes the cloud name, so the browser needs nothing else. */
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  /**
   * The incoming transformation Cloudinary applies before storing.
   *
   * Sent to Cloudinary verbatim and covered by the signature, so the browser can
   * neither omit it nor weaken it — the server decides what gets stored.
   */
  transformation: string;
  /** The ceiling the dashboard enforces before it starts uploading. */
  maxBytes: number;
  signature: string;
  /** Seconds until Cloudinary will refuse this signature. */
  expiresInSeconds: number;
}

/** What Cloudinary returns, narrowed to the parts we keep. */
export const uploadResultSchema = z.object({
  public_id: z.string(),
  secure_url: z.url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string(),
  bytes: z.number().int().nonnegative(),
});
export type UploadResult = z.infer<typeof uploadResultSchema>;

/**
 * A stored media item.
 *
 * `alt` is required rather than optional and lives with the image, not with
 * the place it is used: the same photo reused on three pages should not need
 * its alt text written three times, and an image with no alt text is one a
 * screen-reader user simply cannot see.
 */
export interface MediaItem {
  id: string;
  publicId: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  createdAt: string;
  uploadedBy: string | null;
  depictsPupils: boolean;
  consentOnFile: boolean;
  consentRef: string | null;
}

/**
 * The deliberately small shape exposed to the public website.
 *
 * Upload provenance and consent references stay in the dashboard. The public
 * API only returns an image after the media service has applied the pupil
 * safeguarding gate.
 */
export interface PublicMedia {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

export const mediaRegisterSchema = z.strictObject({
  publicId: z.string().trim().min(1).max(300),
  url: z.url(),
  alt: z.string().trim().min(1).max(240),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().trim().min(1).max(20),
  bytes: z.number().int().nonnegative(),
  depictsPupils: z.boolean().optional(),
  consentOnFile: z.boolean().optional(),
  consentRef: z.string().trim().max(200).nullable().optional(),
});
export type MediaRegister = z.infer<typeof mediaRegisterSchema>;

export const mediaUpdateSchema = z
  .strictObject({
    alt: mediaRegisterSchema.shape.alt.optional(),
    depictsPupils: z.boolean().optional(),
    consentOnFile: z.boolean().optional(),
    consentRef: z.string().trim().max(200).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.depictsPupils === true && value.consentOnFile === true && !value.consentRef) {
      context.addIssue({
        code: "custom",
        path: ["consentRef"],
        message: "Add the written consent reference",
      });
    }
  });
export type MediaUpdate = z.infer<typeof mediaUpdateSchema>;

/**
 * Builds a Cloudinary delivery URL with transformations.
 *
 * `f_auto,q_auto` lets Cloudinary pick AVIF or WebP per browser, which is what
 * keeps imagery under the build package's 250 KB ceiling without anyone having
 * to remember to export three formats.
 */
export function cloudinaryUrl(
  cloudName: string,
  publicId: string,
  options: { width?: number; height?: number } = {},
): string {
  const transforms = ["f_auto", "q_auto"];
  if (options.width) transforms.push(`w_${String(options.width)}`);
  if (options.height) transforms.push(`h_${String(options.height)}`);
  transforms.push("c_limit");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(",")}/${publicId}`;
}
