import { test, expect, type Locator } from "@playwright/test";

const tree = [
  { title: "root", key: "1", value: "<html><body>{{content}}</body></html>", children: [] },
];

/** Ant Design closes a context menu when its scroll container scrolls, so wait for layout to settle. */
async function waitUntilStill(locator: Locator) {
  await expect
    .poll(async () => {
      const before = await locator.boundingBox();
      await locator.page().waitForTimeout(250);
      const after = await locator.boundingBox();
      return before !== null && after !== null && before.y === after.y;
    })
    .toBe(true);
}

test("right-clicking a tree node opens its Add / Edit / Delete menu", async ({ page }) => {
  await page.route("**/tree", (route) => route.fulfill({ json: tree }));
  await page.route("**/elements", (route) => route.fulfill({ json: [] }));
  await page.goto("/");
  // The lazy chat panel renders only after hydration; clicking the header before that is lost.
  await expect(page.getByLabel("Message")).toBeVisible();

  await page.getByText("Template tree").click();
  // While the panel animates open it scrolls itself and its contents are still moving.
  await expect(page.locator(".ant-motion-collapse")).toHaveCount(0);
  const node = page.locator(".ant-tree").getByText("root", { exact: true });
  await node.scrollIntoViewIfNeeded();
  await waitUntilStill(node);

  // Raw mouse input: locator.click() would scroll first, and that scroll would close the menu.
  const box = (await node.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "right" });

  for (const name of ["Add", "Edit", "Delete"]) {
    await expect(page.getByRole("menuitem", { name, exact: true })).toBeVisible();
  }

  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Edit element" })).toBeVisible();
});
