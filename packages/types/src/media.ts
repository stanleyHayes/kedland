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
}

export const mediaRegisterSchema = z.strictObject({
  publicId: z.string().trim().min(1).max(300),
  url: z.url(),
  alt: z.string().trim().min(1).max(240),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().trim().min(1).max(20),
  bytes: z.number().int().nonnegative(),
});
export type MediaRegister = z.infer<typeof mediaRegisterSchema>;

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
