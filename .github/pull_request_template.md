## What

<!-- What changed, in a few bullets. -->

## Why

<!-- The problem or issue this solves. Link it: Closes #123 -->

## How to verify

<!-- Commands you ran and what a reviewer should click through. -->

## Checklist

- [ ] One concern per PR (no drive-by refactors)
- [ ] `npm run lint`, `npm run typecheck`, `npm run format:check` pass
- [ ] `npm run test:coverage` passes; new behavior has a test
- [ ] `npm run test:e2e` passes if a user flow changed
- [ ] New external origin added to the CSP (`src/security/contentSecurityPolicy.ts`), if any
- [ ] `AGENTS.md`, `docs/AI_AGENT.md` or a skill updated if conventions or file layout changed
