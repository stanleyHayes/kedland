import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      /*
       * `server-only` exists to make importing a server module from a client
       * component a build error, which is exactly the guard we want on the
       * session code. Under Vitest there is no server/client split to enforce,
       * and its package resolves to the throwing client build — so every test
       * touching a server module would fail on the import alone.
       *
       * Aliased to an empty module: the guard keeps working where it matters
       * (the Next build) and stops being a false alarm where it does not.
       */
      "server-only": resolve(import.meta.dirname, "./test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{spec,test}.{ts,tsx}"],
    /*
     * Longer than the 5s default, because coverage changes the arithmetic.
     *
     * V8 instrumentation makes React rendering and `userEvent`'s per-keystroke
     * typing several times slower, and the section form's tests type whole
     * sentences into a form that re-renders on every character. They pass in
     * about a second uninstrumented and time out under `--coverage`, which is a
     * property of the harness rather than of the code — and a suite that only
     * fails when measured is one people learn to run without measuring.
     */
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{spec,test}.{ts,tsx}",
        "src/app/**/layout.tsx",
        // Server-rendered route orchestration and server actions are exercised
        // by the API integration and Playwright suites. Counting them as
        // uncovered jsdom code made the unit gate fail before those suites ran.
        "src/app/**/page.tsx",
        "src/app/**/actions.ts",
        "src/components/workflows/*-workflows.tsx",
        "src/components/workflows/collection-toolbar.tsx",
        "src/components/workflows/workflow-ui.tsx",
        // This visual document preview is verified in the real-browser admin
        // flow; jsdom cannot validate its responsive layout.
        "src/components/content/section-preview.tsx",
        "src/app/**/{sitemap,robots,opengraph-image}.ts*",
        // `next/font/google` is a build-time transform: the calls are rewritten
        // by the Next compiler and throw under a plain Node runtime, so a unit
        // test here could only assert against a mock of the framework. The
        // fonts are verified where the claim is actually falsifiable — in the
        // Playwright suite, which checks the rendered font-family in a real
        // browser.
        "src/lib/fonts.ts",
      ],
      // Ratchet against the client-side baseline. Server-rendered workflows are
      // covered elsewhere, while the remaining branch gap is concentrated in
      // permission and browser-capability fallbacks.
      thresholds: { statements: 78, branches: 70, functions: 80, lines: 80 },
    },
  },
});
