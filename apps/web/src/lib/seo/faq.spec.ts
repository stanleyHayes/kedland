import { describe, expect, it } from "vitest";

import { faqPage } from "./faq";

import type { Faq } from "@kedland/types";

const FAQS: Faq[] = [
  {
    id: "1",
    group: "admissions",
    question: "When can my child start?",
    answer: "Admissions are open throughout the year, subject to availability.",
    order: 0,
    published: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    group: "practical",
    question: "Do you offer after-school care?",
    answer: "Yes — supervised care runs until 5pm on school days.",
    order: 1,
    published: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("faqPage", () => {
  it("declares a FAQPage with one Question per record", () => {
    const data = faqPage(FAQS);

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("FAQPage");
    expect(data["mainEntity"]).toHaveLength(2);
  });

  it("uses the question and answer verbatim", () => {
    const entities = faqPage(FAQS)["mainEntity"] as Record<string, unknown>[];

    expect(entities[0]).toEqual({
      "@type": "Question",
      name: "When can my child start?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Admissions are open throughout the year, subject to availability.",
      },
    });
  });

  it("yields an empty mainEntity when the API returned no FAQs", () => {
    expect(faqPage([])["mainEntity"]).toEqual([]);
  });
});
