import { HomeRouteGuide } from "@/components/home/home-route-guide";
import { ContentPage } from "@/components/sections/content-page";

export default function HomePage() {
  return <ContentPage page="home" beforeLast={<HomeRouteGuide />} />;
}
