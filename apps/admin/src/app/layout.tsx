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
    <html lang="en-GH" className={fontVariables}>
      <body>
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
