import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * End-to-end tests run against a production build with a fresh database and the auth bypass on.
 * Specs share one database, so they run serially and each creates the users it needs.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `rm -f data/e2e.db data/e2e.db-wal data/e2e.db-shm && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_PATH: "data/e2e.db",
      AUTH_BYPASS: "true",
      BOT_MIN_FILL_MS: "0",
      SITE_URL: `http://localhost:${PORT}`,
      CRON_SECRET: "e2e-cron-secret",
    },
  },
});
