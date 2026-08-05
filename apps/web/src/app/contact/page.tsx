import type { PageIntroData } from "@/components/sections/blocks";
import type { ContactDetailsData } from "@/components/sections/blocks-extra";
import type { Metadata } from "next";

import { ContactExperience } from "@/components/contact/contact-experience";
import { RenderSections } from "@/components/sections/resolve";
import { getGalleryTiles, getPageSections, getPublicSettings } from "@/lib/api";
import { JsonLd } from "@/lib/seo/json-ld";
import { educationalOrganization } from "@/lib/seo/organization";

export const metadata: Metadata = {
  title: "Contact Us | Kedland International School, Lashibi-Tema",
  description:
    "Get in touch with Kedland International School in Community 19, Lashibi-Tema. Enquire about admissions, book a tour, or ask us anything.",
  alternates: { canonical: "/contact" },
};

const FALLBACK_INTRO: PageIntroData = {
  eyebrow: "Get in touch",
  heading: "Get in touch",
  standfirst:
    "We'd love to hear from you. Ask a question, enquire about admissions, or book a tour — we're happy to help.",
};

const FALLBACK_DETAILS: ContactDetailsData = {
  heading: "Come and see us",
  body: "Visit us in Community 19 Annex, Lashibi-Tema, near Deon Recreational Centre.",
  formHeading: "Tell us how we can help",
  mapHeading: "Visit the school",
};

export default async function Page() {
  const [sections, galleryTiles, { socials }] = await Promise.all([
    getPageSections("contact"),
    getGalleryTiles(),
    getPublicSettings(),
  ]);
  const introSection = sections.find((section) => section.type === "page-intro");
  const detailsSection = sections.find((section) => section.type === "contact-details");
  const remainingSections = sections.filter(
    (section) => section.type !== "page-intro" && section.type !== "contact-details",
  );

  return (
    <>
      {/* The school as schema.org sees it — agent_plan §6.5 (also on the home page). */}
      <JsonLd data={educationalOrganization(socials)} />
      <ContactExperience
        intro={(introSection?.data as unknown as PageIntroData | undefined) ?? FALLBACK_INTRO}
        details={(detailsSection?.data as unknown as ContactDetailsData | undefined) ?? FALLBACK_DETAILS}
      />
      <RenderSections sections={remainingSections} galleryTiles={galleryTiles} />
    </>
  );
}
