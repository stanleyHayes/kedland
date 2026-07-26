import { buildCsp } from "./src/lib/csp";

import type { NextConfig } from "next";

/**
 * Security headers (agent_plan §6.7).
 *
 * The policy itself lives in `src/lib/csp.ts` so it can be tested — see the
 * note there about the one mistake it exists to prevent.
 */
const CSP = buildCsp({
  apiUrl: process.env["NEXT_PUBLIC_API_URL"],
  isDev: process.env.NODE_ENV !== "production",
});

/**
 * The one route the dashboard is allowed to frame, for its live preview.
 *
 * Kept as its own header block rather than by widening the site-wide policy.
 * `X-Frame-Options: DENY` is honoured by browsers *in addition to*
 * `frame-ancestors`, and Next cannot unset a header a broader rule already
 * added — so the strict rule below excludes this path instead, and this one
 * omits `X-Frame-Options` entirely. Modern browsers take `frame-ancestors` as
 * authoritative, and it is the only one of the two that can name an origin.
 */
const PREVIEW_CSP = buildCsp({
  apiUrl: process.env["NEXT_PUBLIC_API_URL"],
  isDev: process.env.NODE_ENV !== "production",
  frameableBy: process.env["NEXT_PUBLIC_DASHBOARD_URL"],
});

const HARDENING = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Workspace packages ship TypeScript source rather than build output.
  transpilePackages: ["@kedland/ui", "@kedland/types"],

  // AVIF first, WebP second — both well under the 250 KB ceiling the build
  // package sets for imagery (§2.6).
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },

  // The framework version is not a fact a visitor needs.
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Everything except the preview surface, which needs to be frameable by
        // the dashboard and so cannot carry `X-Frame-Options: DENY`.
        source: "/:path((?!preview$|preview/).*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          ...HARDENING,
        ],
      },
      {
        // The root, which the pattern above cannot match.
        source: "/",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          ...HARDENING,
        ],
      },
      {
        source: "/preview",
        headers: [
          { key: "Content-Security-Policy", value: PREVIEW_CSP },
          // No page of the school's site belongs in a search result under this
          // path, and it has no content of its own to index.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          ...HARDENING,
        ],
      },
    ];
  },
};

export default nextConfig;
