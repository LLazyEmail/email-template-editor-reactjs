# AI Agent Reference

This document complements `AGENTS.md` with a more detailed reference for agents that need deeper context.

## Architecture at a glance

```
User browser
    ↓
Next.js (App Router)  ←  this repo
    ↓
Axios client (src/api/main.ts)
    ↓
Backend API (port 9000 by default)  ←  separate service
```

The editor is a single-page experience:
- Root layout loads Ant Design reset CSS and global styles.
- Home page renders `<Main />`.
- `Main` loads the template tree on mount, shows action buttons, and embeds the tree + elements list.

## Data flow

1. **Load tree:** `Main` calls `getTree()` → `GET /tree`.
2. **Add root:** User submits `AddRootElementForm` → `saveTree({ treeData })` → `PUT /tree`.
3. **Edit tree nodes:** Context menu in `TemplateTree` → `updateTreeNode` / `addTreeNode` / `deleteTreeNode` (`PATCH` / `POST` / `DELETE` under `/tree/nodes`).
4. **Manage elements:** `Elements` list → `getAllElements` / `addElement` / `updateElement` / `deleteElement` (REST under `/elements`).
5. **Generate:** Button calls `generate()` → `POST /generate` → `{ url }`; `generate()` resolves to the link that can be opened.

## File responsibilities

| File | Role |
|------|------|
| `app/layout.tsx` | HTML shell, metadata, global CSS imports |
| `app/page.tsx` | Renders the editor |
| `src/editor/Main/Main.tsx` | Top-level state and actions |
| `src/editor/Main/TemplateTree/TemplateTree.tsx` | Tree UI + add/edit/delete node modals |
| `src/editor/Main/Elements/Elements.tsx` | Element library UI |
| `src/api/main.ts` | All HTTP calls |
| `src/api/main.types.ts` | Shared request types |
| `src/types/index.ts` | `TemplateTree` type |
| `AGENTS.md` | Agent entry point |
| `.claude/skills/` | Claude skills, including software-development best practices |

## Conventions agents should follow

- **Small PRs.** One concern per pull request.
- **Human-readable PR body.** What changed, why, and how to verify.
- **Client components.** Any new interactive component under `src/editor/Main` needs `"use client"`.
- **Tests.** Prefer Vitest. Mock the API module. Assert on user-visible text or behavior.
- **No network in unit tests.** Always mock `src/api/main`.
- **Environment.** Use `NEXT_PUBLIC_API_URL` for the backend base URL when it needs to differ from the default.
- **Best practices.** Follow `.claude/skills/software-development-best-practices/SKILL.md` when writing or reviewing code.

## Testing notes

```ts
// Example pattern used in src/App.test.tsx
vi.mock("./api/main", () => ({
  getTree: vi.fn(() => Promise.resolve([])),
  generate: vi.fn(() => Promise.resolve("")),
  saveTree: vi.fn(() => Promise.resolve({})),
}));
```

Run once: `npm test`  
Watch mode: `npm run test:watch`

## Claude skills

| Skill | Path | When to use |
| --- | --- | --- |
| Software development best practices | `.claude/skills/software-development-best-practices/` | Implementing, fixing, refactoring, reviewing, or opening PRs |

The skill includes a pre-submit checklist in `references/checklist.md`.

## When in doubt

1. Read `AGENTS.md` and the file you are about to edit.
2. Match existing naming and Ant Design usage.
3. Keep changes focused and leave a clear PR description.
4. Run the checklist in the Claude skill before submitting.

## AI assistant (`src/ai/`, `src/editor/Main/Chat/`)

A chat in a drawer that changes the template through tools. It calls the LLM **directly from the browser** with the user's own key (BYOK) via the [Vercel AI SDK](https://ai-sdk.dev). The backend is not involved and never receives the key.

```
ChatPanel ──► runAgent (generateText, max 8 steps) ──► provider (Gemini / OpenAI / Anthropic)
                 │
                 └─ tools ──► src/api/main.ts ──► backend
```

| File | Role |
|------|------|
| `src/ai/providers.ts` | Provider list, default models, `createModel()` |
| `src/ai/keyStore.ts` | Key storage: `memory` / `session` (default) / `local`; non-secret settings |
| `src/ai/tools.ts` | Tools the model can call; each wraps a function from `src/api/main.ts` |
| `src/ai/agent.ts` | System prompt and `runAgent()` |
| `src/editor/Main/TemplateTree/nodeBuilders.ts` | Node construction shared by the tree UI and the tools |
| `src/editor/Main/Chat/ChatPanel.tsx` | Chat UI, delete confirmation, stop button |
| `src/editor/Main/Chat/AiSettingsModal.tsx` | Provider, model, key, and storage choice |

Rules when changing it:

- **Render model output as text only.** No `dangerouslySetInnerHTML`, no markdown-to-HTML. The model can echo node HTML, which is untrusted, and an XSS would expose the user's key.
- **New tools** go in `src/ai/tools.ts` through `run()`, so errors reach the model as `{ ok: false, error }` and the chat log. Call `onChange` after a successful change. Destructive tools must call `confirm()` first.
- **Placeholder slots.** Generation fills the first occurrence of a child's title in the parent's HTML, so each placeholder occurrence holds one child. `add_*_node` refuses a missing or taken slot and tells the model how to fix it: insert a new placeholder with `edit_node_text`, then add the node. `get_tree` reports `freePlaceholders` and `notRendered`. Large nodes (the root is ~180 KB) are edited with `edit_node_text` and read as snippets.
- **Never send the key to our backend** or log it. `e2e/ai-assistant.spec.ts` checks this.
- **Keep `ChatPanel` lazy-loaded** (`next/dynamic` in `Main.tsx`) so the AI SDK stays out of the initial bundle.
- **Tests:** mock `src/api/main`. Use `MockLanguageModelV4` from `ai/test` for agent tests, and mock Gemini with `page.route` in e2e.

### Key storage and threat model

No browser storage protects against XSS or malicious browser extensions, so the defense is keeping the page free of XSS. The key is never stored on the server: the backend has no auth, so a stored key would be usable by anyone who can reach it. Server-side key storage only makes sense once the backend has accounts and auth.

Planned follow-ups:

- a CSP header with `connect-src` limited to the API and provider hosts;
- an optional `POST /ai/chat` proxy in the backend, if the editor becomes a public multi-user service.
