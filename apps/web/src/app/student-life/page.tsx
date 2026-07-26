import type {
  CtaBannerData,
  PageIntroData,
  ProseBandData,
  ProseStripData,
} from "@/components/sections/blocks";
import type { ChipsBandData, TimelineData, TrioData } from "@/components/sections/blocks-extra";
import type { Metadata } from "next";

import { StudentLifeExperience } from "@/components/student-life/student-life-experience";
import { findSection, getPageSections } from "@/lib/api";

export const metadata: Metadata = {
  title: "Student Life | Kedland International School",
  description:
    "Inside life at Kedland \u2014 a joyful, safe, inquiry-led day of learning, play, clubs, music, sport and care, for young children in Lashibi-Tema.",
};

export default async function Page() {
  const sections = await getPageSections("student-life");
  const data = (key: string): Record<string, unknown> | undefined => findSection(sections, key)?.data;

  return (
    <StudentLifeExperience
      intro={data("intro") as unknown as PageIntroData | undefined}
      day={data("day") as unknown as TimelineData | undefined}
      clubs={data("clubs") as unknown as ChipsBandData | undefined}
      arts={data("arts") as unknown as TrioData | undefined}
      care={data("care") as unknown as ProseStripData | undefined}
      safeguarding={data("safeguarding") as unknown as ProseBandData | undefined}
      cta={data("cta-banner") as unknown as CtaBannerData | undefined}
    />
  );
}
