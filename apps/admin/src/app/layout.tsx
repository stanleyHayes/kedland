import type { Metadata } from "next";

import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kedland Dashboard",
    template: "%s | Kedland Dashboard",
  },
  description: "Publishing and content management for Kedland International School.",
  // Belt and braces with the X-Robots-Tag header in next.config.ts.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
     * `suppressHydrationWarning` on <html>, and only on <html>.
     *
     * The inline script below sets `data-admin-theme` before React hydrates,
     * which is the whole point of it — reading the stored theme in an effect
     * instead means every load flashes the light theme first. The server cannot
     * know what that script will decide, so the attribute is legitimately absent
     * from the server HTML and present on the client, and React reports a
     * mismatch it will not repair.
     *
     * This is the case the flag exists for. It suppresses one element's
     * attributes, not its subtree, so a genuine mismatch anywhere below still
     * reports — which matters, because a console full of warnings nobody can act
     * on is how the real one goes unnoticed.
     */
    <html lang="en-GH" className={fontVariables} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=localStorage.getItem('kedland-admin-theme')||'light';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.adminTheme=d?'dark':'light'}catch(e){}`,
          }}
        />
        {/* The dashboard shell and the login page each render their own
            <main id="main">, so this link works on both without the root
            layout having to know which one is showing. */}
        <a href="#main" className="sr-only focus:not-sr-only">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
