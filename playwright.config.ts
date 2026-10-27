import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL, viewport: { width: 1366, height: 900 }, screenshot: "only-on-failure", trace: "retain-on-failure" },
  webServer: process.env.E2E_BASE_URL ? undefined : { command: "pnpm dev", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
