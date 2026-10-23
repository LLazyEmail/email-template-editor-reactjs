---
name: editor-conventions
description: "Change the email template editor UI or API client. Use when editing Main, TemplateTree, Elements, or src/api."
---

# Editor conventions

- Editor UI lives in `src/editor/Main`, not `src/pages` (Next.js would treat `pages` as routes).
- Interactive components need `"use client"`.
- All HTTP calls go through `src/api/main.ts`. Do not call axios from UI files.
- Types belong in `src/api/main.types.ts` and `src/types`.
- Prefer Ant Design components already used in the screen (Button, Modal, Tree, List).
- Keep the tree and elements list working when the backend is down: do not crash the page on a failed fetch.
