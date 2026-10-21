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

1. **Load tree:** `Main` calls `getTree()` → `GET /template-tree`.
2. **Add root:** User submits `AddRootElementForm` → `saveTree({ treeData })` → `POST /save-template-tree`.
3. **Edit tree nodes:** Context menu in `TemplateTree` → `updateTreeNode` / `addTreeNode` / `deleteTreeNode`.
4. **Manage elements:** `Elements` list → `getAllElements` / `addElement` / `updateElement` / `deleteElement`.
5. **Generate:** Button calls `generate()` → `POST /generate` → returns a link that can be opened.

## File responsibilities

| File | Role |
|------|------|
| `app/layout.tsx` | HTML shell, metadata, global CSS imports |
| `app/page.tsx` | Renders the editor |
| `src/pages/Main/Main.tsx` | Top-level state and actions |
| `src/pages/Main/TemplateTree/TemplateTree.tsx` | Tree UI + add/edit/delete node modals |
| `src/pages/Main/Elements/Elements.tsx` | Element library UI |
| `src/api/main.ts` | All HTTP calls |
| `src/api/main.types.ts` | Shared request types |
| `src/types/index.ts` | `TemplateTree` type |

## Conventions agents should follow

- **Small PRs.** One concern per pull request.
- **Human-readable PR body.** What changed, why, and how to verify.
- **Client components.** Any new interactive component under `src/pages/Main` needs `"use client"`.
- **Tests.** Prefer Vitest. Mock the API module. Assert on user-visible text or behavior.
- **No network in unit tests.** Always mock `src/api/main`.
- **Environment.** Use `NEXT_PUBLIC_API_URL` for the backend base URL when it needs to differ from the default.

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

## Migration status

- **PR #15** migrates the project from Create React App to Next.js + Vitest.
- Until it is merged, the default branch still uses CRA (`react-scripts`).
- After merge, ignore CRA-specific patterns (eject, `react-scripts`, Jest config in `package.json`).

## When in doubt

1. Read `AGENTS.md` and the file you are about to edit.
2. Match existing naming and Ant Design usage.
3. Keep changes focused and leave a clear PR description.
