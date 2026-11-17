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

- Next.js 16 (App Router, Turbopack)
- React 19
- Ant Design 6
- Axios for API calls
- TypeScript
- Vitest + Testing Library for tests

## Directory map

```
app/                          # Next.js App Router entry
  layout.tsx                  # Root layout (Ant Design reset + global CSS)
  page.tsx                    # Home page → renders <Main />
proxy.ts                      # Per-request nonce Content-Security-Policy (Next 16 "proxy", formerly middleware)


src/
  api/
    main.ts                   # Axios API client
    main.types.ts             # Request/response types
    apiUrl.ts                 # Backend URL resolution (shared with the CSP)
  ai/                         # AI assistant (no React): providers, tools, agent loop, keyStore
  editor/Main/                 # Editor UI (client components)
    Main.tsx                  # Root editor screen
    Elements/                 # Element list + add/edit modals
    TemplateTree/             # Tree view + context-menu actions
    AddRootElementForm/       # Form to create the root node
    Chat/                     # AI assistant panel (left column) + settings (lazy-loaded)
    Preview/                  # Live email preview (sandboxed iframe) + client-side renderer
  security/                   # Content-Security-Policy builder
  types/                      # Shared types (e.g. TemplateTree)
  index.css                   # Global styles
  setupTests.ts               # Vitest setup (jest-dom, matchMedia/ResizeObserver polyfills)
e2e/                          # Playwright specs (backend and AI providers are mocked with page.route)
public/                       # favicon.ico, robots.txt

.claude/skills/               # Claude skills: best practices, testing, deployment, editor conventions, run-app
.claude/agents/               # Claude subagents: coder (logic, tests), designer (visual work)
.claude/settings.json         # Shared Claude Code settings: allowed commands, format+lint hook
.claude/hooks/                # Hook scripts (format-and-lint.sh)
.mcp.json                     # MCP servers: Next DevTools (dev-server errors/routes), Playwright (browser)
docs/AI_AGENT.md              # Extended agent reference
docs/screenshots/             # Screenshots for the README
.github/workflows/            # CI on Node 22: ci.yml (build), test.yml (Vitest), e2e.yml (Playwright)
Dockerfile                    # Node 22, next build + next start (port 3000)
vitest.config.mts             # Vitest config (jsdom, setup file, path alias)
next.config.js
tsconfig.json                 # Paths: @/* → ./src/*
```

## Important conventions

### Client vs server components

- Anything that uses hooks, Ant Design, `window`, or browser APIs must be a **client component**.
- Add `"use client";` at the top of the file.
- Currently marked client: `Main.tsx`, `Elements.tsx`, `TemplateTree.tsx`, `Preview.tsx`, `Chat/ChatPanel.tsx`, `Chat/AiSettingsModal.tsx`.
- Pages are rendered per request (`export const dynamic = "force-dynamic"` in `app/layout.tsx`) because the CSP nonce changes on every request. Do not switch to static export (`output: "export"`).
- New interactive UI under `src/editor/Main/**` should also be client components.

### API client (`src/api/main.ts`)

- Default backend: `http://localhost:9000`.
- Override with `NEXT_PUBLIC_API_URL`.
- The URL helper avoids touching `document` during SSR.
- Do not import this module from pure server components without care.
- Do not call `axios` directly from UI components.

### Styling

- Ant Design 6 (`antd`). Reset CSS is imported in `app/layout.tsx`.
- Prefer Ant Design components over custom CSS when possible.
- Global styles live in `src/index.css`.

### Tests

- Runner: **Vitest** (`npm test` / `npm run test:watch`).
- Config: `vitest.config.mts`.
- Setup: `src/setupTests.ts` (jest-dom matchers + cleanup).
- Mock API calls with `vi.mock("@/api/main", …)` so tests do not hit the network.
- Tests live next to the code (`*.test.ts(x)`). Example: `src/editor/Main/Main.test.tsx`.
- E2E: Playwright specs in `e2e/` (`npm run test:e2e`).

### Lint and format

- ESLint 9 flat config (`eslint.config.mjs`): `eslint-config-next` (core-web-vitals + typescript) plus import rules that enforce the layering below. Prettier formats everything (`.prettierrc.json`, width 100).
- `axios` is allowed only in `src/api/`. `src/ai/` and `src/api/` must not import React, antd or editor UI (`TemplateTree/nodeBuilders` is shared logic and allowed).
- Do not silence a rule to get green. If a rule is wrong for one line, use `// eslint-disable-next-line <rule> -- <reason>`.

### TypeScript

- TypeScript 6. Do not upgrade to 7 yet: `typescript-eslint` does not support it (Renovate is limited to `<7`).
- Strict mode is on.
- Path alias `@/*` maps to `src/*`.
- Prefer explicit types from `src/api/main.types.ts` and `src/types`.

## Agent tooling

- **Claude Code settings** (`.claude/settings.json`): common checks (`npm run lint|typecheck|test|build`, `git status|diff|log`) run without a prompt; `.env` files cannot be read. Personal overrides go to `.claude/settings.local.json` (git-ignored).
- **Format + lint hook**: after every Edit/Write, `.claude/hooks/format-and-lint.sh` runs Prettier and `eslint --fix` on that file. Remaining ESLint errors come back to the agent; fix them, do not disable the rule.
- **MCP servers** (`.mcp.json`):
  - `next-devtools` — talks to the running `next dev` (`/_next/mcp`): `get_errors`, `get_logs`, `get_routes`, `compile_route`. Use it to check compilation while editing instead of `npm run build`.
  - `playwright` — a headless browser to open the editor, click through a flow and take screenshots.
- **Running the app**: see the `run-app` skill (frontend :3000 + backend :9000, reuse a running dev server).
- Other agents (Cursor, Copilot, Codex) read this file; the Claude-specific parts above are optional for them.

## Best practices (short)

- Small, focused changes. One concern per PR.
- Read the file you are about to edit.
- Keep public behavior covered by a test.
- Surface failures to the user; do not swallow errors.
- Match existing naming and patterns.
- Full checklist: `.claude/skills/software-development-best-practices/references/checklist.md`.

## Common tasks

### Add a new UI section

1. Create a component under `src/editor/Main/` (or a subfolder).
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
npm run lint         # ESLint: Next.js rules + architecture import rules
npm run typecheck    # tsc --noEmit
npm run format       # Prettier
npm test
npm run build
```

### Docker

```bash
docker build -t email-template-editor .
docker run -p 3000:3000 email-template-editor
```

## CI

- Workflows: `ci.yml` (build), `test.yml` (Vitest), `e2e.yml` (Playwright) in `.github/workflows/`
- Triggers: push and pull requests to `master`
- Node: 22 (same as Dockerfile and devcontainer)
- Failures block merge. Keep the workflow green.

## Things to avoid

- Do not reintroduce Create React App (`react-scripts`).
- Do not call a new external host from the page without adding it to the CSP (`src/security/contentSecurityPolicy.ts`); the browser will block it. See `docs/AI_AGENT.md`.
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
6. Ensure CI passes (build, Vitest, Playwright).

## Related

- Backend is a separate service (not in this repo): [email-template-editor-nodejs](https://github.com/LLazyEmail/email-template-editor-nodejs). Frontend expects its REST API:
  - Tree: `GET /tree`, `PUT /tree`, `POST /tree/nodes`, `PATCH /tree/nodes/:key`, `DELETE /tree/nodes/:key`
  - Elements: `GET /elements`, `POST /elements`, `PATCH /elements/:key`, `DELETE /elements/:key`
  - `POST /generate` → `{ url }`
  - Keys in paths are URL-encoded. Errors are `{ error: { code, message, details?, requestId } }`.
- Product description, charts, and screenshots: `README.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
