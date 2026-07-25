import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Admissions | Enrol at Kedland International School",
  description:
    "Admissions are open for Daycare (Babies & Creche), Nursery, Reception and Primary 1\u20133 in Lashibi-Tema. Download the admission form and begin your child's journey today.",
};

export default function Page() {
  return <ContentPage page="admissions" />;
}
