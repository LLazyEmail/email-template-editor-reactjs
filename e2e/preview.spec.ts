import { test, expect } from "@playwright/test";

// 1×1 transparent PNG.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

const tree = [
  {
    title: "root",
    key: "1",
    value:
      '<html><body><img id="logo" src="https://images.example/logo.png" alt="Logo">{{content}}' +
      "<script>parent.__pwned = true</script></body></html>",
    children: [{ title: "{{content}}", key: "2", value: "<h1>Weekly recipes</h1>", children: [] }],
  },
];

test("the preview renders the tree, loads remote images and runs no scripts", async ({ page }) => {
  let imageRequested = false;
  await page.route("**/tree", (route) => route.fulfill({ json: tree }));
  await page.route("**/elements", (route) => route.fulfill({ json: [] }));
  await page.route("https://images.example/**", (route) => {
    imageRequested = true;
    return route.fulfill({ contentType: "image/png", body: PIXEL });
  });

  await page.goto("/");

  const preview = page.frameLocator('iframe[title="Email preview"]');
  await expect(preview.getByRole("heading", { name: "Weekly recipes" })).toBeVisible();

  // The page CSP (inherited by the srcdoc iframe) lets the email's https images through.
  await expect
    .poll(() => preview.locator("#logo").evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBe(1);
  expect(imageRequested).toBe(true);

  // The sandbox keeps the email's scripts from running at all.
  expect(await page.evaluate(() => (window as { __pwned?: boolean }).__pwned)).toBeUndefined();
});
