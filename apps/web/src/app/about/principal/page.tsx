import type { Metadata } from "next";

import { AboutExplore } from "@/components/about/about-explore";
import { ContentPage } from "@/components/sections/content-page";
import { breadcrumbList, breadcrumbsFor } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Principal's Welcome | About",
  description: "A warm welcome from Mary, Principal of Kedland International School.",
  alternates: { canonical: "/about/principal" },
};

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbList(breadcrumbsFor("/about/principal"))} />
      <ContentPage page="about/principal" beforeLast={<AboutExplore current="about/principal" />} />
    </>
  );
}
