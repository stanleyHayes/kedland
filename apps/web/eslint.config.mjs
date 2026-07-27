import { nextConfig } from "@kedland/config/eslint/next";

export default [
  ...nextConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    // Playwright specs run in Node against a live server; the Vitest plugin's
    // assertions do not apply and its rules would misfire.
    files: ["e2e/**/*.ts"],
    rules: { "vitest/expect-expect": "off" },
  },
  {
    // opengraph-image renders through ImageResponse (Satori), where next/image
    // cannot run — a plain <img> is the only option the renderer supports.
    files: ["src/app/opengraph-image.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
];
