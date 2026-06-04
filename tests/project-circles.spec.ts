import { expect, test, type Page } from "@playwright/test";

const ringRadii = [0.18, 0.34, 0.52, 0.72, 1];

test("launches the Enchanted Grove menu and starts the seeded puzzle", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Project Circles")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();

  await expect(page.getByLabel("Puzzle playfield")).toBeVisible();
  await expect(page.getByText("Moves")).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Open coupling map" })).toBeVisible();
});

test("rotates a ring, undoes it, and gates input while coupling is open", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();

  await rotateRing(page, 0, 1);
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();

  await page.getByRole("button", { name: "Map", exact: true }).click();
  const coupling = page.getByRole("dialog", { name: "Coupling" });
  await expect(coupling).toBeVisible();
  await expect(coupling.getByText("Ring 1").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Coupling" })).toBeHidden();
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
  const hud = await page.locator(".hud-top").boundingBox();
  const reference = await page.getByRole("button", { name: "Toggle reference thumbnail" }).boundingBox();

  expect(canvas).not.toBeNull();
  expect(hud).not.toBeNull();
  expect(reference).not.toBeNull();
  expect(hud!.y + hud!.height).toBeLessThan(canvas!.y + 16);
  expect(reference!.y).toBeGreaterThan(canvas!.y + canvas!.height - 12);
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
