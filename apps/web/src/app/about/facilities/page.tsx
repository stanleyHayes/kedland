import type { Metadata } from "next";

import { AboutExplore } from "@/components/about/about-explore";
import { CmsGallerySection } from "@/components/gallery/cms-gallery-section";
import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Facilities | About",
  description: "Ultra-modern, child-friendly facilities designed for comfort, safety and wonder.",
};

export default function Page() {
  return (
    <ContentPage
      page="about/facilities"
      beforeLast={
        <>
          <CmsGallerySection />
          <AboutExplore current="about/facilities" />
        </>
      }
    />
  );
}
