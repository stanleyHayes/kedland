import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Facilities | About",
  description: "Ultra-modern, child-friendly facilities designed for comfort, safety and wonder.",
};

export default function Page() {
  return <ContentPage page="about/facilities" />;
}
