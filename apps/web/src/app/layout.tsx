import { COLOURS } from "@kedland/ui";

import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageTransition } from "@/components/motion/page-transition";
import { fontVariables } from "@/lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "@/styles/globals.css";

/**
 * Site-wide metadata. Per-page titles fill the `%s` slot; the copy here is the
 * build package's own (§4.1), and the whole set moves to the CMS `settings`
 * document in Phase 3. Every value that depends on the domain comes from
 * `lib/site`, so the move to the final domain is an environment change only.
 * The OG image itself is the route-level `opengraph-image.tsx`, which Next
 * wires in without being named here.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kedland International School | British-Curriculum School in Lashibi-Tema",
    template: "%s | Kedland International School",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "/",
    siteName: SITE_NAME,
    title: "Kedland International School | British-Curriculum School in Lashibi-Tema",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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
    /*
     * `no-js` is removed by the inline script below the moment scripts run.
     * Its only job is to make the scroll-reveal styles inert when they never
     * will: without it, a script failure would leave every section on the site
     * permanently invisible.
     */
    /*
     * `suppressHydrationWarning` on <html>, and only on <html>.
     *
     * The inline script below mutates two things before React hydrates: it drops
     * `no-js` from the class list and sets `data-theme`. Both are deliberate —
     * doing either in an effect means a visible flash on every load — and both
     * are things the server cannot predict, so React sees a mismatch it will not
     * repair and warns about it.
     *
     * Scoped to this one element: it covers `<html>`'s own attributes, not the
     * tree beneath it, so a real mismatch further down still surfaces.
     */
    <html lang="en-GH" className={`no-js ${fontVariables}`} suppressHydrationWarning>
      <body>
        <script
          /*
           * Runs before paint, and does two things that must both happen there.
           *
           * `no-js` comes off so the scroll-reveal styles become active — a
           * script failure leaves them inert rather than leaving every section
           * invisible.
           *
           * The stored theme is applied to `<html>`. In an effect this would
           * run *after* the first paint, so a visitor who chose dark would see
           * a white flash on every single navigation. Wrapped in try/catch
           * because private browsing can refuse localStorage entirely, and a
           * theme preference is not worth breaking the page over.
           *
           * A fixed string with no interpolation — nothing to inject into.
           */
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove('no-js');try{var t=localStorage.getItem('kedland-theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}`,
          }}
        />
        {/* First focusable element on the page — keyboard users skip the nav. */}
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">
          <PageTransition>{children}</PageTransition>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
