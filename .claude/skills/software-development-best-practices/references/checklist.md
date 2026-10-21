# Pre-submit checklist

Use this before opening or updating a pull request.

## Correctness
- [ ] The change does what the issue or request asked for
- [ ] Edge cases are handled (empty tree, missing backend, failed request)
- [ ] No secrets, tokens, or local paths committed

## Code quality
- [ ] Names match surrounding code
- [ ] No unused imports or dead code
- [ ] Types updated in `src/api/main.types.ts` if the API changed
- [ ] Client components marked with `"use client"`

## Tests
- [ ] Behavior change has a Vitest test, or the reason not to is stated
- [ ] API calls are mocked
- [ ] `npm test` passes

## Delivery
- [ ] `npm run build` passes for UI or config changes
- [ ] PR title is imperative and specific
- [ ] PR body has what / why / how to verify
- [ ] Related issue linked
