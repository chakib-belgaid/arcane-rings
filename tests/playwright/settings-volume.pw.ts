import { expect, test } from "@playwright/test";

test("settings volume control uses generated assets and remains usable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();

  const volume = page.getByLabel("Volume");
  await expect(volume).toBeVisible();
  await expect(volume).toHaveValue("100");

  const assetStatus = await page.evaluate(async () => ({
    rail: await fetch("/assets/ui/volume-rail.png").then((response) => response.ok),
    thumb: await fetch("/assets/ui/volume-thumb.png").then((response) => response.ok),
  }));
  expect(assetStatus).toEqual({ rail: true, thumb: true });

  await volume.focus();
  for (let step = 0; step < 7; step += 1) {
    await volume.press("ArrowLeft");
    await expect(volume).toHaveValue(String(100 - (step + 1) * 5));
  }

  await expect(volume).toHaveValue("65");
  await expect(page.locator(".volume-row__value")).toHaveText("65%");

  const layout = await page.evaluate(() => {
    const row = document.querySelector(".volume-row");
    const rail = document.querySelector(".volume-control__rail");
    const input = document.querySelector(".volume-control__input");
    if (!row || !rail || !input) {
      return null;
    }

    const rowRect = row.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    return {
      bodyOverflows: document.body.scrollWidth > window.innerWidth,
      railBackground: getComputedStyle(rail).backgroundImage,
      rowLeft: rowRect.left,
      rowRight: rowRect.right,
      inputWidth: inputRect.width,
      inputHeight: inputRect.height,
      viewportWidth: window.innerWidth,
    };
  });

  expect(layout).not.toBeNull();
  expect(layout!.bodyOverflows).toBe(false);
  expect(layout!.railBackground).toContain("volume-rail.png");
  expect(layout!.rowLeft).toBeGreaterThanOrEqual(0);
  expect(layout!.rowRight).toBeLessThanOrEqual(layout!.viewportWidth);
  expect(layout!.inputWidth).toBeGreaterThan(160);
  expect(layout!.inputHeight).toBeGreaterThanOrEqual(44);
});
