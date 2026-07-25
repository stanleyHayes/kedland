import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Kedland International School",
  description:
    "Answers to common questions about admissions, curriculum, ages, fees, after-school care and more at Kedland International School, Lashibi-Tema.",
};

export default function Page() {
  return <ContentPage page="faqs" />;
}
