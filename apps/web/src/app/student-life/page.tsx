import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Student Life | Kedland International School",
  description:
    "Inside life at Kedland \u2014 a joyful, safe, inquiry-led day of learning, play, clubs, music, sport and care, for young children in Lashibi-Tema.",
};

export default function Page() {
  return <ContentPage page="student-life" />;
}
