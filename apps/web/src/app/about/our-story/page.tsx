import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Our Story | About",
  description:
    "Kedland began as a summer school with a big heart, and grew into a full British-curriculum school in Lashibi-Tema.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="OUR STORY"
      title="How Kedland began"
      intro="From a small summer programme to a growing family of Stars."
      coming={["How Kedland began", "Founding vision", "Where we are today"]}
    />
  );
}
