import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{spec,test}.{ts,tsx}"],
    /*
     * Vitest defaults to five seconds, and these tests occasionally need longer
     * than that when the whole monorepo runs at once.
     *
     * Not because any of them are slow — the package's 209 tests finish in
     * about a second and a half on their own. But a full `pnpm test` runs eight
     * packages in parallel, and on a machine already busy the jsdom environment
     * takes long enough to stand up that a render assertion drifts past the
     * deadline. The tell was that a different test failed each time and every
     * one of them passed alone, which is never a real defect and always a
     * deadline. Same reasoning, and the same number, as the public site.
     */
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{spec,test}.{ts,tsx}", "src/index.ts"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
