import { expect, test } from "@playwright/test";
import {
  dragRing,
  expectCanvasNonBlank,
  finishPreviewDrag,
  previewRingDrag,
  startGeneratedLevel,
  startSeededLevel
} from "./helpers/projectCircles";

test("first-load menu starts seeded and generated levels", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Project Circles" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Daily puzzle" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Difficulty selection" })).toBeVisible();

  await page.getByRole("button", { name: "Play" }).click();
  await page.getByRole("button", { name: "Start seeded level" }).click();
  await expect(page.getByTestId("puzzle-screen")).toBeVisible();
  await expect(page.getByTestId("level-seed")).toHaveText("acceptance-seed");
  await expectCanvasNonBlank(page.getByTestId("ring-canvas"));

  await page.getByRole("button", { name: "Menu" }).click();
  await startGeneratedLevel(page, "generated-42");
  await expect(page.getByTestId("difficulty-badge")).toHaveText("easy");
});

test("pointer drag previews affected rings before committing a rotation", async ({ page }) => {
  await startSeededLevel(page);

  const beforeOffsets = await page.getByTestId("offsets").textContent();
  await previewRingDrag(page, { ringIndex: 0, ticks: 1 });

  await expect(page.getByTestId("selected-ring")).toHaveText("Ring 1");
  await expect(page.getByTestId("preview-ticks")).toHaveText("1");
  await expect(page.getByTestId("affected-rings")).toHaveText("R1, R2");
  await expect(page.getByTestId("offsets")).toHaveText(beforeOffsets ?? "");

  await finishPreviewDrag(page);
  await expect(page.getByTestId("offsets")).not.toHaveText(beforeOffsets ?? "");
  await expect(page.getByTestId("move-count")).toHaveText("1");
});

test("undo restores the previous visual state without adding player cost", async ({ page }) => {
  await startSeededLevel(page);

  const initialOffsets = await page.getByTestId("offsets").textContent();
  await dragRing(page, { ringIndex: 1, ticks: 2 });
  await expect(page.getByTestId("move-count")).toHaveText("2");
  await expect(page.getByTestId("offsets")).not.toHaveText(initialOffsets ?? "");

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByTestId("offsets")).toHaveText(initialOffsets ?? "");
  await expect(page.getByTestId("move-count")).toHaveText("0");
});

test("hint button advances through light, medium, and strong layers", async ({ page }) => {
  await startSeededLevel(page);

  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.getByTestId("hint-panel")).toContainText("Focus Ring 3");

  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.getByTestId("hint-panel")).toContainText("Ring 3 still needs adjustment");

  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.getByTestId("hint-panel")).toContainText("Ring 3 counterclockwise 3 ticks");
});

test("coupling map gates puzzle input until closed", async ({ page }) => {
  await startSeededLevel(page);

  const beforeOffsets = await page.getByTestId("offsets").textContent();
  await page.getByRole("button", { name: "Coupling map" }).click();
  await expect(page.getByRole("dialog", { name: "Coupling map" })).toBeVisible();
  await expect(page.getByText("Ring 1 -> Ring 2 x1")).toBeVisible();

  await dragRing(page, { ringIndex: 0, ticks: 1 });
  await expect(page.getByTestId("offsets")).toHaveText(beforeOffsets ?? "");
  await expect(page.getByTestId("preview-ticks")).toHaveText("0");

  await page.getByRole("button", { name: "Close coupling map" }).click();
  await dragRing(page, { ringIndex: 0, ticks: 1 });
  await expect(page.getByTestId("offsets")).not.toHaveText(beforeOffsets ?? "");
});

test("known seeded level can be completed and shows win details", async ({ page }) => {
  await startSeededLevel(page);

  await dragRing(page, { ringIndex: 0, ticks: 1 });
  await dragRing(page, { ringIndex: 1, ticks: -2 });
  await dragRing(page, { ringIndex: 2, ticks: -3 });
  await dragRing(page, { ringIndex: 3, ticks: 1 });

  await expect(page.getByRole("dialog", { name: "Level complete" })).toBeVisible();
  await expect(page.getByTestId("win-stars")).toHaveText("3 stars");
  await expect(page.getByTestId("win-move-count")).toHaveText("7 player ticks");
  await expect(page.getByTestId("win-optimal-cost")).toHaveText("7 optimal ticks");
  await expect(page.getByTestId("win-hints")).toHaveText("0 hints used");
  await expect(page.getByRole("button", { name: "Next level" })).toBeVisible();
});
