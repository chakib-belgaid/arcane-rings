import { expect, test } from "@playwright/test";

test("pointer drag previews affected rings before committing offsets", async ({ page }) => {
  await page.goto("/");

  const host = page.getByTestId("puzzle-canvas-host");
  const canvas = page.getByTestId("puzzle-canvas");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;
  const startX = cx + box!.width * 0.28;
  const startY = cy;
  const moveX = cx;
  const moveY = cy + box!.height * 0.28;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(moveX, moveY);

  await expect(host).toHaveAttribute("data-selected-ring", "1");
  await expect(host).toHaveAttribute("data-preview-ticks", "2");
  await expect(host).toHaveAttribute("data-affected-rings", "1,2");
  await expect(host).toHaveAttribute("data-offsets", "0,0,0");

  await page.mouse.up();

  await expect(host).toHaveAttribute("data-selected-ring", "");
  await expect(host).toHaveAttribute("data-preview-ticks", "0");
  await expect(host).toHaveAttribute("data-offsets", "0,2,2");
});
