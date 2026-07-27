import type { CtaBannerData, HeroData, LevelCardsData, ProseStripData } from "@/components/sections/blocks";
import type { DownloadBlockData, StepsData } from "@/components/sections/blocks-extra";
import type { Metadata } from "next";

import { AdmissionsExperience } from "@/components/admissions/admissions-experience";
import { findSection, getPageSections } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admissions | Enrol at Kedland International School",
  description:
    "Admissions are open for Daycare (Babies & Creche), Nursery, Reception and Primary 1\u20133 in Lashibi-Tema. Download the admission form and begin your child's journey today.",
  alternates: { canonical: "/admissions" },
};

export default async function Page() {
  const sections = await getPageSections("admissions");
  const data = (key: string): Record<string, unknown> | undefined => findSection(sections, key)?.data;

  return (
    <AdmissionsExperience
      hero={data("hero") as unknown as HeroData | undefined}
      levels={data("levels") as unknown as LevelCardsData | undefined}
      steps={data("steps") as unknown as StepsData | undefined}
      download={data("download") as unknown as DownloadBlockData | undefined}
      fees={data("fees") as unknown as ProseStripData | undefined}
      cta={data("cta-banner") as unknown as CtaBannerData | undefined}
    />
  );
}
