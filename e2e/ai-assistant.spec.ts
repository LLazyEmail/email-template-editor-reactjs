import { test, expect, type Request } from "@playwright/test";

const API_KEY = "test-gemini-key";

const tree = [{ key: "1", title: "root", value: "<table>{{content}}</table>", children: [] }];

const geminiResponse = (parts: unknown[]) => ({
  candidates: [{ content: { role: "model", parts }, finishReason: "STOP" }],
  usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
});

test("assistant adds a node with the user's own Gemini key", async ({ page }) => {
  const backendRequests: Request[] = [];
  const geminiKeys: (string | null)[] = [];
  let addedNode: unknown = null;

  await page.route("**/tree", (route) => {
    backendRequests.push(route.request());
    return route.fulfill({ json: tree });
  });
  await page.route("**/elements", (route) => {
    backendRequests.push(route.request());
    return route.fulfill({ json: [] });
  });
  await page.route("**/tree/nodes", (route) => {
    backendRequests.push(route.request());
    addedNode = route.request().postDataJSON();
    return route.fulfill({ status: 201, json: {} });
  });

  // First call: the model asks to add a node. Second call: it confirms in text.
  await page.route("https://generativelanguage.googleapis.com/**", (route) => {
    geminiKeys.push(route.request().headers()["x-goog-api-key"] ?? null);
    const body =
      geminiKeys.length === 1
        ? geminiResponse([
            {
              functionCall: {
                name: "add_html_node",
                args: { parentKey: "1", title: "{{content}}", value: "<p>Welcome</p>" },
              },
            },
          ])
        : geminiResponse([{ text: "Added a Welcome paragraph." }]);
    return route.fulfill({ json: body });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "AI assistant" }).click();
  await page.getByRole("button", { name: "Add key" }).click();
  await page.getByLabel("API key").fill(API_KEY);
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByLabel("Message").fill("Add a Welcome paragraph under the root");
  await page.getByLabel("Message").press("Enter");

  await expect(page.getByText("Added a Welcome paragraph.")).toBeVisible();
  await expect(page.getByText(/✓ Added "\{\{content\}\}"/)).toBeVisible();

  expect(addedNode).toMatchObject({
    parentKey: "1",
    item: { title: "{{content}}", value: "<p>Welcome</p>" },
  });
  expect(geminiKeys).toEqual([API_KEY, API_KEY]);
  // The key goes to the provider only, never to the editor's backend.
  for (const request of backendRequests) {
    expect(JSON.stringify(request.headers())).not.toContain(API_KEY);
    expect(request.postData() ?? "").not.toContain(API_KEY);
  }
});
