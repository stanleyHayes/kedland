import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Primary | Academics",
  description:
    "Cambridge Primary at Kedland \u2014 Primary 1 to 3, with English, Mathematics, Science, ICT, Music, Geography, Arts, French and History.",
};

export default function Page() {
  return <ContentPage page="academics/primary" />;
}
