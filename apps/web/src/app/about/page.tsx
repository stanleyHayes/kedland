import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "About Us | Kedland International School",
  description:
    "Our story, mission, vision and values \u2014 a nurturing British-curriculum school in Lashibi-Tema raising creative, open-minded Stars.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="ABOUT KEDLAND"
      title="About Kedland"
      intro="A community built on kindness, curiosity and care."
      coming={["Our Story", "Mission, Vision & Values", "Principal's Welcome", "Facilities"]}
    />
  );
}
