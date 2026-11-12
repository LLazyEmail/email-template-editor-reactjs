# Email Template Editor

A visual editor for building HTML email templates as a tree of blocks. Authors compose structure, reuse elements, and generate a ready-to-send template without hand-editing raw HTML.

Built with **Next.js** (App Router), **React**, **Ant Design**, and **Vitest**.

![Editor overview](docs/screenshots/editor-overview.svg)

## Goal

Give non-specialists (and developers) a reliable way to assemble email templates from reusable blocks, keep the structure consistent, and export HTML that a backend can render or store.

## Problems it solves

| Problem | How this app helps |
| --- | --- |
| Email HTML is fragile and hard to edit by hand | Structure is a tree of elements instead of a single HTML blob |
| Teams reinvent the same header/footer/CTA | Shared **Elements** library can be reused across templates |
| Design and code drift apart | Visual tree + generate step keeps the output tied to the model |
| Hard to see the hierarchy of a template | Tree view with add / edit / delete on each node |
| Generating a final file is manual | **Generate** calls the backend and returns a link to the result |

## Screenshots

### Editor in action

A template tree built from nested elements, with the **Generate** link to the rendered HTML and the Elements library below.

![Template tree and Elements library](docs/screenshots/app-tree-and-elements.png)

Editing an element: the title is the placeholder used in the tree (`{{twoBlocks}}`), the value is the HTML it expands to.

![Edit element modal](docs/screenshots/app-edit-element.png)

### Template tree

Right-click a node to add a child, edit the current node, or delete it.

![Template tree](docs/screenshots/template-tree.svg)

### Elements library

Maintain the reusable blocks that can be dropped into the tree.

![Elements panel](docs/screenshots/elements-panel.svg)

## How it works

```mermaid
flowchart LR
  User[Author] --> UI[Editor UI]
  UI --> Tree[Template tree]
  UI --> Lib[Elements library]
  UI -->|Generate| API[Backend API]
  Tree -->|load / save / update| API
  Lib -->|CRUD| API
  API --> HTML[Generated HTML]
```

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Editor
  participant API as Backend
  U->>UI: Open app
  UI->>API: GET /tree
  API-->>UI: Current tree
  U->>UI: Add / edit / delete nodes
  UI->>API: save / update / add / delete
  U->>UI: Generate
  UI->>API: POST /generate
  API-->>UI: { url } of generated HTML
  UI-->>U: Open generated template
```

## Features

- Add a root element and grow a template tree
- Context menu on each node: add, edit, delete
- Elements library with create, edit, and delete
- One-click generate that returns a link to the HTML
- AI assistant that edits the template on request (Gemini, OpenAI or Anthropic, with your own API key)
- Ant Design UI
- Talks to a separate backend (default `http://localhost:9000`, override with `NEXT_PUBLIC_API_URL`)

## Architecture

```mermaid
flowchart TB
  subgraph Frontend[This repo]
    Page[app/page.tsx]
    Main[Main.tsx]
    Tree[TemplateTree]
    Elements[Elements]
    Client[src/api/main.ts]
  end
  Page --> Main
  Main --> Tree
  Main --> Elements
  Main --> Client
  Tree --> Client
  Elements --> Client
  Client --> Backend[(Backend :9000)]
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The frontend expects a backend on port **9000**. Override the base URL with `NEXT_PUBLIC_API_URL`.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run build` | Production build |
| `npm start` | Start the production server |

### Docker

```bash
docker build -t email-template-editor .
docker run -p 3000:3000 email-template-editor
```

## AI assistant

Open **AI assistant**, choose a provider (Google Gemini, OpenAI or Anthropic), paste your own API key, and ask for changes in plain language, e.g. "add a heading that says Welcome under the root". The assistant reads the tree and element library, adds, edits or deletes nodes and elements, and can generate the template. It asks before deleting anything.

**Where your key goes.** The key is kept in your browser and sent only to the provider you chose; the editor's backend never sees it. By default it is kept for the current tab (`sessionStorage`). You can also keep it for the current page only, or remember it on the device (`localStorage`), and you can remove it at any time in the assistant settings. Any script running on the page, including browser extensions, could read the key, so use a key with a spending limit and revoke it if in doubt. A Content-Security-Policy blocks injected scripts and lets the page talk only to the editor's backend and the LLM providers.

## Project layout

```
app/                    Next.js App Router (layout, page)
src/
  api/                  Axios client and types
  ai/                   AI assistant: providers, tools, agent loop, key storage
  editor/Main/           Editor UI (tree, elements, forms, AI chat)
  types/                Shared types
AGENTS.md               Guide for AI coding agents
docs/AI_AGENT.md        Extended agent reference
docs/screenshots/       UI illustrations used in this README
.claude/skills/         Claude skills (best practices)
```

## For AI agents

If you are an AI coding agent, read these before changing code:

- [`AGENTS.md`](AGENTS.md) — layout, conventions, what to avoid
- [`docs/AI_AGENT.md`](docs/AI_AGENT.md) — data flow and file roles
- [`.claude/skills/`](.claude/skills/) — software development best practices for Claude

## Related work

- Migrated from Create React App to Next.js + Vitest in PR #15.
- Agent documentation and README expansion live in PR #16.
