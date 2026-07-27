import type { CtaBannerData, PageIntroData } from "@/components/sections/blocks";
import type { EyfsAreasData } from "@/components/sections/blocks-extra";
import type { Metadata } from "next";

import { EarlyYearsExperience } from "@/components/academics/academics-experiences";
import { findSection, getPageSections } from "@/lib/api";
import { breadcrumbList, breadcrumbsFor } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Early Years | Academics",
  description:
    "The British Early Years Foundation Stage at Kedland \u2014 seven areas of study for children from birth to five.",
  alternates: { canonical: "/academics/early-years" },
};

export default async function Page() {
  const sections = await getPageSections("academics/early-years");
  const data = (key: string): Record<string, unknown> | undefined => findSection(sections, key)?.data;

  return (
    <>
      <JsonLd data={breadcrumbList(breadcrumbsFor("/academics/early-years"))} />
      <EarlyYearsExperience
        intro={data("intro") as unknown as PageIntroData | undefined}
        eyfs={data("eyfs") as unknown as EyfsAreasData | undefined}
        cta={data("cta-banner") as unknown as CtaBannerData | undefined}
      />
    </>
  );
}
