import type { Metadata } from "next";

import { AboutExplore } from "@/components/about/about-explore";
import { ContentPage } from "@/components/sections/content-page";
import { breadcrumbList, breadcrumbsFor } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Mission, Vision & Values | About",
  description:
    "Our mission, vision and the seven values that spell our name \u2014 Kindness, Excellence, Determined, Loveable, Ambitious, Nurturing, Daring.",
  alternates: { canonical: "/about/mission-vision-values" },
};

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbList(breadcrumbsFor("/about/mission-vision-values"))} />
      <ContentPage
        page="about/mission-vision-values"
        beforeLast={<AboutExplore current="about/mission-vision-values" />}
      />
    </>
  );
}
