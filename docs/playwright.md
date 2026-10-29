# Playwright end-to-end tests

Issue: #19

## Goal

Run the editor in a real browser and check the main flows, without depending on the backend.

## What was added

- `@playwright/test` and `playwright.config.ts`.
- `e2e/editor.spec.ts` — home screen and the add-root modal.
- Scripts: `npm run test:e2e` and `npm run test:e2e:ui`.
- `.github/workflows/e2e.yml` — runs Playwright on pull requests and pushes to `master`.

## How the tests work

Playwright starts `npm run dev` and opens Chromium. API calls to `/template-tree` and `/all-elements` are intercepted and return empty arrays, so the suite does not need the backend on port 9000.

## Run locally

```bash
npm install
npx playwright install --with-deps chromium
npm run test:e2e
```

## CI

The `e2e.yml` workflow installs dependencies, installs Chromium, and runs `npm run test:e2e`.
