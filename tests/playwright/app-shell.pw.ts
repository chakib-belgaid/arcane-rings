import { expect, test } from "@playwright/test";

test("loads the seeded Project Circles app shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Project Circles" })).toBeVisible();
  await expect(page.getByTestId("puzzle-frame")).toBeVisible();
  await expect(page.getByTestId("puzzle-canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Coupling map" })).toBeVisible();
  await expect(page.getByText("4 rings / 8 ticks")).toBeVisible();
});
