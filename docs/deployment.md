# Deployment research

Issue: #11

## Goal of this note

Compare practical ways to host the email template editor. This is research, not a production deploy.

## What the app needs

- Next.js 16 App Router frontend.
- A separate backend (default `http://localhost:9000`).
- Public env var `NEXT_PUBLIC_API_URL` for the API base URL.
- No server-side secrets in this repo today.

## Options

### 1. Amazon CloudFront

**Static export (CloudFront + S3) is not possible.** The page sends a Content-Security-Policy with a nonce that changes on every request (`proxy.ts`), so `app/layout.tsx` sets `dynamic = "force-dynamic"` and every page is rendered per request. `output: "export"` would produce pages without a nonce, and the browser would block their scripts.

**What works on AWS:** CloudFront in front of a Node server (the Docker image on ECS/Fargate or App Runner, see option 4) or Amplify Hosting (option 5).

- Cache only `/_next/static/*` (immutable, hashed file names) at the edge.
- Do not cache HTML: forward it to the origin so each response gets its own nonce.
- Set `NEXT_PUBLIC_API_URL` at build time to the public backend URL; the CSP allows that origin.

### 2. Vercel

**Fit:** best default for this Next.js app.

**How**

- Connect the GitHub repo.
- Set `NEXT_PUBLIC_API_URL`.
- Deploy on push to `master`.

**Pros:** zero config for Next.js, preview deployments, easy rollbacks.  
**Cons:** not CloudFront; backend still lives elsewhere.

### 3. Netlify

**Fit:** similar to Vercel if the team already uses Netlify.

Use the Next.js runtime, set `NEXT_PUBLIC_API_URL`, deploy from Git.

### 4. Docker (already in repo)

**Fit:** self-hosted or ECS/Fargate.

```bash
docker build -t email-template-editor .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.example.com email-template-editor
```

Note: `NEXT_PUBLIC_*` is inlined at build time, so pass it as a build arg if the image is built in CI.

### 5. AWS Amplify Hosting

**Fit:** AWS-native managed hosting that runs the Next.js server, so the per-request CSP works.

## Recommendation

| Priority       | Choice                                | Why                                                 |
| -------------- | ------------------------------------- | --------------------------------------------------- |
| Fastest        | Vercel                                | Native Next.js, least setup                         |
| AWS, managed   | Amplify                               | Runs the Next.js server on AWS                      |
| AWS, own infra | CloudFront + Docker on ECS/App Runner | Edge caching of static assets, HTML from the server |
| Self-hosted    | Existing Dockerfile                   | Already works                                       |

Do not hardcode the API host. Always use `NEXT_PUBLIC_API_URL`.

## Suggested next steps

1. Pick a Node host (Vercel, Amplify or Docker).
2. Document the production API URL once the backend host exists.
