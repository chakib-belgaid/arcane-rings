import { defineConfig, devices } from "@playwright/test";

const fixtureBaseURL = "http://127.0.0.1:4175";
const externalBaseURL = process.env.PROJECT_CIRCLES_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: externalBaseURL ?? fixtureBaseURL,
    trace: "on-first-retry"
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: "/opt/homebrew/bin/bun run fixture:dev",
        url: fixtureBaseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
      },
  projects: [
    {
      name: "chromium",
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile-chrome",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 5"] }
    }
  ]
});
