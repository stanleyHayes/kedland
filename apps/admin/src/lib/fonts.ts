import { Outfit } from "next/font/google";
import localFont from "next/font/local";

/**
 * Typography for the dashboard — the same pairing as the public site, so the
 * back office looks like part of the same school.
 *
 * **Euclid Circular A** for display and **Outfit** for body — a client
 * direction that supersedes the Baloo 2 / Nunito pairing in build package §2.4.
 * Euclid keeps the rounded, friendly geometry the brief asks for while reading
 * as considerably more grown-up, which suits a school that has to convince a
 * parent as well as delight a three-year-old.
 *
 * Euclid is licensed, so its files live in the repo and are served from our own
 * origin. Outfit comes from Google Fonts but `next/font/google` downloads it at
 * build time and self-hosts it too — no runtime request to a third party, and
 * nothing extra to allow in the CSP.
 *
 * Only four weights are bundled. Every unused weight is bytes a parent on
 * mobile data pays for and never sees.
 */

export const display = localFont({
  src: [
    { path: "../fonts/EuclidCircularA-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/EuclidCircularA-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/EuclidCircularA-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/EuclidCircularA-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-display-loaded",
  // Trimmed to the metrics of the fallback so the swap does not shift the page.
  adjustFontFallback: "Arial",
});

export const body = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body-loaded",
});

/** Applied to <html> so both families are available everywhere. */
export const fontVariables = `${display.variable} ${body.variable}`;
