---
name: run-app
description: "Run the email template editor locally (frontend + backend) and check a change in the real app. Use when asked to start, run, open or screenshot the editor, or to confirm a UI change works beyond unit tests."
---

# Run the app

The editor needs two processes: this Next.js app on **:3000** and the backend API on **:9000** (separate repo [email-template-editor-nodejs](https://github.com/LLazyEmail/email-template-editor-nodejs), usually checked out next to this one as `../email-template-editor-nodejs`).

## 1. Reuse what is already running

- Frontend: `next dev` writes its PID, port and URL to `.next/dev/lock`. If it exists and the process is alive, use that server. Starting a second `next dev` only prints the running one's URL.
- Backend: `curl -s localhost:9000/tree` answers JSON when it is up.

## 2. Start what is missing (in the background)

```bash
# backend (in-memory sample data from db.json)
cd ../email-template-editor-nodejs && npm install && npm run dev   # :9000

# frontend
npm run dev                                                         # :3000
```

No backend checkout? The UI still loads (tree and elements show errors); for UI-only checks Playwright e2e specs mock the API with `page.route` instead.

## 3. Check the change

- **Framework errors** (Next DevTools MCP, `.mcp.json`): `nextjs_index` to find the server, then `nextjs_call` → `get_errors`, `get_logs`, `compile_route`. Faster than `npm run build` while editing.
- **The page itself** (Playwright MCP): open `http://localhost:3000`, take a snapshot or screenshot, click through the flow you changed.
- The browser console is forwarded to the `next dev` terminal output.

## 4. Before finishing

- Stop only the processes you started.
- Still run `npm run lint`, `npm run typecheck` and `npm test`; the running app does not replace tests.
