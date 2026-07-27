import type { Metadata } from "next";

import { ContentPage } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Privacy Notice | Kedland International School",
  description: "How Kedland International School collects, uses and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <ContentPage page="privacy" />;
}
