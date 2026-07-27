import { SITE_URL } from "@/lib/site";

/**
 * `BreadcrumbList` for the nested routes — agent_plan §6.5.
 *
 * Labels are an explicit table rather than a derived title-case guess: slugs
 * like `mission-vision-values` do not survive naive humanising ("Mission
 * Vision Values" drops the Oxford comma and the ampersand the page itself
 * uses), and a label that disagrees with the visible page title is worse than
 * no breadcrumb at all.
 */
const SEGMENT_LABELS: Record<string, string> = {
  about: "About",
  "our-story": "Our Story",
  principal: "Principal's Welcome",
  facilities: "Facilities",
  "mission-vision-values": "Mission, Vision & Values",
  academics: "Academics",
  "early-years": "Early Years",
  primary: "Primary",
  admissions: "Admissions",
  "student-life": "Student Life",
  gallery: "Gallery",
  news: "News",
  faqs: "FAQs",
  contact: "Contact",
  privacy: "Privacy Notice",
};

export interface BreadcrumbItem {
  label: string;
  path: string;
}

/**
 * The trail for one pathname, always starting at Home.
 *
 * `leafLabel` names the final segment when the table cannot — a post slug
 * carries the post's title instead. Any other unknown segment falls back to a
 * humanised slug, which is at least honest about what it is.
 */
export function breadcrumbsFor(pathname: string, leafLabel?: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const trail: BreadcrumbItem[] = [{ label: "Home", path: "/" }];

  segments.forEach((segment, index) => {
    const isLeaf = index === segments.length - 1;
    const label =
      (isLeaf ? leafLabel : undefined) ??
      SEGMENT_LABELS[segment] ??
      segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    trail.push({ label, path: `/${segments.slice(0, index + 1).join("/")}` });
  });

  return trail;
}

/** The JSON-LD form of a trail. Items are absolute — crawlers resolve nothing. */
export function breadcrumbList(trail: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
