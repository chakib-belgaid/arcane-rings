import { expect, test } from "@playwright/test";

test("loads the seeded Project Circles app shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Project Circles" })).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();

  await expect(page.getByTestId("puzzle-stage")).toBeVisible();
  await expect(page.getByTestId("puzzle-canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open coupling map" })).toBeVisible();
  await expect(page.getByText("5R/12T")).toBeVisible();
});
