import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Admissions | Enrol at Kedland International School",
  description:
    "Admissions are open for Daycare (Babies & Creche), Nursery, Reception and Primary 1\u20133 in Lashibi-Tema. Download the admission form and begin your child's journey today.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="ADMISSIONS ARE OPEN"
      title="Begin your child's journey"
      intro="We'd love to welcome your little Star to the Kedland family."
      coming={["Levels open now", "How to enrol", "Download the form", "Fees", "FAQs"]}
    />
  );
}
