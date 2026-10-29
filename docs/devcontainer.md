# Dev Container

Issue: #9

## Goal

Give every contributor the same Node 20 environment for the Next.js editor, without a local Node install.

## What was added

- `.devcontainer/devcontainer.json` — Dev Container config based on the official Node 20 image.
- Forwards ports `3000` (Next.js) and `9000` (backend API).
- Runs `npm install` after the container is created.
- Suggests ESLint, Prettier, and Playwright extensions.

## How to use

1. Install the Dev Containers extension in VS Code or Cursor.
2. Open this repository.
3. Run **Dev Containers: Reopen in Container**.
4. After install finishes:

```bash
npm run dev
```

Open http://localhost:3000.

## Notes

- The frontend still expects a backend on port 9000. Override with `NEXT_PUBLIC_API_URL` if needed.
- Node version matches CI (Node 20).
