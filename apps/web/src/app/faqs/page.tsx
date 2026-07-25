import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Kedland International School",
  description:
    "Answers to common questions about admissions, curriculum, ages, fees, after-school care and more at Kedland International School, Lashibi-Tema.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="FAQS"
      title="Frequently asked questions"
      intro="Admissions, curriculum, school life and the practical details."
      coming={["Admissions", "Curriculum & learning", "School life", "Practical"]}
    />
  );
}
