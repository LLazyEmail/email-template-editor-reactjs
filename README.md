# Email Template Editor (Next.js)

Visual email template editor migrated from Create React App to **Next.js** (App Router) with **Vitest**.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the Next.js development server
- `npm run build` — production build
- `npm start` — start the production server
- `npm test` — run Vitest once
- `npm run test:watch` — Vitest in watch mode

## Notes

- Client components (the editor UI) live under `src/pages/Main` and are marked with `"use client"`.
- The API client (`src/api/main.ts`) talks to a backend on port 9000 by default.
- You can override the API base URL with `NEXT_PUBLIC_API_URL`.

## Docker

```bash
docker build -t email-template-editor .
docker run -p 3000:3000 email-template-editor
```
