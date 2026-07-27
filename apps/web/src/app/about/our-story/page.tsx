import type { Metadata } from "next";

import { AboutExplore } from "@/components/about/about-explore";
import { ContentPage } from "@/components/sections/content-page";
import { breadcrumbList, breadcrumbsFor } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Our Story | About",
  description:
    "Kedland began as a summer school with a big heart, and grew into a full British-curriculum school in Lashibi-Tema.",
  alternates: { canonical: "/about/our-story" },
};

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbList(breadcrumbsFor("/about/our-story"))} />
      <ContentPage page="about/our-story" beforeLast={<AboutExplore current="about/our-story" />} />
    </>
  );
}
