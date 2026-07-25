import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Academics & Curriculum | Kedland International School",
  description:
    "British Early Years Foundation Stage for our youngest Stars and Cambridge Primary as they grow \u2014 an inquiry-led, world-class curriculum in Lashibi-Tema.",
};

export default function Page() {
  return <ContentPage page="academics" />;
}
