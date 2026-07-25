import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Mission, Vision & Values | About",
  description:
    "Our mission, vision and the seven values that spell our name \u2014 Kindness, Excellence, Determined, Loveable, Ambitious, Nurturing, Daring.",
};

export default function Page() {
  return (
    <PageShell
      eyebrow="OUR PROMISE"
      title="Mission, Vision & Values"
      intro="Our name is our promise \u2014 seven values, one for every letter."
      coming={["Mission", "Vision", "Motto", "The KEDLAND values"]}
    />
  );
}
