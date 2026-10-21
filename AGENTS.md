# AI Agent Guide — email-template-editor-reactjs

> **Audience:** Other AI coding agents (Cursor, Copilot, Claude, Grok, etc.) working on this repository.
> **Purpose:** Give agents enough context to make safe, consistent changes without rediscovering the project layout or conventions.

## Project overview

This is a **visual email template editor** built with React. Users build a tree of email elements, edit them, and generate HTML templates. The frontend talks to a separate backend API (default port `9000`).

**Current stack (after migration PR #15):**
- Next.js 14 (App Router)
- React 18
- Ant Design 5
- Axios for API calls
- TypeScript
- Vitest + Testing Library for tests

**Note:** The default branch may still be on Create React App until PR #15 is merged. Prefer working on the migration branch or after merge.

## Directory map

```
app/                          # Next.js App Router entry
  layout.tsx                  # Root layout (imports Ant Design reset + global CSS)
  page.tsx                    # Home page → renders <Main />

src/
  api/
    main.ts                   # Axios API client (getTree, saveTree, generate, elements CRUD)
    main.types.ts             # Request/response types
  pages/Main/                 # Main editor UI (client components)
    Main.tsx                  # Root editor screen
    Elements/                 # Element list + add/edit modals
    TemplateTree/             # Tree view + context-menu actions
    AddRootElementForm/       # Form to create the root node
  types/                      # Shared types (e.g. TemplateTree)
  App.tsx                     # Legacy app root (still used by tests)
  index.css                   # Global styles

.github/workflows/ci.yml      # CI: Node 18/20/22, test + build
Dockerfile                    # Node 20, next build + next start (port 3000)
vitest.config.ts              # Vitest config (jsdom, setup file, path alias)
next.config.js
tsconfig.json                 # Paths: @/* → ./src/*
```

## Important conventions

### Client vs server components
- Anything that uses hooks, Ant Design, `window`, or browser APIs must be a **client component**.
- Add `"use client";` at the top of the file.
- Currently marked client: `Main.tsx`, `Elements.tsx`, `TemplateTree.tsx`.
- New interactive UI under `src/pages/Main/**` should also be client components.

### API client (`src/api/main.ts`)
- Default backend: `http://localhost:9000`.
- Override with `NEXT_PUBLIC_API_URL`.
- The URL helper avoids touching `document` during SSR.
- Do not import this module from pure server components without care.

### Styling
- Ant Design 5 (`antd`). Reset CSS is imported in `app/layout.tsx`.
- Prefer Ant Design components over custom CSS when possible.
- Global styles live in `src/index.css`.

### Tests
- Runner: **Vitest** (`npm test` / `npm run test:watch`).
- Config: `vitest.config.ts`.
- Setup: `src/setupTests.ts` (jest-dom matchers + cleanup).
- Mock API calls with `vi.mock` so tests do not hit the network.
- Example: `src/App.test.tsx`.

### TypeScript
- Strict mode is on.
- Path alias `@/*` maps to `src/*`.
- Prefer explicit types from `src/api/main.types.ts` and `src/types`.

## Common tasks

### Add a new UI section
1. Create a component under `src/pages/Main/` (or a subfolder).
2. Add `"use client";` if it uses hooks/state/antd.
3. Import and render it from `Main.tsx`.
4. Add or update a Vitest smoke/interaction test if the change is user-facing.

### Change an API call
1. Update the function in `src/api/main.ts`.
2. Update types in `src/api/main.types.ts` if the payload/response changes.
3. Update any callers in `Main.tsx`, `Elements.tsx`, or `TemplateTree.tsx`.
4. Keep the mock in tests in sync.

### Run locally
```bash
npm install
npm run dev          # http://localhost:3000
npm test
npm run build
```

### Docker
```bash
docker build -t email-template-editor .
docker run -p 3000:3000 email-template-editor
```

## CI
- Workflow: `.github/workflows/ci.yml`
- Triggers: push and pull requests to `master`
- Matrix: Node 18, 20, 22
- Steps: install → test → build
- Failures block merge. Keep the workflow green.

## Things to avoid

- Do not reintroduce Create React App (`react-scripts`) once the migration is merged.
- Do not use `document` or `window` at module scope in files that may be imported during SSR.
- Do not call the real backend from unit tests.
- Avoid large drive-by refactors in the same PR as a feature or bug fix.
- Prefer small, focused commits with clear messages.

## Suggested workflow for agents

1. Read this file and the relevant source files before editing.
2. Create a feature branch from `master` (or the current migration branch if not yet merged).
3. Make the change, keeping client/server boundaries in mind.
4. Update or add a Vitest test when behavior changes.
5. Open a PR with a short human summary of what changed and why.
6. Ensure CI passes on the Node matrix.

## Related

- Backend is a separate service (not in this repo). Frontend expects endpoints such as:
  - `GET /template-tree`
  - `POST /save-template-tree`
  - `POST /generate`
  - Element CRUD under `/all-elements`, `/add-element`, `/element`, `/delete-element/:key`
- Migration context: PR #15 (Create React App → Next.js + Vitest).
