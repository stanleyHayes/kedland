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
      ],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
