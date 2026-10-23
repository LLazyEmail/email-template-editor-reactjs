---
name: testing
description: "Write and fix tests for the email template editor. Use when adding Vitest unit tests, Playwright e2e tests, or debugging a failing test."
---

# Testing

## Unit tests (Vitest)

- Config: `vitest.config.ts`. Setup: `src/setupTests.ts`.
- Mock `src/api/main` completely. Never hit the network.
- Ant Design needs `window.matchMedia`. The setup file already polyfills it.
- Assert on visible text (`getByText`, `findByText`), not internals.

```ts
vi.mock("./api/main", () => ({
  getTree: vi.fn(() => Promise.resolve([])),
  getAllElements: vi.fn(() => Promise.resolve([])),
  generate: vi.fn(() => Promise.resolve("")),
  saveTree: vi.fn(() => Promise.resolve({})),
}));
```

Run: `npm test`

## E2E (Playwright)

- Config: `playwright.config.ts`. Specs: `e2e/`.
- Intercept `/template-tree` and `/all-elements` so tests do not need the backend.
- Run: `npm run test:e2e`

## Checklist

- [ ] New behavior has a test
- [ ] API is mocked
- [ ] `npm test` passes
