import { Baloo_2, Nunito } from "next/font/google";

/**
 * Build package §2.4: Baloo 2 for display, Nunito for body — rounded, friendly,
 * highly legible.
 *
 * `next/font/google` downloads these at build time and serves them from our own
 * origin, so there is no runtime request to Google and no third-party font
 * origin to allow in the CSP. `display: "swap"` keeps text visible while they
 * load, which matters on a slow connection far more than a flash of fallback.
 */

export const display = Baloo_2({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--font-display-loaded",
});

export const body = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-body-loaded",
});

/** Applied to <html> so both families are available everywhere. */
export const fontVariables = `${display.variable} ${body.variable}`;
