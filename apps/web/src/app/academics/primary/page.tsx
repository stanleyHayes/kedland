import type { CtaBannerData, PageIntroData } from "@/components/sections/blocks";
import type { SubjectsGridData } from "@/components/sections/blocks-extra";
import type { Metadata } from "next";

import { PrimaryExperience } from "@/components/academics/academics-experiences";
import { findSection, getPageSections } from "@/lib/api";

export const metadata: Metadata = {
  title: "Primary | Academics",
  description:
    "Cambridge Primary at Kedland \u2014 Primary 1 to 3, with English, Mathematics, Science, ICT, Music, Geography, Arts, French and History.",
};

export default async function Page() {
  const sections = await getPageSections("academics/primary");
  const data = (key: string): Record<string, unknown> | undefined => findSection(sections, key)?.data;

  return (
    <PrimaryExperience
      intro={data("intro") as unknown as PageIntroData | undefined}
      subjects={data("subjects") as unknown as SubjectsGridData | undefined}
      cta={data("cta-banner") as unknown as CtaBannerData | undefined}
    />
  );
}
