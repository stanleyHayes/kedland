import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Early Years | Academics",
  description:
    "The British Early Years Foundation Stage at Kedland \u2014 seven areas of study for children from birth to five.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="EARLY YEARS"
      title="The British Early Years Foundation Stage"
      intro="The EYFS sets the standards for development, learning and care in the early years."
      coming={["The seven areas of study", "Assessment", "School readiness"]}
    />
  );
}
