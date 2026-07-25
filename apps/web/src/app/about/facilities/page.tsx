import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Facilities | About",
  description: "Ultra-modern, child-friendly facilities designed for comfort, safety and wonder.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="OUR CAMPUS"
      title="A campus built around your child"
      intro="Spacious, well-ventilated classrooms and beautiful outdoor space."
      coming={["Classrooms", "Library", "ICT suite", "Music room", "Outdoor play", "Dining"]}
    />
  );
}
