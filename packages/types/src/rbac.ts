import { z } from "zod";

/**
 * Roles and permissions.
 *
 * The shape of the system, in one place, because it is enforced in four:
 * the API's guard, the dashboard's route checks, the dashboard's rendering
 * (a button nobody may press is not shown at all), and the seed that creates
 * the first roles.
 *
 * Two decisions worth stating up front.
 *
 * **A user's permissions are their own.** A role supplies a starting set at
 * creation or invitation, and is then only a label plus a template. Editing a
 * user's permissions afterwards does not touch the role, and editing a role
 * does not silently re-write every user who was created from it. That is what
 * lets an administrator give one editor the ability to delete a post without
 * granting it to every editor — and it is why the user document stores a
 * resolved list rather than pointing at the role's.
 *
 * **Writing implies reading.** `posts:create` without `posts:read` is not a
 * meaningful state: the holder could create a post and then not see it, and
 * every surface would have to decide what to do about that. Rather than
 * validate against it and reject, the model *completes* it — see
 * `withImpliedReads`.
 */

/**
 * The things permissions apply to.
 *
 * Named for what an operator thinks they are working on, not for the API's
 * module layout — `content` is "the pages", and an editor asked to manage the
 * pages should not have to know it is backed by a section registry.
 */
export const RESOURCES = [
  "posts",
  "media",
  "gallery",
  "content",
  "faqs",
  "enquiries",
  "users",
  "roles",
  "audit",
  "settings",
] as const;

export const resourceSchema = z.enum(RESOURCES);
export type Resource = z.infer<typeof resourceSchema>;

export const ACTIONS = ["read", "create", "update", "delete"] as const;

export const actionSchema = z.enum(ACTIONS);
export type Action = z.infer<typeof actionSchema>;

/** `posts:create`. A string, so a permission is comparable and storable as-is. */
export type Permission = `${Resource}:${Action}`;

/** Every permission the system can express. */
export const ALL_PERMISSIONS: readonly Permission[] = RESOURCES.flatMap((resource) =>
  ACTIONS.map((action): Permission => `${resource}:${action}`),
);

const PERMISSION_SET = new Set<string>(ALL_PERMISSIONS);

export const permissionSchema = z.string().refine((value): value is Permission => PERMISSION_SET.has(value), {
  message: "Not a known permission",
});

/** A permission list, de-duplicated and completed. See `withImpliedReads`. */
export const permissionsSchema = z
  .array(permissionSchema)
  .max(ALL_PERMISSIONS.length)
  .transform((permissions) => withImpliedReads(permissions));

/** Splits `posts:create` without trusting the caller to have done it. */
export function parsePermission(permission: string): { resource: Resource; action: Action } | null {
  const parts = permission.split(":");
  // Exactly two segments. Destructuring the first two would quietly accept
  // "posts:read:extra" as "posts:read", which is how a malformed permission
  // ends up stored and then compared against by string equality forever.
  if (parts.length !== 2) return null;

  const [resource, action] = parts;

  const parsedResource = resourceSchema.safeParse(resource);
  const parsedAction = actionSchema.safeParse(action);
  if (!parsedResource.success || !parsedAction.success) return null;

  return { resource: parsedResource.data, action: parsedAction.data };
}

/**
 * Adds the read that every write implies.
 *
 * Granting `posts:delete` grants `posts:read` with it. The alternative —
 * rejecting the combination as invalid — pushes the problem onto whoever is
 * ticking boxes in the dashboard, and produces an error message about a rule
 * they cannot see the point of. Completing it silently is right because there
 * is exactly one sensible completion.
 *
 * Sorted, so two equivalent sets are equal as arrays and a stored list does not
 * churn in the audit trail because the checkboxes were ticked in a new order.
 */
export function withImpliedReads(permissions: readonly string[]): Permission[] {
  const granted = new Set<Permission>();

  for (const permission of permissions) {
    const parsed = parsePermission(permission);
    if (!parsed) continue;

    granted.add(`${parsed.resource}:${parsed.action}`);
    if (parsed.action !== "read") granted.add(`${parsed.resource}:read`);
  }

  return [...granted].sort((a, b) => a.localeCompare(b));
}

/**
 * Whether a permission list already includes every implied read.
 *
 * Not used to reject input — `withImpliedReads` handles that — but a stored
 * list that fails this has been written by something that bypassed the model,
 * which is worth a test and worth knowing.
 */
export function hasImpliedReads(permissions: readonly string[]): boolean {
  const held = new Set(permissions);

  return permissions.every((permission) => {
    const parsed = parsePermission(permission);
    if (!parsed || parsed.action === "read") return true;

    return held.has(`${parsed.resource}:read`);
  });
}

/**
 * Whether these permissions allow an action.
 *
 * The single question every guard, route and button asks. Deliberately takes a
 * plain list rather than a user, so the dashboard can ask it of a role being
 * edited, of a draft set of checkboxes, and of the signed-in operator with the
 * same function.
 */
export function can(permissions: readonly string[] | undefined, resource: Resource, action: Action): boolean {
  return permissions?.includes(`${resource}:${action}`) ?? false;
}

/** Whether anything on this resource is permitted — i.e. show the route at all. */
export function canSee(permissions: readonly string[] | undefined, resource: Resource): boolean {
  return can(permissions, resource, "read");
}

/* ── Roles ──────────────────────────────────────────────────────────────── */

/** Lower case, dashes. The stable identifier; the name is what people read. */
export const roleSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lower-case words separated by single dashes");

export const roleInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(200).optional(),
  permissions: permissionsSchema,
});
export type RoleInput = z.infer<typeof roleInputSchema>;

export const roleUpdateSchema = roleInputSchema.partial();
export type RoleUpdate = z.infer<typeof roleUpdateSchema>;

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: Permission[];
  /**
   * A role the system depends on and will not let anyone delete.
   *
   * `administrator` is the obvious one: a school that deletes it has locked
   * itself out of its own dashboard with no way back in short of a database
   * shell.
   */
  isSystem: boolean;
  /** How many users were created from it. Shown before an edit or a delete. */
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

/* ── The roles the school starts with ───────────────────────────────────── */

/** Everything, including the ability to manage roles and users. */
const ADMINISTRATOR: readonly Permission[] = ALL_PERMISSIONS;

/**
 * The school's day-to-day job: publish news, manage the pages and the gallery,
 * answer parents. No users, no roles, no settings — and no deleting, which is
 * the one action that cannot be undone from the dashboard.
 */
const EDITOR: readonly Permission[] = [
  "posts:read",
  "posts:create",
  "posts:update",
  "media:read",
  "media:create",
  "media:update",
  "gallery:read",
  "gallery:create",
  "gallery:update",
  "content:read",
  "content:update",
  "faqs:read",
  "faqs:create",
  "faqs:update",
  "enquiries:read",
  "enquiries:update",
];

/**
 * A parent-facing organisation or committee given a window in, and nothing
 * more: they can read what is published and see enquiries they are handling.
 * Deliberately the smallest role the system offers, because "read only" is the
 * safest thing to hand to somebody outside the school office.
 */
const ORGANISATION: readonly Permission[] = ["posts:read", "gallery:read", "media:read", "content:read"];

export interface SystemRoleSeed {
  slug: string;
  name: string;
  description: string;
  permissions: readonly Permission[];
}

export const SYSTEM_ROLES: readonly SystemRoleSeed[] = [
  {
    slug: "administrator",
    name: "Administrator",
    description: "Full access, including staff accounts, roles and settings.",
    permissions: ADMINISTRATOR,
  },
  {
    slug: "editor",
    name: "Editor",
    description: "Publishes news, manages page content and the gallery, answers enquiries.",
    permissions: EDITOR,
  },
  {
    slug: "organisation",
    name: "Organisation",
    description: "Read-only access to published content. For partners and committees.",
    permissions: ORGANISATION,
  },
];

/* ── Staff accounts ─────────────────────────────────────────────────────── */

/**
 * A staff account as the dashboard sees it.
 *
 * `roleSlug` and `permissions` are both here and they are not redundant: the
 * slug says where the account started, the list says what it may do now. A
 * dashboard that showed only the role would be lying to anyone whose
 * permissions had since been adjusted, which the model explicitly allows.
 */
export interface StaffAccount {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roleSlug: string;
  permissions: Permission[];
  status: "active" | "suspended";
  /** Invited but has not yet chosen a password. */
  isInvited: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/**
 * Whether an account's permissions still match the role it came from.
 *
 * Used to label an account "Editor (adjusted)" rather than plain "Editor".
 * Without it the dashboard shows two people the same role name while they can
 * do different things, and the first time anyone notices is when one of them
 * cannot do something the other can.
 */
export function matchesRole(permissions: readonly string[], rolePermissions: readonly string[]): boolean {
  const held = withImpliedReads(permissions);
  const expected = withImpliedReads(rolePermissions);

  return held.length === expected.length && held.every((permission, index) => permission === expected[index]);
}

/** Human labels, so the dashboard and the API describe a permission alike. */
export const RESOURCE_LABELS: Record<Resource, string> = {
  posts: "News posts",
  media: "Media library",
  gallery: "Gallery",
  content: "Page content",
  faqs: "FAQs",
  enquiries: "Enquiries",
  users: "Staff accounts",
  roles: "Roles and permissions",
  audit: "Audit log",
  settings: "Settings",
};

export const ACTION_LABELS: Record<Action, string> = {
  read: "View",
  create: "Create",
  update: "Edit",
  delete: "Delete",
};
