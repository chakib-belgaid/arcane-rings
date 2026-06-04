import { defineConfig, devices } from "@playwright/test";

const fixtureMode = process.env.PROJECT_CIRCLES_FIXTURE === "1";
const appBaseURL = "http://127.0.0.1:4173";
const fixtureBaseURL = "http://127.0.0.1:4175";

export default defineConfig({
  testDir: ".",
  testMatch: fixtureMode
    ? ["tests/e2e/project-circles*.spec.ts"]
    : ["tests/playwright/**/*.pw.ts", "tests/e2e/menu-hud-overlays.pw.ts", "e2e/**/*.pw.ts"],
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: fixtureMode ? fixtureBaseURL : appBaseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry"
  },
  webServer: {
    command: fixtureMode
      ? "bun run fixture:dev"
      : "bun run build && bunx vite preview --host 127.0.0.1 --port 4173",
    url: fixtureMode ? fixtureBaseURL : appBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } }
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 393, height: 852 } }
    }
  ]
});
