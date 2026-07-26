import type { Metadata } from "next";

import { AboutExplore } from "@/components/about/about-explore";
import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Our Story | About",
  description:
    "Kedland began as a summer school with a big heart, and grew into a full British-curriculum school in Lashibi-Tema.",
};

export default function Page() {
  return <ContentPage page="about/our-story" beforeLast={<AboutExplore current="about/our-story" />} />;
}
