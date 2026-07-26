import { cloudinaryUrl } from "@kedland/types";

import { STARTER_MEDIA } from "./api";

/**
 * Resolves the two kinds of post cover used by the public site.
 *
 * Starter posts point at WebP files bundled with the Next application. Images
 * uploaded from the dashboard point at Cloudinary public IDs. Treating both as
 * Cloudinary IDs produced a valid-looking URL for every starter image, but
 * every one of those URLs returned 404.
 */
export function postCoverUrl(mediaId: string, cloudName: string | undefined, width: number): string | null {
  const starter = STARTER_MEDIA[mediaId];
  if (starter) return starter.url;
  if (!cloudName) return null;
  return cloudinaryUrl(cloudName, mediaId, { width });
}
