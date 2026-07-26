import type { Metadata } from "next";

import { AboutExplore } from "@/components/about/about-explore";
import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Mission, Vision & Values | About",
  description:
    "Our mission, vision and the seven values that spell our name \u2014 Kindness, Excellence, Determined, Loveable, Ambitious, Nurturing, Daring.",
};

export default function Page() {
  return (
    <ContentPage
      page="about/mission-vision-values"
      beforeLast={<AboutExplore current="about/mission-vision-values" />}
    />
  );
}
