import { expect, type Locator, type Page } from "@playwright/test";

export type RingDragOptions = {
  ringIndex: number;
  ticks: number;
  steps?: number;
};

export async function startSeededLevel(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Arcane Rings" })).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();
  await page.getByRole("button", { name: "Start seeded level" }).click();
  await expect(page.getByTestId("puzzle-screen")).toBeVisible();
}

export async function startGeneratedLevel(page: Page, seed: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();
  await page.getByLabel("Generator seed").fill(seed);
  await page.getByRole("button", { name: "Generate level from seed" }).click();
  await expect(page.getByTestId("puzzle-screen")).toBeVisible();
  await expect(page.getByTestId("level-seed")).toHaveText(seed);
}

export async function dragRing(page: Page, options: RingDragOptions) {
  const canvas = page.getByTestId("ring-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("ring canvas is not visible");

  const ringCount = Number(await canvas.getAttribute("data-ring-count"));
  const q = Number(await canvas.getAttribute("data-ticks"));
  const radius = (Math.min(box.width, box.height) / 2) * ((options.ringIndex + 0.5) / ringCount);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + options.ticks * ((2 * Math.PI) / q);

  await page.mouse.move(centerX + Math.cos(startAngle) * radius, centerY + Math.sin(startAngle) * radius);
  await page.mouse.down();
  await page.mouse.move(centerX + Math.cos(endAngle) * radius, centerY + Math.sin(endAngle) * radius, {
    steps: options.steps ?? 8
  });
  await page.mouse.up();
}

export async function previewRingDrag(page: Page, options: RingDragOptions) {
  const canvas = page.getByTestId("ring-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("ring canvas is not visible");

  const ringCount = Number(await canvas.getAttribute("data-ring-count"));
  const q = Number(await canvas.getAttribute("data-ticks"));
  const radius = (Math.min(box.width, box.height) / 2) * ((options.ringIndex + 0.5) / ringCount);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + options.ticks * ((2 * Math.PI) / q);

  await page.mouse.move(centerX + Math.cos(startAngle) * radius, centerY + Math.sin(startAngle) * radius);
  await page.mouse.down();
  await page.mouse.move(centerX + Math.cos(endAngle) * radius, centerY + Math.sin(endAngle) * radius, {
    steps: options.steps ?? 8
  });
}

export async function finishPreviewDrag(page: Page) {
  await page.mouse.up();
}

export async function expectCanvasNonBlank(canvas: Locator) {
  const nonBlank = await canvas.evaluate((node) => {
    const canvasNode = node as HTMLCanvasElement;
    const context = canvasNode.getContext("2d");
    if (!context) return false;
    const pixels = context.getImageData(0, 0, canvasNode.width, canvasNode.height).data;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) return true;
    }
    return false;
  });

  expect(nonBlank).toBe(true);
}

export async function expectPlayfieldClearOnMobile(page: Page) {
  const canvas = page.getByTestId("ring-canvas");
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error("ring canvas is not visible");

  const protectedZones = [
    {
      name: "center",
      x: canvasBox.x + canvasBox.width * 0.35,
      y: canvasBox.y + canvasBox.height * 0.35,
      width: canvasBox.width * 0.3,
      height: canvasBox.height * 0.3
    },
    {
      name: "lower-middle",
      x: canvasBox.x + canvasBox.width * 0.25,
      y: canvasBox.y + canvasBox.height * 0.58,
      width: canvasBox.width * 0.5,
      height: canvasBox.height * 0.2
    }
  ];

  const chromeSelectors = [
    "[data-testid='hud']",
    "[data-testid='side-actions']",
    "[data-testid='hint-panel']"
  ];

  for (const selector of chromeSelectors) {
    const element = page.locator(selector);
    if (!(await element.isVisible())) continue;
    const box = await element.boundingBox();
    if (!box) continue;

    for (const zone of protectedZones) {
      expect(overlaps(box, zone), `${selector} overlaps protected ${zone.name} playfield zone`).toBe(false);
    }
  }
}

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
