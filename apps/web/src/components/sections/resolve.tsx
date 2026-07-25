import {
  CtaBanner,
  Hero,
  IconCards,
  InstagramShowcase,
  LevelCards,
  PageIntro,
  ProseBand,
  ProseStrip,
  QuoteTeaser,
  ValuesTiles,
  type CtaBannerData,
  type HeroData,
  type IconCardsData,
  type InstagramData,
  type LevelCardsData,
  type PageIntroData,
  type ProseBandData,
  type ProseStripData,
  type QuoteTeaserData,
  type ValuesTilesData,
} from "./blocks";

import type { Section } from "@/lib/api";

/**
 * Maps a section type to the component that renders it.
 *
 * The registry decides which sections a page has and in what order; this
 * decides what each one looks like. Neither knows about the other beyond the
 * type name, which is why adding a section is a registry entry plus a component
 * and nothing else.
 *
 * A type with no component yet renders nothing rather than throwing. During the
 * build-out that means a page shows the sections that exist and quietly omits
 * the rest — far better than a page that 500s because one block is unfinished.
 */
const RENDERERS: Record<string, (data: Record<string, unknown>) => React.ReactNode> = {
  hero: (data) => <Hero data={data as unknown as HeroData} />,
  "page-intro": (data) => <PageIntro data={data as unknown as PageIntroData} />,
  "prose-strip": (data) => <ProseStrip data={data as unknown as ProseStripData} />,
  "prose-band": (data) => <ProseBand data={data as unknown as ProseBandData} />,
  "icon-cards": (data) => <IconCards data={data as unknown as IconCardsData} />,
  "level-cards": (data) => <LevelCards data={data as unknown as LevelCardsData} />,
  "values-tiles": (data) => <ValuesTiles data={data as unknown as ValuesTilesData} />,
  "quote-teaser": (data) => <QuoteTeaser data={data as unknown as QuoteTeaserData} />,
  instagram: (data) => <InstagramShowcase data={data as unknown as InstagramData} />,
  "cta-banner": (data) => <CtaBanner data={data as unknown as CtaBannerData} />,
};

/** Whether a section type has a component yet. */
export function canRender(type: string): boolean {
  return type in RENDERERS;
}

/**
 * Renders a page's sections in the order the API returned them — which is
 * registry order, resolved server-side.
 */
export function RenderSections({ sections }: Readonly<{ sections: Section[] }>) {
  return (
    <>
      {sections.map((section) => {
        const render = RENDERERS[section.type];
        if (!render) return null;

        return <div key={section.key}>{render(section.data)}</div>;
      })}
    </>
  );
}
