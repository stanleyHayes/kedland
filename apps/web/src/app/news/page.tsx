import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "News & Blog | Kedland International School",
  description: "The latest news, events and stories from Kedland International School in Lashibi-Tema.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="NEWS"
      title="News & Stars in Action"
      intro="The latest from our classrooms, our clubs and our community."
      coming={["News", "Events", "Learning"]}
    />
  );
}
