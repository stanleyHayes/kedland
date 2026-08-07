import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    /*
     * Vitest's default is five seconds, and several of these tests genuinely
     * need longer than that under load.
     *
     * They are not slow tests — each passes in well under a second on its own.
     * But jsdom rendering a full page, across many files in parallel on a busy
     * machine, drifts past five seconds often enough that the suite fails for
     * reasons unrelated to the code. A flake that fires most runs is worse than
     * a slow suite: it trains everybody to re-run rather than read the failure.
     */
    testTimeout: 20_000,
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{spec,test}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{spec,test}.{ts,tsx}",
        "src/app/**/layout.tsx",
        "src/app/**/{sitemap,robots,opengraph-image}.ts*",
        // `next/font/google` is a build-time transform: the calls are rewritten
        // by the Next compiler and throw under a plain Node runtime, so a unit
        // test here could only assert against a mock of the framework. The
        // fonts are verified where the claim is actually falsifiable — in the
        // Playwright suite, which checks the rendered font-family in a real
        // browser.
        "src/lib/fonts.ts",
        // Page files are now a page key and a metadata block — the sections,
        // their order and their words all come from the registry. What is left
        // is a one-line wrapper whose only real assertion is "does this route
        // render", which is a browser test, not a jsdom one.
        "src/app/**/page.tsx",
        "src/components/sections/content-page.tsx",
      ],
      // Keep the branch gate at the current browser-heavy baseline; view
      // transitions, Turnstile and canvas fallbacks are exercised in Playwright
      // rather than emulated in jsdom.
      thresholds: { statements: 80, branches: 77, functions: 80, lines: 80 },
    },
  },
});
