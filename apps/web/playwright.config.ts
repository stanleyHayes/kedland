import { defineConfig, devices } from "@playwright/test";

// Overridable because the default can already be taken on a developer's
// machine (a stray Docker binding, another project). CI leaves it unset.
const PORT = Number(process.env["PLAYWRIGHT_PORT"] ?? 3000);
const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? `http://localhost:${String(PORT)}`;

export default defineConfig({
  testDir: "./e2e",
  // Keeps Playwright specs distinct from the Vitest unit specs in src/.
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 2 : 0,
  // Spread rather than `workers: undefined` — `exactOptionalPropertyTypes`
  // treats an explicit undefined as a different thing from an absent key.
  ...(process.env["CI"] ? { workers: 1 } : {}),
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Most parents reach this site on a phone (agent_plan §6.6).
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm start --port ${String(PORT)}`,
    url: baseURL,
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
  },
});
