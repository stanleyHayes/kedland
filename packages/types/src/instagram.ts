import { z } from "zod";

import type { PublicMedia } from "./media";

export const instagramTileInputSchema = z.strictObject({
  mediaId: z.string().trim().min(1).max(100),
  caption: z.string().trim().min(1).max(500),
  href: z.url(),
  order: z.number().int().nonnegative(),
  published: z.boolean(),
});

export const instagramTileUpdateSchema = instagramTileInputSchema.partial();

export type InstagramTileInput = z.infer<typeof instagramTileInputSchema>;
export type InstagramTileUpdate = z.infer<typeof instagramTileUpdateSchema>;

export interface InstagramTile extends InstagramTileInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** A published gallery tile with its safe, renderable media attached. */
export interface PublicGalleryTile {
  id: string;
  caption: string;
  href: string;
  order: number;
  media: PublicMedia;
}
