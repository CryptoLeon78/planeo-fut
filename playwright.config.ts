import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    viewport: { width: 1280, height: 1800 },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "bun run dev", url: "http://localhost:8080", reuseExistingServer: true },
});