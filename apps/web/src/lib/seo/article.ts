import type { Post } from "@kedland/types";

import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * `Article` for one post — agent_plan §6.5.
 *
 * The school, not a staff member, is the named author: posts are published
 * under the school's name and `authorId` is a dashboard account, not a public
 * byline. The cover becomes the article image when the post has one; a post
 * without a cover simply omits the field rather than inventing an image.
 */
export function articleJsonLd(post: Post, coverUrl: string | null): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: `${SITE_URL}/news/${post.slug}`,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo/kedland-logo-512.png`,
      },
    },
    ...(coverUrl ? { image: [coverUrl] } : {}),
  };
}
