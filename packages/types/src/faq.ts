import { z } from "zod";

import { faqGroupSchema } from "./enums";

export const faqInputSchema = z.strictObject({
  group: faqGroupSchema,
  question: z.string().trim().min(1).max(240),
  answer: z.string().trim().min(1).max(5000),
  order: z.number().int().nonnegative(),
  published: z.boolean(),
});

export const faqUpdateSchema = faqInputSchema.partial();

export type FaqInput = z.infer<typeof faqInputSchema>;
export type FaqUpdate = z.infer<typeof faqUpdateSchema>;

export interface Faq extends FaqInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}
