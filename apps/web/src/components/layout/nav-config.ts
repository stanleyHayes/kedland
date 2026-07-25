/**
 * The public site's navigation, as data.
 *
 * Straight from build package §3: Home · About · Academics · Admissions ·
 * Student Life · News · Contact, with a bright pill CTA to /admissions. About
 * and Academics expand; the package is explicit that a mega-menu is not needed.
 */

export interface NavLink {
  readonly href: string;
  readonly label: string;
  /** Exact match only — otherwise "/" would light up on every page. */
  readonly exact?: boolean;
  /** Turns the item into a disclosure with a chevron. */
  readonly children?: readonly NavChild[];
}

export interface NavChild {
  readonly href: string;
  readonly label: string;
  /** One line shown under the label in the dropdown. */
  readonly description: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/", label: "Home", exact: true },
  {
    href: "/about",
    label: "About",
    children: [
      { href: "/about/our-story", label: "Our Story", description: "How Kedland began" },
      {
        href: "/about/mission-vision-values",
        label: "Mission, Vision & Values",
        description: "Our name is our promise",
      },
      { href: "/about/principal", label: "Principal's Welcome", description: "A message from Mary" },
      { href: "/about/facilities", label: "Facilities", description: "A campus built around your child" },
    ],
  },
  {
    href: "/academics",
    label: "Academics",
    children: [
      {
        href: "/academics/early-years",
        label: "Early Years",
        description: "The British EYFS and its seven areas",
      },
      { href: "/academics/primary", label: "Primary", description: "Cambridge Primary, years 1–3" },
    ],
  },
  { href: "/admissions", label: "Admissions" },
  { href: "/student-life", label: "Student Life" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
];

/** The header's call to action. */
export const NAV_CTA = { href: "/admissions", label: "Enrol Now" } as const;

/**
 * The grid-dots panel from the reference navbar.
 *
 * The shortcuts a prospective parent actually wants, rather than a second copy
 * of the nav. The admission form is a download, not a page — build package §5.2.
 */
export interface QuickLink {
  readonly href: string;
  readonly label: string;
  readonly description: string;
  /** Opens in a new tab and gets rel="noreferrer". */
  readonly external?: boolean;
  /** Renders the download affordance. */
  readonly download?: boolean;
}

export const QUICK_LINKS: readonly QuickLink[] = [
  { href: "/contact", label: "Book a tour", description: "Come and see the school" },
  { href: "/contact", label: "Contact us", description: "Call, WhatsApp or send a message" },
  { href: "/faqs", label: "FAQs", description: "Answers to common questions" },
  {
    href: "/assets/forms/kedland-admission-form.pdf",
    label: "Admission form",
    description: "Download the PDF",
    download: true,
  },
  {
    href: "https://www.instagram.com/kedlandintlschool",
    label: "Instagram",
    description: "@kedlandintlschool",
    external: true,
  },
];

/** Whether a nav item should render as the current page. */
export function isActiveLink(pathname: string, link: Pick<NavLink, "href" | "exact">): boolean {
  if (link.exact === true) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}
