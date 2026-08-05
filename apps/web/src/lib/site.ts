/**
 * The public site's single source of truth for who and where it is.
 *
 * Everything that needs an absolute URL — canonicals, Open Graph, the sitemap,
 * robots, JSON-LD — reads from here. Production is `https://kedland.edu.gh`
 * via `NEXT_PUBLIC_SITE_URL` (agent_plan §6.5, §9). The school facts below are
 * the real ones from the flyers; they move to the CMS `settings` document in
 * Phase 3, and until then this is the one place to change them.
 */

/** The development origin, used whenever the environment does not say otherwise. */
const LOCAL_SITE_URL = "http://localhost:3000";

/**
 * The site's public origin with no trailing slash.
 *
 * Stripping the slash matters more than it looks: every consumer builds a URL
 * by appending a path, and `https://kedland.edu.gh/` + `/news` is a sitemap
 * full of double slashes that Google indexes as different pages. An unset or
 * blank value falls back to localhost rather than failing the build — a
 * missing variable is a misconfiguration to fix in Vercel, not a reason the
 * site cannot render.
 */
export function resolveSiteUrl(value: string | undefined): string {
  const candidate = value?.trim() ?? "";
  let url = candidate.length > 0 ? candidate : LOCAL_SITE_URL;
  // A loop rather than `/+` — one anchored pass, no backtracking to flag.
  while (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
}

export const SITE_URL = resolveSiteUrl(process.env["NEXT_PUBLIC_SITE_URL"]);

export const SITE_NAME = "Kedland International School";

/** The school's strapline — build package §4.1. */
export const SITE_TAGLINE = "The future begins here";

export const SITE_DESCRIPTION =
  "A warm, nurturing British-curriculum school for Daycare through Primary 3 in Community 19, Lashibi-Tema. Where the future begins. Enrol your little Star today.";

export const SCHOOL_INSTAGRAM = "https://www.instagram.com/kedlandintlschool";

export const SCHOOL_FACEBOOK = "https://www.facebook.com/KedlandInternationalSchool";

export const SCHOOL_TIKTOK = "https://www.tiktok.com/@kedland.internatio";

/**
 * Fallback socials when the CMS settings document is unreachable.
 *
 * The live values come from `GET /settings/public`. These exist so the footer,
 * quick links and JSON-LD still name the school's real profiles during a
 * cold start or an API outage — the same pattern as the starter gallery.
 */
export interface SchoolSocials {
  instagram: string;
  facebook: string;
  tiktok: string;
}

export const FALLBACK_SOCIALS: SchoolSocials = {
  instagram: SCHOOL_INSTAGRAM,
  facebook: SCHOOL_FACEBOOK,
  tiktok: SCHOOL_TIKTOK,
};

/** Non-empty profile URLs, in a stable order, for `sameAs` and link rows. */
export function socialProfileUrls(socials: SchoolSocials): string[] {
  return [socials.instagram, socials.facebook, socials.tiktok].filter((url) => url.trim().length > 0);
}

export const SCHOOL_PHONES = ["+233 257 130 333", "+233 202 472 472", "+233 244 958 103"] as const;

/**
 * The school's address, in both shapes its consumers need: display lines for
 * the footer's contact card, and the structured fields a `PostalAddress`
 * carries in JSON-LD.
 */
export const SCHOOL_ADDRESS = {
  lines: ["Community 19 Annex, Lashibi-Tema", "near Deon Recreational Centre", "Greater Accra, Ghana"],
  streetAddress: "Community 19 Annex, Lashibi-Tema, near Deon Recreational Centre",
  locality: "Tema",
  region: "Greater Accra",
  country: "GH",
} as const;
