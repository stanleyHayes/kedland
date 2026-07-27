import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Crawl rules — agent_plan §6.5.
 *
 * Everything is welcome except `/preview`, the dashboard's live-preview
 * surface (also noindexed by its `X-Robots-Tag` header — the two answers must
 * agree), and `/api/`, which is the revalidation webhook and has nothing to
 * index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/preview", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
