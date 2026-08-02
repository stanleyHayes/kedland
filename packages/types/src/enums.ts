import { z } from "zod";

/**
 * Closed vocabularies shared by the API, the public site and the dashboard.
 *
 * Each is a Zod enum first and a TypeScript type second, so the same definition
 * validates a request body at the API boundary and narrows a union in a React
 * component. One definition, no drift.
 */

/** Staff roles. Deliberately two — this is a back office for 2–3 people. */
export const userRoleSchema = z.enum(["admin", "editor"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userStatusSchema = z.enum(["active", "suspended"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

/** Blog post lifecycle. There is no review step — the school publishes directly. */
export const postStatusSchema = z.enum(["draft", "published"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

/** Fixed set, per build package §4.6. Adding one is a deploy, which is the right
 *  trade for three staff — it keeps the public category filter coherent. */
export const postCategorySchema = z.enum(["news", "events", "learning"]);
export type PostCategory = z.infer<typeof postCategorySchema>;

/** Parent enquiry triage states (build package §5.1). */
export const enquiryStatusSchema = z.enum(["new", "read", "replied", "archived"]);
export type EnquiryStatus = z.infer<typeof enquiryStatusSchema>;

/** What the parent is asking about — drives the notification subject line. */
export const enquiryTopicSchema = z.enum(["admissions", "book-a-tour", "after-school-care", "general"]);
export type EnquiryTopic = z.infer<typeof enquiryTopicSchema>;

/** The levels the school currently offers. Primary 1–3 only — do not advertise
 *  levels that are not yet open (build package §4.3b). */
export const schoolLevelSchema = z.enum([
  "daycare-babies",
  "daycare-creche",
  "nursery-1",
  "nursery-2",
  "reception",
  "primary-1",
  "primary-2",
  "primary-3",
  "not-sure",
]);
export type SchoolLevel = z.infer<typeof schoolLevelSchema>;

/** FAQ groupings, per build package §4.8. */
export const faqGroupSchema = z.enum(["admissions", "curriculum", "school-life", "practical"]);
export type FaqGroup = z.infer<typeof faqGroupSchema>;

/** Audit trail verbs. Append-only; every mutating route writes one. */
export const auditActionSchema = z.enum([
  "create",
  "update",
  "delete",
  "publish",
  "unpublish",
  "restore",
  "login",
  "login-failed",
  /** The password was right but a second factor is still outstanding. */
  "login-mfa-required",
  "logout",
  "password-change",
  "role-change",
  "suspend",
  "reinstate",
]);
export type AuditAction = z.infer<typeof auditActionSchema>;
