# AI Agent Guide — email-template-editor-reactjs

> **Audience:** Other AI coding agents (Cursor, Copilot, Claude, Grok, etc.) working on this repository.
> **Purpose:** Give agents enough context to make safe, consistent changes without rediscovering the project layout or conventions.

## Read this first

1. This file — layout and rules.
2. [`docs/AI_AGENT.md`](docs/AI_AGENT.md) — data flow and file roles.
3. [`.claude/skills/software-development-best-practices/SKILL.md`](.claude/skills/software-development-best-practices/SKILL.md) — how to change code well.
4. [`README.md`](README.md) — product goal, problems solved, charts, screenshots.

## Project overview

This is a **visual email template editor**. Users build a tree of email elements, edit them, and generate HTML templates. The frontend talks to a separate backend API (default port `9000`).

**Stack:**
- Next.js 14 (App Router)
- React 18
- Ant Design 5
- Axios for API calls
- TypeScript
- Vitest + Testing Library for tests

## Directory map

```
app/                          # Next.js App Router entry
  layout.tsx                  # Root layout (Ant Design reset + global CSS)
  page.tsx                    # Home page → renders <Main />

src/
  api/
    main.ts                   # Axios API client
    main.types.ts             # Request/response types
  pages/Main/                 # Editor UI (client components)
    Main.tsx                  # Root editor screen
    Elements/                 # Element list + add/edit modals
    TemplateTree/             # Tree view + context-menu actions
    AddRootElementForm/       # Form to create the root node
  types/                      # Shared types (e.g. TemplateTree)
  App.tsx                     # Legacy app root (still used by tests)
  index.css                   # Global styles

.claude/skills/               # Claude skills (best practices)
docs/AI_AGENT.md              # Extended agent reference
docs/screenshots/             # UI illustrations for the README
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
- Do not call `axios` directly from UI components.

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

## Best practices (short)

- Small, focused changes. One concern per PR.
- Read the file you are about to edit.
- Keep public behavior covered by a test.
- Surface failures to the user; do not swallow errors.
- Match existing naming and patterns.
- Full checklist: `.claude/skills/software-development-best-practices/references/checklist.md`.

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

- Do not reintroduce Create React App (`react-scripts`).
- Do not use `document` or `window` at module scope in files that may be imported during SSR.
- Do not call the real backend from unit tests.
- Avoid large drive-by refactors in the same PR as a feature or bug fix.
- Prefer small, focused commits with clear messages.
- Do not commit secrets or local `.env` files.

## Suggested workflow for agents

1. Read this file and the relevant source files before editing.
2. Create a feature branch from `master`.
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
- Product description, charts, and screenshots: `README.md`.
