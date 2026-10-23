---
name: deployment
description: "Deploy or document deployment of the email template editor. Use for CloudFront, S3, Vercel, Netlify, Docker, or environment variables."
---

# Deployment

Read `docs/deployment.md` before changing hosting.

## Facts

- App is Next.js 14 App Router. Default output is a Node server (`next start`).
- Frontend calls a separate backend on port 9000 unless `NEXT_PUBLIC_API_URL` is set.
- Docker image already builds and runs on port 3000.

## Options

| Target | Fit | Notes |
| --- | --- | --- |
| CloudFront + S3 | Static hosting | Needs `output: 'export'` and a public API URL |
| Vercel | Best default | Native Next.js, set `NEXT_PUBLIC_API_URL` |
| Netlify | Good | Next.js plugin, same env var |
| Docker | Self-hosted | Existing Dockerfile |

Do not hardcode production API hosts in source. Use `NEXT_PUBLIC_API_URL`.
