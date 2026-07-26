import { z } from "zod";

import { permissionsSchema, roleSlugSchema, userStatusSchema } from "@kedland/types";

/**
 * What the dashboard may send about a staff account.
 *
 * `strictObject` throughout: an unrecognised key is a mistake worth reporting,
 * not something to drop quietly. A form that sends `permission` instead of
 * `permissions` should hear about it rather than create an account with none.
 */

const emailSchema = z.email("That does not look like an email address").trim().toLowerCase();
const displayNameSchema = z
  .string()
  .trim()
  .min(2, "A name, so colleagues know whose account this is")
  .max(80);

/**
 * The password floor.
 *
 * Twelve characters and nothing else — no character-class rules. NIST dropped
 * composition requirements because they push people towards `Password1!` and
 * towards writing it down; length is what actually helps.
 */
export const passwordSchema = z
  .string()
  .min(12, "At least 12 characters — length matters more than symbols")
  .max(128);

export const newUserSchema = z.strictObject({
  email: emailSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
  roleSlug: roleSlugSchema,
});
export type NewUserInput = z.infer<typeof newUserSchema>;

/** No password: the invitee sets their own. */
export const inviteUserSchema = z.strictObject({
  email: emailSchema,
  displayName: displayNameSchema,
  roleSlug: roleSlugSchema,
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const setPermissionsSchema = z.strictObject({
  // `permissionsSchema` completes implied reads, so a dashboard that sends
  // `posts:delete` alone gets `posts:read` with it rather than a validation
  // error about a rule the person ticking boxes cannot see.
  permissions: permissionsSchema,
});

export const assignRoleSchema = z.strictObject({
  roleSlug: roleSlugSchema,
});

export const setStatusSchema = z.strictObject({
  status: userStatusSchema,
});
