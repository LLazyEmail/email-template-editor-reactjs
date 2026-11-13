import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/tree", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
  await page.route("**/elements", async (route) => {
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

test("the assistant is always on screen and manual editing is collapsed", async ({ page }) => {
  await page.route("**/tree", (route) =>
    route.fulfill({ json: [{ key: "1", title: "root", value: "<p>Hi</p>", children: [] }] })
  );
  await page.goto("/");

  await expect(page.getByRole("complementary", { name: "AI assistant" })).toBeVisible();
  await expect(page.getByLabel("Message")).toBeVisible();

  // The tree is not shown until its panel is opened.
  await expect(page.getByText("root", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Template tree" }).click();
  await expect(page.getByText("root", { exact: true })).toBeVisible();
});
