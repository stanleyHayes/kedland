import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Primary | Academics",
  description:
    "Cambridge Primary at Kedland \u2014 Primary 1 to 3, with English, Mathematics, Science, ICT, Music, Geography, Arts, French and History.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="PRIMARY"
      title="The Cambridge curriculum"
      intro="Educative, interactive, practical and meaningful lessons for Primary 1\u20133."
      coming={[
        "English",
        "Mathematics",
        "Science",
        "ICT",
        "Music",
        "Geography",
        "Arts & Design",
        "French",
        "History",
      ]}
    />
  );
}
