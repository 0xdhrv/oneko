import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3101",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    viewport: { width: 1280, height: 900 },
    reducedMotion: "no-preference",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm dev --port 3101",
      url: "http://localhost:3101/studio",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "node tests/browser/prepare-fixture.mjs && pnpm test:browser:fixture",
      url: "http://127.0.0.1:3102",
      reuseExistingServer: false,
    },
  ],
});
