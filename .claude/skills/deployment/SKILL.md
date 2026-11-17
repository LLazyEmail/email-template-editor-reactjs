---
name: deployment
description: "Deploy or document deployment of the email template editor. Use for Vercel, Netlify, Docker, AWS (Amplify, CloudFront), or environment variables."
---

# Deployment

Read `docs/deployment.md` before changing hosting.

## Facts

- App is Next.js 16 App Router. Default output is a Node server (`next start`).
- Frontend calls a separate backend on port 9000 unless `NEXT_PUBLIC_API_URL` is set.
- Docker image already builds and runs on port 3000.

## Options

| Target              | Fit            | Notes                                                        |
| ------------------- | -------------- | ------------------------------------------------------------ |
| Amplify             | AWS, managed   | Runs the Next.js server                                      |
| CloudFront + Docker | AWS, own infra | Cache only `/_next/static/*`; HTML must come from the server |
| Vercel              | Best default   | Native Next.js, set `NEXT_PUBLIC_API_URL`                    |
| Netlify             | Good           | Next.js plugin, same env var                                 |
| Docker              | Self-hosted    | Existing Dockerfile                                          |

## Rules

- **No static export.** `output: "export"` and S3-only hosting break the app: `proxy.ts` sets a per-request CSP nonce and `app/layout.tsx` forces dynamic rendering. A static page has no nonce and its scripts are blocked.
- Do not cache HTML at a CDN; each response carries its own nonce.
- Do not hardcode production API hosts in source. Use `NEXT_PUBLIC_API_URL` (inlined at build time, also added to the CSP).
