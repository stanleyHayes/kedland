import type { Metadata } from "next";

import { AboutExplore } from "@/components/about/about-explore";
import { CmsGallerySection } from "@/components/gallery/cms-gallery-section";
import { ContentPage } from "@/components/sections/content-page";
import { breadcrumbList, breadcrumbsFor } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Facilities | About",
  description: "Ultra-modern, child-friendly facilities designed for comfort, safety and wonder.",
  alternates: { canonical: "/about/facilities" },
};

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbList(breadcrumbsFor("/about/facilities"))} />
      <ContentPage
        page="about/facilities"
        beforeLast={
          <>
            <CmsGallerySection />
            <AboutExplore current="about/facilities" />
          </>
        }
      />
    </>
  );
}
