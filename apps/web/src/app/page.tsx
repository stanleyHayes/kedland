import { HomeRouteGuide } from "@/components/home/home-route-guide";
import { ContentPage } from "@/components/sections/content-page";
import { getPublicSettings } from "@/lib/api";
import { JsonLd } from "@/lib/seo/json-ld";
import { educationalOrganization } from "@/lib/seo/organization";

export default async function HomePage() {
  const { socials } = await getPublicSettings();

  return (
    <>
      {/* The school as schema.org sees it — agent_plan §6.5 (also on /contact). */}
      <JsonLd data={educationalOrganization(socials)} />
      <ContentPage page="home" beforeLast={<HomeRouteGuide />} />
    </>
  );
}
