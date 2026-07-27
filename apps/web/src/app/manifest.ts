import { COLOURS } from "@kedland/ui";

import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/**
 * The web app manifest, served as `/manifest.webmanifest`.
 *
 * Colours come from the brand tokens rather than pasted hex values — the same
 * rule the rest of the repo follows — so a palette change reaches the
 * installed-app chrome too. The icons are the larger favicon PNGs already in
 * `public/`; the smaller sizes stay where browsers look for them.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Kedland",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: COLOURS.cream,
    theme_color: COLOURS.navy,
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
