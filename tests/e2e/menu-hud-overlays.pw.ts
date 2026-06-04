import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

type PuzzleDragOptions = {
  ringIndex: number;
  ticks: number;
};

async function dragPuzzleRing(page: Page, options: PuzzleDragOptions) {
  const canvas = page.getByTestId("puzzle-canvas");
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("Puzzle canvas is not visible");
  }

  const ringCount = Number(await canvas.getAttribute("data-ring-count"));
  const q = Number(await canvas.getAttribute("data-ticks"));
  const puzzleSize = Math.min(box.width, box.height);
  const outerRadius = puzzleSize * 0.452;
  const innerRadius = outerRadius * (options.ringIndex / ringCount) ** 0.85;
  const nextRadius = outerRadius * ((options.ringIndex + 1) / ringCount) ** 0.85;
  const radius = (innerRadius + nextRadius) / 2;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + options.ticks * ((2 * Math.PI) / q);

  await page.mouse.move(centerX + Math.cos(startAngle) * radius, centerY + Math.sin(startAngle) * radius);
  await page.mouse.down();
  await page.mouse.move(centerX + Math.cos(endAngle) * radius, centerY + Math.sin(endAngle) * radius, {
    steps: 12,
  });
  await page.mouse.up();
}

async function solvePuzzle(page: Page) {
  await dragPuzzleRing(page, { ringIndex: 0, ticks: 1 });
  await dragPuzzleRing(page, { ringIndex: 1, ticks: -2 });
  await dragPuzzleRing(page, { ringIndex: 2, ticks: -3 });
  await dragPuzzleRing(page, { ringIndex: 3, ticks: 1 });
}

test("first-load menu flow starts a puzzle and opens overlays", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Arcane Rings" })).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();

  await expect(page.getByTestId("puzzle-stage")).toBeVisible();
  await expect(page.getByTestId("puzzle-hud")).toHaveClass(/hud--compact/);
  await expect(page.getByTestId("puzzle-stage")).toHaveAttribute("data-input-gated", "false");
  await expect(page.getByRole("button", { name: "Complete fixture level" })).toHaveCount(0);
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

test("desktop solution reference enlarges on hover and opens fullscreen inspection", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop hover-only assertion");

  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();

  const stage = page.getByTestId("puzzle-stage");
  const thumb = page.getByTestId("solution-reference-thumb");
  await expect(stage).toHaveAttribute("data-input-gated", "false");
  await expect(thumb).toBeVisible();

  await thumb.hover();
  await expect
    .poll(() =>
      thumb.evaluate((element) => {
        const transform = getComputedStyle(element).transform;
        return transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;
      }),
    )
    .toBeGreaterThan(1.1);

  await thumb.click();
  const dialog = page.getByRole("dialog", { name: "Solution Reference" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("img", { name: /solution reference/i })).toBeVisible();
  await expect(stage).toHaveAttribute("data-input-gated", "true");

  const dialogBox = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(dialogBox?.width).toBeGreaterThan((viewport?.width ?? 0) * 0.9);
  expect(dialogBox?.height).toBeGreaterThan((viewport?.height ?? 0) * 0.9);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(stage).toHaveAttribute("data-input-gated", "false");
});

test("mobile tap opens the solution reference fullscreen", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only tap assertion");

  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();

  const stage = page.getByTestId("puzzle-stage");
  await page.getByTestId("solution-reference-thumb").tap();

  await expect(page.getByRole("dialog", { name: "Solution Reference" })).toBeVisible();
  await expect(page.getByRole("img", { name: /solution reference/i })).toBeVisible();
  await expect(stage).toHaveAttribute("data-input-gated", "true");

  await page.getByRole("button", { name: "Close solution reference" }).click();
  await expect(stage).toHaveAttribute("data-input-gated", "false");
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
  await page.goto("/?fixtureControls=1");
  await page.getByRole("button", { name: "Play" }).click();
  await solvePuzzle(page);

  const report = page.getByRole("dialog", { name: "Moon Gate Archive Restored" });
  await expect(report).toBeVisible();
  await expect(page.getByTestId("win-movements")).toContainText("Movements");
  await expect(page.getByTestId("win-duration")).toContainText("Duration");
  await expect(page.getByTestId("win-tick-cost")).toContainText("7 ticks");
  await expect(page.getByTestId("win-best-score")).toContainText("Best score");
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Main menu", exact: true })).toBeVisible();

  const playAgainBox = await page.getByRole("button", { name: "Play again" }).boundingBox();
  const viewport = page.viewportSize();
  expect(playAgainBox).not.toBeNull();
  expect(playAgainBox!.y + playAgainBox!.height).toBeLessThanOrEqual(viewport?.height ?? 0);
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
