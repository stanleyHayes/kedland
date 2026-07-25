import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Contact Us | Kedland International School, Lashibi-Tema",
  description:
    "Get in touch with Kedland International School in Community 19, Lashibi-Tema. Enquire about admissions, book a tour, or ask us anything.",
};

export default function Page() {
  return <ContentPage page="contact" />;
}
