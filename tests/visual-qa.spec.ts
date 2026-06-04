import { test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

test.skip(process.env.VISUAL_QA !== "1", "Run with VISUAL_QA=1 to capture visual QA screenshots.");

const outDir = path.resolve("test-results/visual-qa");

test("captures menu and game states for visual QA", async ({ page }) => {
  await mkdir(outDir, { recursive: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: path.join(outDir, "menu-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "game-mobile.png"), fullPage: true });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.screenshot({ path: path.join(outDir, "menu-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "game-desktop.png"), fullPage: true });
});
