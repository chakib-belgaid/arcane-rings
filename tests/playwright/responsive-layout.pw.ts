import { expect, test, type Page } from "@playwright/test";

const viewportCases = [
  { name: "phone", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "browser", width: 1280, height: 800 },
];

test.describe("responsive layout", () => {
  for (const viewport of viewportCases) {
    test(`${viewport.name} viewport has no horizontal overflow and keeps controls usable`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      await expect(page.getByRole("heading", { name: "Project Circles" })).toBeVisible();
      await expectLayoutFitsViewport(page);
      await expectVisibleButtonsAreTouchSafe(page);

      await page.getByRole("button", { name: "Difficulty selection" }).click();
      await expect(page.getByRole("heading", { name: "Difficulty" })).toBeVisible();
      await expectLayoutFitsViewport(page);
      await expectVisibleButtonsAreTouchSafe(page);
      await page.getByRole("button", { name: "Back to menu" }).click();

      await page.getByRole("button", { name: "Image collection" }).click();
      await expect(page.getByRole("heading", { name: "Image Collection" })).toBeVisible();
      await expectLayoutFitsViewport(page);
      await expectVisibleButtonsAreTouchSafe(page);
      await page.getByRole("button", { name: "Back to menu" }).click();

      await page.getByRole("button", { name: "Play" }).click();
      await expect(page.getByTestId("puzzle-stage")).toBeVisible();
      await expectLayoutFitsViewport(page);
      await expectVisibleButtonsAreTouchSafe(page);
      await expectPuzzleChromeFitsViewport(page);
      await expectHudButtonCentersAreClickable(page);
    });
  }
});

async function expectLayoutFitsViewport(page: Page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
}

async function expectVisibleButtonsAreTouchSafe(page: Page) {
  const undersizedButtons = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons
      .map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          label: button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "unlabelled",
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((button) => button.width < 44 || button.height < 44),
  );

  expect(undersizedButtons).toEqual([]);
}

async function expectPuzzleChromeFitsViewport(page: Page) {
  const geometry = await page.evaluate(() => {
    const visual = document.querySelector("[data-testid='puzzle-visual']");
    const hud = document.querySelector("[data-testid='puzzle-hud']");
    if (!visual || !hud) {
      return null;
    }

    const visualRect = visual.getBoundingClientRect();
    const hudRect = hud.getBoundingClientRect();
    return {
      visual: {
        left: visualRect.left,
        right: visualRect.right,
        top: visualRect.top,
        bottom: visualRect.bottom,
        width: visualRect.width,
      },
      hud: {
        left: hudRect.left,
        right: hudRect.right,
        top: hudRect.top,
        bottom: hudRect.bottom,
        height: hudRect.height,
      },
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry!.visual.left).toBeGreaterThanOrEqual(0);
  expect(geometry!.visual.right).toBeLessThanOrEqual(geometry!.viewportWidth);
  expect(geometry!.hud.left).toBeGreaterThanOrEqual(0);
  expect(geometry!.hud.right).toBeLessThanOrEqual(geometry!.viewportWidth);
  expect(geometry!.hud.bottom).toBeLessThanOrEqual(geometry!.viewportHeight);
  expect(geometry!.hud.top).toBeGreaterThan(geometry!.visual.top + geometry!.visual.width * 0.62);
  expect(geometry!.hud.height).toBeLessThanOrEqual(150);
}

async function expectHudButtonCentersAreClickable(page: Page) {
  const interceptedButtons = await page.getByTestId("puzzle-hud").locator("button:visible").evaluateAll((buttons) =>
    buttons
      .map((button) => {
        const rect = button.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return {
          label: button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "unlabelled",
          intercepted: hit !== button && !button.contains(hit),
        };
      })
      .filter((button) => button.intercepted)
      .map((button) => button.label),
  );

  expect(interceptedButtons).toEqual([]);
}
