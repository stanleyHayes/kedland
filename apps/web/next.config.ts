import type { NextConfig } from "next";

/**
 * Security headers (agent_plan §6.7).
 *
 * The CSP is deliberately tight: this site loads its own fonts (self-hosted by
 * `next/font`), its own images, Cloudinary media and the Turnstile widget —
 * nothing else. `frame-ancestors 'none'` because no page here should ever be
 * embedded.
 */
/**
 * React's development build uses eval() for debugging features; the production
 * build never does. Allowing it in dev only keeps the deployed policy strict
 * while removing the console error that would otherwise train us to ignore it.
 */
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

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
