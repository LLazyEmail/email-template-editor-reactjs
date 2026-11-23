---
name: editor-conventions
description: "Change the email template editor UI, AI assistant or API client. Use when editing Main, TemplateTree, Elements, Preview, Chat, src/ai, src/api or the CSP."
---

# Editor conventions

- Editor UI lives in `src/editor/Main`, not `src/pages` (Next.js would treat `pages` as routes).
- Interactive components need `"use client"`.
- All HTTP calls go through `src/api/main.ts`. Do not call axios from UI files.
- Types belong in `src/api/main.types.ts` and `src/types`.
- Prefer Ant Design components already used in the screen (Button, Modal, Tree, List).
- Keep the tree and elements list working when the backend is down: do not crash the page on a failed fetch. End every API call in the UI with `.catch(notifyError("Could not …"))` (`src/editor/Main/notifyError.ts`).
- `src/ai/` (providers, tools, agent loop, key storage) has no React or antd imports. UI for it lives in `src/editor/Main/Chat/`.
- `ChatPanel` stays lazy-loaded with `next/dynamic` in `Main.tsx`, so the AI SDK is not in the initial bundle.
- Model output is rendered as text only: no `dangerouslySetInnerHTML`, no markdown-to-HTML. Rules for new AI tools are in `docs/AI_AGENT.md`.
- The preview (`src/editor/Main/Preview/`) renders untrusted email HTML in a sandboxed iframe. Do not loosen the sandbox.
- A new external origin (API, AI provider, CDN, font) must be added to `src/security/contentSecurityPolicy.ts` with a test, or the browser blocks it.
