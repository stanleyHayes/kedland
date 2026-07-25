import { z } from "zod";

import { enquiryStatusSchema, enquiryTopicSchema, schoolLevelSchema } from "./enums";

/**
 * A parent's enquiry.
 *
 * Build package §5.1: the contact form is the school's only online intake. It
 * is deliberately not an admission form — the admission form is a PDF a family
 * fills in and brings to the office (§5.2). Nothing here asks for a child's
 * date of birth, medical details, or anything else that would turn a website
 * enquiry into a record the school has to safeguard.
 *
 * `topic` and `level` are closed vocabularies from `enums.ts` rather than free
 * text: they drive the notification's subject line and let the office triage
 * without reading every message first.
 */

/** Trims first, so " " fails `min(1)` rather than passing as a space. */
const text = (max: number): z.ZodString => z.string().trim().min(1).max(max);

export const enquirySchema = z.strictObject({
  parentName: text(120),
  email: z.email().max(200),

  /**
   * Ghanaian numbers are written many ways — 024…, +23324…, with spaces,
   * dashes or brackets. Validating the *digits* rather than the punctuation
   * accepts every one of those, and rejecting a real number over formatting
   * would lose the school an enrolment.
   *
   * 7 digits is the shortest plausible local number; 15 is E.164's ceiling.
   */
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((value) => /^[+(]?[\d\s()+-]+$/.test(value), {
      message: "Enter a phone number we can call you on",
    })
    .refine(
      (value) => {
        const digits = value.replace(/\D/g, "").length;
        return digits >= 7 && digits <= 15;
      },
      { message: "That number looks too short or too long" },
    ),

  topic: enquiryTopicSchema.default("general"),

  /** Which class the enquiry is about. `not-sure` is a real answer, not a gap. */
  level: schoolLevelSchema.default("not-sure"),

  message: text(2000),

  /**
   * Cloudflare Turnstile's client token. Verified server-side against
   * Cloudflare before the enquiry is accepted; the API never trusts it as
   * proof on its own.
   */
  turnstileToken: z.string().max(4000).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/** What the dashboard sees. Excludes the Turnstile token, which is single-use. */
export interface Enquiry {
  id: string;
  parentName: string;
  email: string;
  phone: string;
  topic: z.infer<typeof enquiryTopicSchema>;
  level: z.infer<typeof schoolLevelSchema>;
  message: string;
  status: z.infer<typeof enquiryStatusSchema>;
  /**
   * Whether the school was successfully emailed.
   *
   * Separate from `status` on purpose: an enquiry is persisted *before*
   * delivery is attempted, so a Resend outage never loses a parent's message —
   * it only means nobody was told. The dashboard surfaces un-notified
   * enquiries loudly for exactly that reason.
   */
  notified: boolean;
  createdAt: string;
  handledAt: string | null;
  handledBy: string | null;
}

export const enquiryQuerySchema = z.object({
  status: enquiryStatusSchema.optional(),
});
export type EnquiryQuery = z.infer<typeof enquiryQuerySchema>;

/** Human labels for the level codes, so the email and dashboard read alike. */
export const SCHOOL_LEVEL_LABELS: Record<z.infer<typeof schoolLevelSchema>, string> = {
  "daycare-babies": "Daycare (Babies)",
  "daycare-creche": "Daycare (Crèche)",
  "nursery-1": "Nursery 1",
  "nursery-2": "Nursery 2",
  reception: "Reception",
  "primary-1": "Primary 1",
  "primary-2": "Primary 2",
  "primary-3": "Primary 3",
  "not-sure": "Not sure yet",
};

export const ENQUIRY_TOPIC_LABELS: Record<z.infer<typeof enquiryTopicSchema>, string> = {
  admissions: "Admissions",
  "book-a-tour": "Book a tour",
  "after-school-care": "After-school care",
  general: "General enquiry",
};
