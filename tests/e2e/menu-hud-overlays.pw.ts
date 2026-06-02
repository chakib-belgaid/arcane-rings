import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

test("first-load menu flow starts a puzzle and opens overlays", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Project Circles" })).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();

  await expect(page.getByTestId("puzzle-stage")).toBeVisible();
  await expect(page.getByTestId("puzzle-hud")).toHaveClass(/hud--compact/);
  await expect(page.getByTestId("puzzle-stage")).toHaveAttribute("data-input-gated", "false");
  mkdirSync("output/playwright", { recursive: true });
  await page.screenshot({ path: `output/playwright/${testInfo.project.name}-puzzle-flow.png` });

  await page.getByRole("button", { name: "Open coupling map" }).click();
  await expect(page.getByRole("dialog", { name: "Coupling Map" })).toBeVisible();
  await expect(page.getByTestId("puzzle-stage")).toHaveAttribute("data-input-gated", "true");
  await page.getByRole("button", { name: "Close coupling map" }).click();
  await expect(page.getByTestId("puzzle-stage")).toHaveAttribute("data-input-gated", "false");

  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await expect(page.getByLabel("Reduced motion")).toBeVisible();
});

test("mobile portrait keeps the puzzle center and lower-middle clear", async ({ page, isMobile }, testInfo) => {
  test.skip(!isMobile, "mobile-only layout assertion");

  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();

  const puzzleBox = await page.getByTestId("puzzle-visual").boundingBox();
  const centerOverlay = page.getByTestId("normal-play-center-overlay");
  const hudBox = await page.getByTestId("puzzle-hud").boundingBox();

  expect(puzzleBox?.width).toBeGreaterThan(260);
  await expect(centerOverlay).toHaveCount(0);
  expect(hudBox?.height).toBeLessThan(150);
  mkdirSync("output/playwright", { recursive: true });
  await page.screenshot({ path: `output/playwright/${testInfo.project.name}-clear-playfield.png` });
});

test("win screen exposes scoring and next action", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();
  await page.getByRole("button", { name: "Complete fixture level" }).click();

  await expect(page.getByRole("dialog", { name: "Moon Gate Restored" })).toBeVisible();
  await expect(page.getByText("Player ticks 24")).toBeVisible();
  await expect(page.getByText("Optimal ticks 22")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next level" })).toBeVisible();
});

test("image collection supports generated presets and image upload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Image collection" }).click();

  await expect(page.getByRole("button", { name: "Select Moon Gate Archive" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select Solar Greenhouse Observatory" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select Neon Tidal City" })).toBeVisible();

  await page.getByRole("button", { name: "Select Solar Greenhouse Observatory" }).click();
  await page.getByRole("button", { name: "Play selected image" }).click();
  await expect(page.getByTestId("puzzle-stage")).toHaveAttribute(
    "data-image-title",
    "Solar Greenhouse Observatory",
  );

  await page.getByRole("button", { name: "Return to main menu" }).click();
  await page.getByRole("button", { name: "Image collection" }).click();
  await page.getByTestId("image-upload-input").setInputFiles({
    name: "playwright-upload.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64",
    ),
  });

  await expect(page.getByRole("button", { name: "Select playwright upload" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
