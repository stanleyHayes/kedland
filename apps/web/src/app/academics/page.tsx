import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Academics & Curriculum | Kedland International School",
  description:
    "British Early Years Foundation Stage for our youngest Stars and Cambridge Primary as they grow \u2014 an inquiry-led, world-class curriculum in Lashibi-Tema.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="OUR CURRICULUM"
      title="Our Curriculum"
      intro="An international, inquiry-led education \u2014 a British foundation in the early years, and Cambridge Primary as your child grows."
      coming={["Early Years (EYFS)", "Primary (Cambridge)"]}
    />
  );
}
