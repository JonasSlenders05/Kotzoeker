// apps/web/playwright.config.ts
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Lokaal dezelfde variabelen als `pnpm dev`. In CI bestaat dit bestand niet en komen ze uit de job.
dotenv.config({ path: ".env.local", quiet: true });

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "kotbaas",
      testMatch: /kotbaas\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/kotbaas.json",
      },
      dependencies: ["setup"],
    },
    { name: "rls", testMatch: /rls\.spec\.ts/ }, // geen browser nodig, enkel supabase-js
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
