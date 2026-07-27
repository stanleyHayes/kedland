import type { MetadataRoute } from "next";

import { getPostSlugs } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

/**
 * The sitemap — agent_plan §6.5.
 *
 * Static routes are enumerated by hand, not globbed: the app directory also
 * contains `/preview` and `/api/revalidate`, and a route list derived from the
 * filesystem would advertise the one surface that must stay out of every
 * index. Post entries come from the API; `getPostSlugs` degrades to an empty
 * list when the API is unreachable at build time, the same contract the news
 * pages already rely on, so an API outage costs the sitemap its post entries
 * rather than the build.
 */
const STATIC_PATHS = [
  "/",
  "/about",
  "/about/our-story",
  "/about/principal",
  "/about/facilities",
  "/about/mission-vision-values",
  "/academics",
  "/academics/early-years",
  "/academics/primary",
  "/admissions",
  "/student-life",
  "/faqs",
  "/news",
  "/gallery",
  "/contact",
  "/privacy",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

  const slugs = await getPostSlugs();
  const postRoutes: MetadataRoute.Sitemap = slugs.map(({ slug, updatedAt }) => ({
    url: `${SITE_URL}/news/${slug}`,
    lastModified: updatedAt,
  }));

  return [...staticRoutes, ...postRoutes];
}
