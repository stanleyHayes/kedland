import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "News & Blog | Kedland International School",
  description: "The latest news, events and stories from Kedland International School in Lashibi-Tema.",
};

export default function Page() {
  return <ContentPage page="news" />;
}
