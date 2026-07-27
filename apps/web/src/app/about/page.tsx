import type { Metadata } from "next";

import { AboutExplore } from "@/components/about/about-explore";
import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "About Us | Kedland International School",
  description:
    "Our story, mission, vision and values \u2014 a nurturing British-curriculum school in Lashibi-Tema raising creative, open-minded Stars.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <ContentPage page="about" beforeLast={<AboutExplore current="about" />} />;
}
