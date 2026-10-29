# Deployment research

Issue: #11

## Goal of this note

Compare practical ways to host the email template editor. This is research, not a production deploy.

## What the app needs

- Next.js 14 App Router frontend.
- A separate backend (default `http://localhost:9000`).
- Public env var `NEXT_PUBLIC_API_URL` for the API base URL.
- No server-side secrets in this repo today.

## Options

### 1. Amazon CloudFront + S3

**Fit:** good if the team already uses AWS and the app can be a static export.

**How it would work**

1. Set `output: 'export'` in `next.config.js`.
2. `npm run build` writes static files to `out/`.
3. Upload `out/` to an S3 bucket.
4. Put CloudFront in front of the bucket (HTTPS, caching, custom domain).
5. Set `NEXT_PUBLIC_API_URL` at build time to the public backend URL.

**Pros**

- Cheap at low traffic.
- CDN caching is strong for a mostly static editor shell.
- Matches the issue request for CloudFront.

**Cons**

- Static export drops Next.js server features (SSR, route handlers, image optimization).
- API URL is baked in at build time.
- Need a separate host for the backend.

**Starter config**

```js
// next.config.js
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
};
module.exports = nextConfig;
```

```bash
NEXT_PUBLIC_API_URL=https://api.example.com npm run build
aws s3 sync out/ s3://email-template-editor --delete
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

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

**Fit:** AWS-native alternative to CloudFront+S3 that understands Next.js better.

Amplify can host Next.js without forcing a static export. Use this if the team wants AWS but also wants server features later.

## Recommendation

| Priority | Choice | Why |
| --- | --- | --- |
| Fastest | Vercel | Native Next.js, least setup |
| AWS, static | CloudFront + S3 | Matches the issue, cheap, needs static export |
| AWS, flexible | Amplify | Stays on AWS without dropping Next features |
| Self-hosted | Existing Dockerfile | Already works |

Do not hardcode the API host. Always use `NEXT_PUBLIC_API_URL`.

## Suggested next steps

1. Decide static export vs Node server.
2. If CloudFront: add `output: 'export'` in a follow-up PR and a GitHub Action that syncs `out/` to S3.
3. Document the production API URL once the backend host exists.
