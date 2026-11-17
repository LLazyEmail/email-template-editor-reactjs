# Claude folder

Claude Code configuration for this repository. The entry point for every agent is [`AGENTS.md`](../AGENTS.md).

## Skills (`skills/`)

Loaded when a task matches the skill's `description`.

| Skill                                 | When to use                                             |
| ------------------------------------- | ------------------------------------------------------- |
| `software-development-best-practices` | Any feature, fix, refactor, or review                   |
| `testing`                             | Writing or fixing Vitest or Playwright tests            |
| `deployment`                          | Hosting, Docker, environment variables                  |
| `editor-conventions`                  | Changing the editor UI, AI assistant, CSP or API client |

## Subagents (`agents/`)

| Agent      | Use for                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `coder`    | Logic and behavior: state, API client, AI assistant, CSP, types, tests        |
| `designer` | Visual work: layout, spacing, Ant Design theming, accessibility, preview look |

See [`docs/claude-skills.md`](../docs/claude-skills.md) for how to add or change them.
