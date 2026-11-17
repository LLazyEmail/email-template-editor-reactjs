---
name: testing
description: "Write and fix tests for the email template editor. Use when adding Vitest unit tests, Playwright e2e tests, or debugging a failing test."
---

# Testing

## Unit tests (Vitest)

- Config: `vitest.config.mts`. Setup: `src/setupTests.ts`.
- Mock `src/api/main` completely. Never hit the network.
- Ant Design needs `window.matchMedia`. The setup file already polyfills it.
- Assert on visible text (`getByText`, `findByText`), not internals.

```ts
// Mock every function the component under test (and its children) imports.
vi.mock("@/api/main", () => ({
  getTree: vi.fn(() => Promise.resolve([])),
  saveTree: vi.fn(() => Promise.resolve({})),
  generate: vi.fn(() => Promise.resolve("")),
  getAllElements: vi.fn(() => Promise.resolve([])),
  addElement: vi.fn(() => Promise.resolve({})),
  updateElement: vi.fn(() => Promise.resolve({})),
  deleteElement: vi.fn(() => Promise.resolve({})),
  addTreeNode: vi.fn(() => Promise.resolve({})),
  updateTreeNode: vi.fn(() => Promise.resolve({})),
  deleteTreeNode: vi.fn(() => Promise.resolve({})),
}));
```

- Tests live next to the code (`Foo.test.tsx` beside `Foo.tsx`). Examples: `src/editor/Main/Main.test.tsx`, `src/editor/Main/Chat/ChatPanel.test.tsx`.
- AI agent tests: use `MockLanguageModelV4` from `ai/test` instead of a real provider (see `src/ai/agent.test.ts`).

Run: `npm test`

## E2E (Playwright)

- Config: `playwright.config.ts`. Specs: `e2e/`.
- Intercept `/tree` and `/elements` with `page.route` so tests do not need the backend.
- Mock AI providers with `page.route` too (see `e2e/ai-assistant.spec.ts`), and check the key never reaches our backend.
- `e2e/csp.spec.ts` guards the Content-Security-Policy; update it when adding an origin.
- Run: `npm run test:e2e`

## Checklist

- [ ] New behavior has a test
- [ ] API is mocked
- [ ] `npm test` passes
