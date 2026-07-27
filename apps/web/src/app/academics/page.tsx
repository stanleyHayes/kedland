import type { CtaBannerData, PageIntroData } from "@/components/sections/blocks";
import type { TrioData } from "@/components/sections/blocks-extra";
import type { Metadata } from "next";

import { AcademicsOverview } from "@/components/academics/academics-experiences";
import { findSection, getPageSections } from "@/lib/api";

export const metadata: Metadata = {
  title: "Academics & Curriculum",
  description:
    "British Early Years Foundation Stage for our youngest Stars and Cambridge Primary as they grow \u2014 an inquiry-led, world-class curriculum in Lashibi-Tema.",
  alternates: { canonical: "/academics" },
};

export default async function Page() {
  const sections = await getPageSections("academics");
  const data = (key: string): Record<string, unknown> | undefined => findSection(sections, key)?.data;

  return (
    <AcademicsOverview
      intro={data("intro") as unknown as PageIntroData | undefined}
      routes={data("routes") as unknown as TrioData | undefined}
      cta={data("cta-banner") as unknown as CtaBannerData | undefined}
    />
  );
}
