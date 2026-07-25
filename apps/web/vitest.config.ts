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
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
