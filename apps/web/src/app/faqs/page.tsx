import { faqGroupSchema } from "@kedland/types";

import type { Metadata } from "next";

import { FaqDirectory } from "@/components/faqs/faq-directory";
import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Kedland International School",
  description:
    "Answers to common questions about admissions, curriculum, ages, fees, after-school care and more at Kedland International School, Lashibi-Tema.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: Readonly<PageProps>) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(first(params["page"]) ?? "1", 10) || 1);
  const group = faqGroupSchema.safeParse(first(params["group"]));
  const q = (first(params["q"]) ?? "").trim().slice(0, 80);
  return (
    <ContentPage
      page="faqs"
      beforeLast={
        <FaqDirectory page={page} {...(group.success ? { group: group.data } : {})} {...(q ? { q } : {})} />
      }
    />
  );
}
