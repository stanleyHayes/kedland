import {
  FALLBACK_SOCIALS,
  SCHOOL_ADDRESS,
  SCHOOL_PHONES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  socialProfileUrls,
  type SchoolSocials,
} from "@/lib/site";

/**
 * The school as schema.org sees it — agent_plan §6.5.
 *
 * Rendered on the home and contact pages. The facts all come from `lib/site`,
 * the same source the footer falls back to, so a phone number changed in one
 * place is changed everywhere. Social profiles prefer the CMS settings the
 * caller passes in. No `geo` is emitted: the school has not supplied
 * coordinates, and a guessed pin is worse than none.
 */
export function educationalOrganization(socials: SchoolSocials = FALLBACK_SOCIALS): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: `${SITE_URL}/logo/kedland-logo-512.png`,
    telephone: [...SCHOOL_PHONES],
    address: {
      "@type": "PostalAddress",
      streetAddress: SCHOOL_ADDRESS.streetAddress,
      addressLocality: SCHOOL_ADDRESS.locality,
      addressRegion: SCHOOL_ADDRESS.region,
      addressCountry: SCHOOL_ADDRESS.country,
    },
    sameAs: socialProfileUrls(socials),
  };
}
