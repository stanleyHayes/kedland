import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Student Life | Kedland International School",
  description:
    "Inside life at Kedland \u2014 a joyful, safe, inquiry-led day of learning, play, clubs, music, sport and care, for young children in Lashibi-Tema.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="LIFE AT KEDLAND"
      title="Life at Kedland"
      intro="A vibrant, inclusive community that fosters academic excellence, creativity and social responsibility."
      coming={[
        "A day in the life",
        "Clubs & activities",
        "Arts, music & sport",
        "After-school care",
        "Pastoral care",
        "Safeguarding",
      ]}
    />
  );
}
