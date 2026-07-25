import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Privacy Notice | Kedland International School",
  description: "How Kedland International School collects, uses and protects your information.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="PRIVACY"
      title="Privacy Notice"
      intro="How we handle the information you share with us."
      coming={["What we collect", "How we use it", "Your rights", "Contact"]}
    />
  );
}
