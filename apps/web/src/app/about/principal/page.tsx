import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Principal's Welcome | About",
  description: "A warm welcome from Mary, Principal of Kedland International School.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="A WARM WELCOME"
      title="A message from our Principal"
      intro="Mary welcomes you to a vibrant, inclusive community of Stars."
      coming={["The Principal's message", "Book a tour"]}
    />
  );
}
