import { expect, test } from "@playwright/test";

test("planner can open the Garden Dinner demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await page.getByRole("link", { name: /Garden Dinner/ }).first().click();
  await expect(page.getByRole("heading", { name: "Garden Dinner" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate alternatives" })).toBeVisible();
  await page.getByRole("link", { name: "Flowers" }).click();
  await expect(page.getByText("Rose blush")).toBeVisible();
  await page.getByRole("link", { name: "Concept" }).click();
  await expect(page.getByText("Color placement preview")).toBeVisible();
});
