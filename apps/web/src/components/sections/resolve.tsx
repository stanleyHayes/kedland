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
import {
  ChipsBand,
  ContactDetails,
  DownloadBlock,
  EyfsAreas,
  FaqIntro,
  FeatureGrid,
  Legal,
  Letter,
  MissionVision,
  NewsIntro,
  Steps,
  SubjectsGrid,
  Timeline,
  Trio,
  type ChipsBandData,
  type ContactDetailsData,
  type DownloadBlockData,
  type EyfsAreasData,
  type FaqIntroData,
  type FeatureGridData,
  type LegalData,
  type LetterData,
  type MissionVisionData,
  type NewsIntroData,
  type StepsData,
  type SubjectsGridData,
  type TimelineData,
  type TrioData,
} from "./blocks-extra";

import type { Section } from "@/lib/api";
import type { PublicGalleryTile } from "@kedland/types";

import { Reveal } from "@/components/motion/reveal";

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
 * `sections-covered.spec.ts` asserts the two are now in step, so an omission is
 * a test failure rather than a silently missing block on a live page.
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
  "mission-vision": (data) => <MissionVision data={data as unknown as MissionVisionData} />,
  letter: (data) => <Letter data={data as unknown as LetterData} />,
  "feature-grid": (data) => <FeatureGrid data={data as unknown as FeatureGridData} />,
  "eyfs-areas": (data) => <EyfsAreas data={data as unknown as EyfsAreasData} />,
  "subjects-grid": (data) => <SubjectsGrid data={data as unknown as SubjectsGridData} />,
  steps: (data) => <Steps data={data as unknown as StepsData} />,
  "download-block": (data) => <DownloadBlock data={data as unknown as DownloadBlockData} />,
  timeline: (data) => <Timeline data={data as unknown as TimelineData} />,
  "chips-band": (data) => <ChipsBand data={data as unknown as ChipsBandData} />,
  trio: (data) => <Trio data={data as unknown as TrioData} />,
  "contact-details": (data) => <ContactDetails data={data as unknown as ContactDetailsData} />,
  "faq-intro": (data) => <FaqIntro data={data as unknown as FaqIntroData} />,
  "news-intro": (data) => <NewsIntro data={data as unknown as NewsIntroData} />,
  legal: (data) => <Legal data={data as unknown as LegalData} />,
};

/** Whether a section type has a component yet. */
export function canRender(type: string): boolean {
  return type in RENDERERS;
}

/** Every type this resolver can render. Used by the coverage test. */
export function renderableTypes(): string[] {
  return Object.keys(RENDERERS);
}

/**
 * Renders a page's sections in the order the API returned them — which is
 * registry order, resolved server-side.
 */
export function RenderSections({
  sections,
  beforeLast,
  galleryTiles,
  admissionFormAvailable = false,
}: Readonly<{
  sections: Section[];
  beforeLast?: React.ReactNode;
  galleryTiles?: PublicGalleryTile[];
  /**
   * Whether the school's admission PDF is actually on disk.
   *
   * Threaded in the same way as `galleryTiles`: runtime facts a block needs but
   * has no business discovering itself. `DownloadBlock` used to check the
   * filesystem inside itself, which made it the one section that could only ever
   * render on a server — and so the one the dashboard's preview could not show.
   */
  admissionFormAvailable?: boolean;
}>) {
  return (
    <>
      {sections.map((section, index) => {
        const render = RENDERERS[section.type];
        if (!render) return null;
        let rendered = render(section.data);
        if (section.type === "download-block") {
          rendered = (
            <DownloadBlock
              data={section.data as unknown as DownloadBlockData}
              available={admissionFormAvailable}
            />
          );
        }
        if (section.type === "instagram") {
          rendered = (
            <InstagramShowcase
              data={section.data as unknown as InstagramData}
              {...(galleryTiles ? { tiles: galleryTiles } : {})}
            />
          );
        }

        // The first section is already on screen when the page arrives, and the
        // page-entry animation has just played over it. Revealing it again
        // would animate the same content twice in half a second.
        const isFirst = index === 0;
        const body = isFirst ? rendered : <Reveal>{rendered}</Reveal>;

        // `beforeLast` is checked before the first-section case, not after.
        //
        // On a page with a single section that section is both the first and
        // the last, and returning early for the first meant `beforeLast` was
        // never reached. The whole FAQ directory disappeared from /faqs — no
        // error, no empty state, just a page missing its reason for existing —
        // because an editor had left the FAQs page with one section.
        if (beforeLast && index === sections.length - 1) {
          return (
            <div key={section.key}>
              {beforeLast}
              {body}
            </div>
          );
        }

        if (isFirst) return <div key={section.key}>{rendered}</div>;

        return <Reveal key={section.key}>{rendered}</Reveal>;
      })}
    </>
  );
}
