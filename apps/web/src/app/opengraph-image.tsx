import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { COLOURS } from "@kedland/ui";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

/**
 * The default Open Graph image, served at `/opengraph-image` and picked up
 * automatically for every route that does not override it (post pages with a
 * cover use the cover instead — agent_plan §6.4).
 *
 * The crest is read from disk and inlined as a data URI: at build time there
 * is no server to fetch `public/` from, and an external fetch here is one
 * more way for a deploy to fail. The layout mirrors the footer's brand block
 * — the navy crest never sits bare on navy, so it keeps its white "sticker"
 * card (build package §2.2). Fonts stay at the renderer's default rather than
 * a fetched webfont, which would be flaky at build time for a 1200×630 card.
 */

export const alt = "Kedland International School — a British-curriculum school in Lashibi-Tema";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo", "kedland-logo-512.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLOURS.navy,
        backgroundImage: `linear-gradient(135deg, ${COLOURS.navy} 0%, ${COLOURS.navyDeep} 100%)`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
          padding: "0 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            backgroundColor: COLOURS.white,
            borderRadius: 28,
            padding: 18,
          }}
        >
          <img src={logoSrc} width={168} height={168} alt="" />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 62,
              fontWeight: 800,
              color: COLOURS.white,
              letterSpacing: "-0.02em",
              textAlign: "center",
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: COLOURS.yellow,
              textAlign: "center",
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div
            style={{
              fontSize: 22,
              color: COLOURS.sky,
              textAlign: "center",
            }}
          >
            British-curriculum school · Community 19 Annex, Lashibi-Tema
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
