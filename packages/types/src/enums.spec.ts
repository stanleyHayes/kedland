import { describe, expect, it } from "vitest";

import {
  auditActionSchema,
  enquiryStatusSchema,
  enquiryTopicSchema,
  faqGroupSchema,
  postCategorySchema,
  postStatusSchema,
  schoolLevelSchema,
  userRoleSchema,
  userStatusSchema,
} from "./enums";

/**
 * These vocabularies are closed on purpose. Each test below pins a decision
 * recorded in the build package, so widening one is a deliberate act with a
 * failing test to explain itself, not a quiet edit.
 */
describe("closed vocabularies", () => {
  it("keeps staff roles to two — this is a back office for two or three people", () => {
    expect(userRoleSchema.options).toEqual(["admin", "editor"]);
    expect(userRoleSchema.safeParse("superadmin").success).toBe(false);
  });

  it("has no review step in the post lifecycle — the school publishes directly", () => {
    expect(postStatusSchema.options).toEqual(["draft", "published"]);
    expect(postStatusSchema.safeParse("pending-review").success).toBe(false);
  });

  it("fixes the three post categories from build package §4.6", () => {
    expect(postCategorySchema.options).toEqual(["news", "events", "learning"]);
  });

  it("covers the four enquiry triage states", () => {
    expect(enquiryStatusSchema.options).toEqual(["new", "read", "replied", "archived"]);
  });

  it("offers the enquiry topics the contact form lists", () => {
    expect(enquiryTopicSchema.options).toEqual(["admissions", "book-a-tour", "after-school-care", "general"]);
  });

  it("groups FAQs exactly as the FAQs page does", () => {
    expect(faqGroupSchema.options).toEqual(["admissions", "curriculum", "school-life", "practical"]);
  });

  it("stops at Primary 3 — the school does not yet offer higher levels", () => {
    // Build package §4.3b: do not advertise levels that are not open.
    expect(schoolLevelSchema.options).toContain("primary-3");
    expect(schoolLevelSchema.safeParse("primary-4").success).toBe(false);
    expect(schoolLevelSchema.safeParse("primary-6").success).toBe(false);
  });

  it("lets a parent say they are not sure which level they need", () => {
    expect(schoolLevelSchema.safeParse("not-sure").success).toBe(true);
  });

  it("separates daycare into babies and creche", () => {
    expect(schoolLevelSchema.safeParse("daycare-babies").success).toBe(true);
    expect(schoolLevelSchema.safeParse("daycare-creche").success).toBe(true);
  });

  it("can suspend an account without deleting it", () => {
    expect(userStatusSchema.options).toEqual(["active", "suspended"]);
  });

  it("records failed sign-ins, not only successful ones", () => {
    // A run of `login-failed` entries is the signal that someone is guessing.
    expect(auditActionSchema.safeParse("login-failed").success).toBe(true);
  });

  it("names an audit verb for every mutating operation the API exposes", () => {
    for (const action of ["create", "update", "delete", "publish", "unpublish", "restore"]) {
      expect(auditActionSchema.safeParse(action).success).toBe(true);
    }
  });
});
