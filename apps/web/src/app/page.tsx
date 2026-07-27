import { HomeRouteGuide } from "@/components/home/home-route-guide";
import { ContentPage } from "@/components/sections/content-page";
import { JsonLd } from "@/lib/seo/json-ld";
import { educationalOrganization } from "@/lib/seo/organization";

export default function HomePage() {
  return (
    <>
      {/* The school as schema.org sees it — agent_plan §6.5 (also on /contact). */}
      <JsonLd data={educationalOrganization()} />
      <ContentPage page="home" beforeLast={<HomeRouteGuide />} />
    </>
  );
}
