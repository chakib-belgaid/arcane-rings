import { test } from "@playwright/test";
import { expectPlayfieldClearOnMobile, startSeededLevel } from "./helpers/projectCircles";

test("mobile viewport keeps puzzle center and lower-middle playfield clear", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startSeededLevel(page);
  await expectPlayfieldClearOnMobile(page);
});
