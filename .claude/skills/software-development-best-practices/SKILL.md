---
name: software-development-best-practices
description: "Apply software development best practices when writing, reviewing, or changing code. Use when implementing features, fixing bugs, refactoring, writing tests, opening PRs, or reviewing changes in this repository."
---

# Software Development Best Practices

Apply these practices on every code change in this repo. Prefer small, correct, reviewable diffs over clever ones.

## Core rules

1. **Understand before editing.** Read the relevant files and `AGENTS.md` first. Do not invent APIs or file paths.
2. **One concern per change.** A bug fix is not a refactor. A feature is not a drive-by cleanup.
3. **Keep it working.** Do not leave the tree in a broken state. Run the check that matches the change.
4. **Match the codebase.** Follow existing naming, Ant Design usage, and file layout.
5. **Be explicit.** Prefer clear names and small functions over comments that restate the code.

## Workflow

1. Confirm the goal and the acceptance criteria.
2. Locate the files that own the behavior.
3. Make the smallest change that meets the goal.
4. Add or update a test when behavior changes.
5. Run the relevant check (`npm test`, `npm run build`).
6. Write a PR description that says what changed, why, and how to verify.

## This repository

- Interactive UI lives under `src/pages/Main` and must be a client component (`"use client"`).
- All HTTP calls go through `src/api/main.ts`. Do not call `axios` from UI files.
- Tests use Vitest. Mock `src/api/main` so tests never hit the network.
- Backend default is `http://localhost:9000`. Override with `NEXT_PUBLIC_API_URL`.

## Design principles

| Principle | Do | Avoid |
| --- | --- | --- |
| Single responsibility | One component / function does one job | God components that fetch, render, and validate everything |
| Fail visibly | Surface errors the user can see (notification, form error) | Silent `catch` that swallows failures |
| Stable contracts | Keep API types in `src/api/main.types.ts` | Inline `any` payloads with no type |
| Progressive change | Land the fix, then improve structure | Mixing a rewrite with a one-line fix |
| Reviewability | Small commits, clear messages | 1,000-line commits titled "updates" |

## Testing

- Cover the behavior the user can observe, not implementation details.
- Prefer Testing Library queries (`getByText`, `getByRole`) over class or internal state.
- A smoke test is better than no test. Add interaction tests when the change is user-facing.
- Do not assert on console logs or private state.

## Pull requests

A good PR body answers:

1. What changed?
2. Why?
3. How to verify?
4. What was intentionally left out?

Link the issue with `Closes #N` when the PR fully resolves it.

## Common issues

| Problem | Fix |
| --- | --- |
| Component uses hooks but fails in Next.js | Add `"use client"` at the top of the file |
| Test fails with network or `document` errors | Mock `src/api/main` and keep browser APIs inside the component |
| Lockfile out of date | Run `npm install` and commit `package-lock.json` |
| Large unrelated diff | Split into a follow-up PR |

See `references/checklist.md` for a pre-submit checklist.
