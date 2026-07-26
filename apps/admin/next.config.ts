import type { NextConfig } from "next";

/**
 * React's development build uses eval() for debugging features; the production
 * build never does. Allowing it in dev only keeps the deployed policy strict
 * while removing the console error that would otherwise train us to ignore it.
 */
const isDev = process.env.NODE_ENV !== "production";

/**
 * The public site's origin, so the content editor can frame its `/preview` route.
 *
 * Named explicitly rather than relying on `default-src 'self'`, which forbids
 * framing anything cross-origin — and the site is a different origin from the
 * dashboard in every environment. Without this the preview iframe is refused by
 * the browser before a request is even made, which shows up as a blank panel and
 * nothing in any log.
 *
 * The site must also permit *being* framed by us; see `frameableBy` in the web
 * app's `csp.ts`. Both halves are required and neither is sufficient.
 */
function siteOrigin(): string {
  const configured = process.env["NEXT_PUBLIC_SITE_URL"];
  if (!configured) return "";

  try {
    return new URL(configured).origin;
  } catch {
    return "";
  }
}

const SITE = siteOrigin();

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self'",
  "connect-src 'self' https://api.cloudinary.com",
  // Only the site's own preview route. An unset or malformed site URL yields ""
  // and so falls back to 'none' — a typo must close the frame, never open it.
  SITE ? `frame-src ${SITE}` : "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@kedland/ui", "@kedland/types"],
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          // The back office has no business in a search index.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
