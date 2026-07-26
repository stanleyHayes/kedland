import type { UserRole } from "@kedland/types";

/**
 * The dashboard's navigation, as data.
 *
 * Deliberately small. Build package §5.4 is explicit that this is a back office
 * for two or three people with one job — publishing news — widened by the CMS
 * decision (agent_plan §0.2) to page copy and the enquiry inbox. It is not a
 * platform, and the nav should keep reminding us of that.
 *
 * Structure mirrors the oguaaman admin shell: grouped, collapsible, with the
 * active route's group always open.
 */

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
  /** Absent means every signed-in role sees it. */
  readonly roles?: readonly UserRole[];
  /** Exact match only — used for the dashboard root. */
  readonly exact?: boolean;
}

export interface NavGroup {
  readonly title: string;
  readonly icon: string;
  readonly items: readonly NavItem[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: "Dashboard",
    icon: "blocks",
    items: [{ href: "/", label: "Overview", icon: "blocks", exact: true }],
  },
  {
    title: "Publishing",
    icon: "book",
    items: [
      { href: "/posts", label: "Posts", icon: "book" },
      { href: "/categories", label: "Categories", icon: "blocks" },
    ],
  },
  {
    title: "Content",
    icon: "images",
    items: [
      { href: "/content", label: "Pages", icon: "monitor" },
      { href: "/faqs", label: "FAQs", icon: "message" },
      { href: "/instagram", label: "Instagram", icon: "camera" },
      { href: "/media", label: "Media library", icon: "images" },
    ],
  },
  {
    title: "Enquiries",
    icon: "message",
    items: [{ href: "/enquiries", label: "Inbox", icon: "mail" }],
  },
  {
    title: "Account",
    icon: "shield",
    items: [
      { href: "/users", label: "Users", icon: "user", roles: ["admin"] },
      { href: "/audit", label: "Audit log", icon: "shield", roles: ["admin"] },
      { href: "/settings", label: "Settings", icon: "calculator" },
      { href: "/help", label: "Help & guide", icon: "book" },
    ],
  },
];

/**
 * Filters the nav to what a role may reach.
 *
 * This is presentation only — it stops an editor being shown a door they cannot
 * open. The API enforces the same rule with a guard, which is what actually
 * protects the route.
 */
export function visibleGroups(role: UserRole | undefined): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (role !== undefined && item.roles.includes(role))),
  })).filter((group) => group.items.length > 0);
}

/** Whether a nav item should render as the current page. */
export function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact === true) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** The group that owns the current route, including nested detail routes. */
export function activeGroup(
  pathname: string,
  groups: readonly NavGroup[] = NAV_GROUPS,
): NavGroup | undefined {
  return groups.find((group) => group.items.some((item) => isActive(pathname, item)));
}
