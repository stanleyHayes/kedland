import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Principal's Welcome | About",
  description: "A warm welcome from Mary, Principal of Kedland International School.",
};

export default function Page() {
  return <ContentPage page="about/principal" />;
}
