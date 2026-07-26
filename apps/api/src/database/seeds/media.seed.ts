import type { MediaRegister } from "@kedland/types";

/**
 * Non-pupil starter photography bundled with both Next applications.
 *
 * These records make a fresh environment visually complete without weakening
 * the real-pupil consent gate. Staff can replace every placement from the
 * existing media and gallery workflows.
 */
export const STARTER_MEDIA: readonly MediaRegister[] = [
  {
    publicId: "placeholder-hero",
    url: "/images/cms-starter/classroom-hero.webp",
    alt: "A bright early-years classroom prepared with books, blocks and child-sized tables",
    width: 1774,
    height: 887,
    format: "webp",
    bytes: 159_968,
  },
  {
    publicId: "kedland-starter-creative-table",
    url: "/images/cms-starter/creative-table.webp",
    alt: "A creative learning table with paints, paper shapes and child-made artwork",
    width: 1254,
    height: 1254,
    format: "webp",
    bytes: 159_160,
  },
  {
    publicId: "kedland-starter-reading-corner",
    url: "/images/cms-starter/reading-corner.webp",
    alt: "A sunlit reading corner with picture books, soft cushions and wooden stars",
    width: 1024,
    height: 1536,
    format: "webp",
    bytes: 125_546,
  },
  {
    publicId: "placeholder-admissions",
    url: "/images/cms-starter/play-garden.webp",
    alt: "A green school play garden with safe climbing equipment and shaded seating",
    width: 1536,
    height: 1024,
    format: "webp",
    bytes: 230_966,
  },
  {
    publicId: "kedland-starter-discovery-table",
    url: "/images/cms-starter/discovery-table.webp",
    alt: "A maths and science discovery table with counting, weighing and nature materials",
    width: 1024,
    height: 1536,
    format: "webp",
    bytes: 124_194,
  },
  {
    publicId: "kedland-starter-music-corner",
    url: "/images/cms-starter/music-corner.webp",
    alt: "A music and movement corner with drums, ribbons, shakers and a xylophone",
    width: 1672,
    height: 941,
    format: "webp",
    bytes: 107_072,
  },
] as const;
