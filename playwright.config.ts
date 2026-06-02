import { defineConfig, devices } from "@playwright/test";

const fixtureMode = process.env.PROJECT_CIRCLES_FIXTURE === "1";
const appBaseURL = "http://127.0.0.1:4173";
const fixtureBaseURL = "http://127.0.0.1:4175";

export default defineConfig({
  testDir: ".",
  testMatch: fixtureMode
    ? ["tests/e2e/project-circles*.spec.ts"]
    : ["tests/playwright/**/*.pw.ts", "tests/e2e/menu-hud-overlays.pw.ts", "e2e/**/*.pw.ts"],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: fixtureMode ? fixtureBaseURL : appBaseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: fixtureMode
      ? "/opt/homebrew/bin/bun run fixture:dev"
      : "/opt/homebrew/bin/bun run build && /opt/homebrew/bin/bunx vite preview --host 127.0.0.1 --port 4173",
    url: fixtureMode ? fixtureBaseURL : appBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 393, height: 852 } },
    },
  ],
});
