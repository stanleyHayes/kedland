import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Contact Us | Kedland International School, Lashibi-Tema",
  description:
    "Get in touch with Kedland International School in Community 19, Lashibi-Tema. Enquire about admissions, book a tour, or ask us anything.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="GET IN TOUCH"
      title="Get in touch"
      intro="Ask a question, enquire about admissions, or book a tour \u2014 we're happy to help."
      coming={["Contact details", "Enquiry form", "Find us", "Instagram"]}
    />
  );
}
