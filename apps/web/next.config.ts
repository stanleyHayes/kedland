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
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
