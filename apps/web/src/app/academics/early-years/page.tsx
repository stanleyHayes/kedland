import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Early Years | Academics",
  description:
    "The British Early Years Foundation Stage at Kedland \u2014 seven areas of study for children from birth to five.",
};

export default function Page() {
  return <ContentPage page="academics/early-years" />;
}
