import type { Faq } from "@kedland/types";

/**
 * `FAQPage` for `/faqs` — agent_plan §6.5.
 *
 * Built from the same records the directory renders, so the structured data
 * can never promise an answer the page does not give. Answers are plain text
 * in the CMS, so they go in verbatim; the `<JsonLd>` renderer escapes `<`
 * either way.
 */
export function faqPage(faqs: Faq[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
