import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/template-tree", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
  await page.route("**/all-elements", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
});

test("editor home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /add root element/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /generate/i })).toBeVisible();
  await expect(page.getByText(/elements/i)).toBeVisible();
});

test("add root element opens a modal", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /add root element/i }).click();
  await expect(page.getByText(/add root element/i).nth(1)).toBeVisible();
});
