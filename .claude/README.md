# Claude folder

Claude Code configuration for this repository. The entry point for every agent is [`AGENTS.md`](../AGENTS.md).

## Skills (`skills/`)

Loaded when a task matches the skill's `description`.

| Skill                                 | When to use                                                               |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `software-development-best-practices` | Any feature, fix, refactor, or review                                     |
| `testing`                             | Writing or fixing Vitest or Playwright tests                              |
| `deployment`                          | Hosting, Docker, environment variables                                    |
| `editor-conventions`                  | Changing the editor UI, AI assistant, CSP or API client                   |
| `run-app`                             | Running the app (frontend + backend) and checking a change in the browser |

## Subagents (`agents/`)

| Agent      | Use for                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `coder`    | Logic and behavior: state, API client, AI assistant, CSP, types, tests        |
| `designer` | Visual work: layout, spacing, Ant Design theming, accessibility, preview look |

## Settings and hooks

- `settings.json` — shared permissions (common checks run without a prompt, `.env` is not readable) and a PostToolUse hook.
- `hooks/format-and-lint.sh` — Prettier + `eslint --fix` on every edited file; ESLint errors are sent back to Claude.
- `settings.local.json` — your own overrides, git-ignored.
- MCP servers are in `../.mcp.json` (Next DevTools, Playwright).

See [`docs/claude-skills.md`](../docs/claude-skills.md) for how to add or change them.
