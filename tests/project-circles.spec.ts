import { expect, test, type Page } from "@playwright/test";

const ringRadii = [0.18, 0.34, 0.52, 0.72, 1];

test("launches the Enchanted Grove menu and starts the seeded puzzle", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Project Circles")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();

  await expect(page.getByLabel("Puzzle playfield")).toBeVisible();
  await expect(page.getByText("Moves", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Ticks", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Time", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Open coupling map" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Map", exact: true })).toHaveCount(0);
  await expect(page.locator(".pause-button")).toHaveCount(0);
  await expect(page.locator(".puzzle-action-dock svg")).toHaveCount(0);
  await expect(page.locator(".puzzle-action-dock img.raster-icon")).toHaveCount(5);

  const referenceButton = await page.getByRole("button", { name: "Open reference image" }).boundingBox();
  const referenceIcon = await page.locator(".reference-button img.raster-icon").boundingBox();
  expect(referenceButton).not.toBeNull();
  expect(referenceIcon).not.toBeNull();
  expect(referenceIcon!.width).toBeGreaterThan(50);
  expect(Math.abs(referenceIcon!.x + referenceIcon!.width / 2 - (referenceButton!.x + referenceButton!.width / 2))).toBeLessThan(3);

  await page.getByRole("button", { name: "Open reference image" }).click();
  const referenceDialog = page.getByRole("dialog", { name: "Reference" });
  await expect(referenceDialog).toBeVisible();
  await expect(referenceDialog.getByRole("img", { name: /reference image/i })).toBeVisible();
  await expect(referenceDialog.locator("button[aria-label='Close'] img.raster-icon")).toHaveCount(1);
  const dialogBox = await referenceDialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.width).toBeGreaterThan(referenceButton!.width * 2);
  expect(dialogBox!.height).toBeGreaterThan(700);
  await page.keyboard.press("Escape");
  await expect(referenceDialog).toBeHidden();
});

test("rotates a ring, undoes it, and gates input while hint is open", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();

  await rotateRing(page, 0, 1);
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();

  await page.getByRole("button", { name: "Hint" }).click();
  const hint = page.getByRole("dialog", { name: "Hint" });
  await expect(hint).toBeVisible();
  await expect(page.getByTestId("hint-coupling")).toHaveCount(1);
  await rotateRing(page, 0, 1);
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(hint).toBeHidden();
});

test("drag preview renders smoothly before a snapped tick commits", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();

  const canvas = page.locator("canvas");
  const before = await canvas.screenshot();
  const start = await ringPointAtAngle(page, 2, 0);
  const end = await ringPointAtAngle(page, 2, (Math.PI * 2 * 0.35) / 8);

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });

  const during = await canvas.screenshot();
  expect(during.equals(before)).toBe(false);
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();

  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
});

test("solves the known seeded level and shows the win screen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();

  await rotateRing(page, 0, 1);
  await rotateRing(page, 1, 5);
  await rotateRing(page, 2, 2);
  await rotateRing(page, 3, 3);

  await expect(page.getByRole("dialog", { name: "Restored" })).toBeVisible();
  const dialog = page.getByRole("dialog", { name: "Restored" });
  await expect(dialog.getByText("Moves")).toBeVisible();
  await expect(dialog.getByText("Optimal")).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
});

test("keeps the mobile HUD compact around the playfield", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();

  const canvas = await page.locator("canvas").boundingBox();
  const status = await page.locator(".puzzle-status").boundingBox();
  const dock = await page.getByTestId("puzzle-action-dock").boundingBox();
  const reference = await page.getByRole("button", { name: "Open reference image" }).boundingBox();
  const settings = await page.getByRole("button", { name: "Settings" }).boundingBox();

  expect(canvas).not.toBeNull();
  expect(status).not.toBeNull();
  expect(dock).not.toBeNull();
  expect(reference).not.toBeNull();
  expect(settings).not.toBeNull();
  expect(status!.y + status!.height).toBeLessThan(canvas!.y);
  expect(dock!.y).toBeGreaterThan(canvas!.y + canvas!.height);
  expect(reference!.y).toBeGreaterThan(dock!.y);
  expect(settings!.y).toBeGreaterThan(dock!.y);
  expect(dock!.height).toBeLessThanOrEqual(100);
});

async function rotateRing(page: Page, ringIndex: number, ticks: number) {
  const count = Math.abs(ticks);
  const key = ticks >= 0 ? "ArrowRight" : "ArrowLeft";

  for (let index = 0; index < count; index += 1) {
    const point = await ringPoint(page, ringIndex);
    await page.mouse.click(point.x, point.y);
    await page.keyboard.press(key);
  }
}

async function ringPointAtAngle(page: Page, ringIndex: number, angle: number) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) {
    throw new Error("Canvas bounding box is unavailable.");
  }

  const outer = ringRadii[ringIndex];
  const inner = ringRadii[ringIndex - 1] ?? 0;
  const radius = Math.min(box.width, box.height) * 0.455;
  const midRatio = (outer + inner) / 2;

  return {
    x: box.x + box.width / 2 + Math.cos(angle) * radius * midRatio,
    y: box.y + box.height / 2 + Math.sin(angle) * radius * midRatio
  };
}

async function ringPoint(page: Page, ringIndex: number) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) {
    throw new Error("Canvas bounding box is unavailable.");
  }

  const outer = ringRadii[ringIndex];
  const inner = ringRadii[ringIndex - 1] ?? 0;
  const radius = Math.min(box.width, box.height) * 0.455;
  const midRatio = (outer + inner) / 2;

  return {
    x: box.x + box.width / 2 + radius * midRatio,
    y: box.y + box.height / 2
  };
}
