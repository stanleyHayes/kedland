import { nextConfig } from "@kedland/config/eslint/next";

export default [
  ...nextConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    // Playwright specs run in Node against a live server; the Vitest plugin's
    // assertions do not apply and its rules would misfire.
    files: ["e2e/**/*.ts"],
    rules: { "vitest/expect-expect": "off" },
  },
];
