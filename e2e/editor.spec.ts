import { test, expect, type Page } from "@playwright/test";

/** A click before React hydrates is lost. The chat input renders on the client only. */
const waitForHydration = (page: Page) => expect(page.getByLabel("Message")).toBeVisible();

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
  await waitForHydration(page);
  await page.getByRole("button", { name: /add root element/i }).click();
  await expect(page.getByText(/add root element/i).nth(1)).toBeVisible();
});

test("the assistant is always on screen and manual editing is collapsed", async ({ page }) => {
  await page.route("**/tree", (route) =>
    route.fulfill({ json: [{ key: "1", title: "root", value: "<p>Hi</p>", children: [] }] }),
  );
  await page.goto("/");

  await expect(page.getByRole("complementary", { name: "AI assistant" })).toBeVisible();
  await expect(page.getByLabel("Message")).toBeVisible();

  // The tree is not shown until its panel is opened.
  await expect(page.getByText("root", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Template tree" }).click();
  await expect(page.getByText("root", { exact: true })).toBeVisible();
});

test("the sidebar links the editor, marks templates as coming soon and keeps the dark theme", async ({
  page,
}) => {
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link", { name: "Editor" })).toBeVisible();
  const templates = nav.getByRole("menuitem", { name: /Templates/ });
  await expect(templates).toHaveAttribute("aria-disabled", "true");
  await expect(templates).toContainText("Coming soon");

  const toggle = page.getByRole("banner").getByRole("button", { name: "Dark theme" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await waitForHydration(page);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});
