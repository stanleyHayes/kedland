import { COLOURS } from "@kedland/ui";

import type { Metadata, Viewport } from "next";

import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

/**
 * Site-wide metadata. Per-page titles fill the `%s` slot; the copy here is the
 * build package's own (§4.1), and the whole set moves to the CMS `settings`
 * document in Phase 3.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000"),
  title: {
    default: "Kedland International School | British-Curriculum School in Lashibi-Tema",
    template: "%s | Kedland International School",
  },
  description:
    "A warm, nurturing British-curriculum school for Daycare through Primary 3 in Community 19, Lashibi-Tema. Where the future begins. Enrol your little Star today.",
  openGraph: {
    type: "website",
    locale: "en_GH",
    siteName: "Kedland International School",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // The browser chrome tint on mobile. Read from the token rather than pasted,
  // so a palette change reaches the address bar too.
  themeColor: COLOURS.navy,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GH" className={fontVariables}>
      <body>
        {/* First focusable element on the page — keyboard users skip the nav. */}
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
