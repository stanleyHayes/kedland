import type { SectionData } from "@kedland/types";

/**
 * Fixture builders.
 *
 * Each returns a *valid* object by default and takes an override so a test can
 * change exactly the one field it is about. Tests that build objects inline
 * drift from the schema; tests that build them here fail loudly when the schema
 * moves, which is the point.
 *
 * The default values are the real copy from build package §4 — using the
 * school's own words keeps fixtures honest about length and tone.
 */

export function buildHero(overrides: Partial<SectionData<"hero">> = {}): SectionData<"hero"> {
  return {
    eyebrow: "THE FUTURE BEGINS HERE",
    heading: "Where little Stars learn, play, and shine.",
    subheading:
      "A warm, British-curriculum school in Lashibi-Tema for Daycare through Primary 3 — nurturing curious minds, kind hearts, and big dreams.",
    primaryCta: { label: "Enrol Now", href: "/admissions" },
    secondaryCta: { label: "Book a Tour", href: "/contact" },
    image: { mediaId: "hero-placeholder", alt: "Kedland pupils playing together outdoors" },
    trustChips: [
      "British National Curriculum",
      "Cambridge Primary",
      "Daycare–Primary 3",
      "After-School & Weekend Care",
    ],
    ...overrides,
  };
}

const KEDLAND_VALUES: readonly { letter: string; name: string; body: string }[] = [
  { letter: "K", name: "Kindness", body: "We treat others with compassion, empathy and respect." },
  {
    letter: "E",
    name: "Excellence",
    body: "We strive for outstanding performance, from academics to extracurriculars.",
  },
  {
    letter: "D",
    name: "Determined",
    body: "We believe in perseverance and resilience, and urge our Stars to embrace challenges.",
  },
  {
    letter: "L",
    name: "Loveable",
    body: "We cherish warmth, care and affection, and encourage our community to show the same.",
  },
  {
    letter: "A",
    name: "Ambitious",
    body: "We go for gold — setting high goals and working hard to reach them.",
  },
  {
    letter: "N",
    name: "Nurturing",
    body: "We value care and support, creating a safe, enabling environment for every child.",
  },
  {
    letter: "D",
    name: "Daring",
    body: "We encourage our Stars to take healthy risks and be adventurous.",
  },
];

export function buildValuesTiles(
  overrides: Partial<SectionData<"values-tiles">> = {},
): SectionData<"values-tiles"> {
  return {
    heading: "Our name is our promise",
    tiles: KEDLAND_VALUES.map((tile) => ({ ...tile })),
    cta: { label: "Meet our values", href: "/about/mission-vision-values" },
    ...overrides,
  };
}

export function buildIconCards(
  overrides: Partial<SectionData<"icon-cards">> = {},
): SectionData<"icon-cards"> {
  return {
    eyebrow: "WE FOCUS ON THE WHY",
    heading: "Why little minds thrive at Kedland",
    cards: [
      {
        icon: "sparkle",
        title: "Learning through play & inquiry",
        body: 'We replace "recite and repeat" with "explore and discover," igniting each child\'s natural curiosity.',
      },
      {
        icon: "book",
        title: "British & Cambridge curriculum",
        body: "EYFS in the early years and Cambridge Primary as they grow — a world-class foundation.",
      },
      {
        icon: "heart",
        title: "Small, caring community",
        body: "Every Star is known by name. Kindness, warmth and safety come first.",
      },
      {
        icon: "palette",
        title: "More than lessons",
        body: "Sports, art, music and adventure — plus after-school service and weekend drop-off.",
      },
    ],
    ...overrides,
  };
}
