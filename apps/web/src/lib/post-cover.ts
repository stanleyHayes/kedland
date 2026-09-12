import { cloudinaryUrl, RETIRED_MEDIA_IDS } from "@kedland/types";

/** Resolves uploaded covers; retired launch media must never reappear. */
export function postCoverUrl(mediaId: string, cloudName: string | undefined, width: number): string | null {
  if ((RETIRED_MEDIA_IDS as readonly string[]).includes(mediaId)) return null;
  if (!cloudName) return null;
  return cloudinaryUrl(cloudName, mediaId, { width });
}
