# Claude skills and subagents

Project-specific instructions for Claude Code (and other agents that read `.claude/`). General rules for every agent live in [`AGENTS.md`](../AGENTS.md); keep facts there and use skills for workflows.

## What is there

| Path                                                  | Kind     | Purpose                                                                                               |
| ----------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `.claude/skills/software-development-best-practices/` | Skill    | How to change code well; pre-submit checklist in `references/checklist.md`; trigger evals in `evals/` |
| `.claude/skills/testing/`                             | Skill    | Vitest and Playwright rules and mocks                                                                 |
| `.claude/skills/deployment/`                          | Skill    | Hosting options, Docker, env vars, why static export is not possible                                  |
| `.claude/skills/editor-conventions/`                  | Skill    | Where editor, AI assistant, preview and CSP code lives and how to change it                           |
| `.claude/skills/run-app/`                             | Skill    | Start frontend + backend, check a change via Next DevTools MCP and Playwright MCP                     |
| `.claude/settings.json`                               | Settings | Shared permissions and the format-and-lint hook                                                       |
| `.claude/hooks/format-and-lint.sh`                    | Hook     | Prettier + `eslint --fix` after each edit; ESLint errors go back to the agent                         |
| `.mcp.json`                                           | MCP      | `next-devtools` (running dev server) and `playwright` (browser)                                       |
| `.claude/agents/coder.md`                             | Subagent | Logic, data flow, tests                                                                               |
| `.claude/agents/designer.md`                          | Subagent | Visual and layout work                                                                                |

## How skills are used

Claude Code loads a skill when the task matches the `description` in its `SKILL.md`. Each skill is a folder with a required `SKILL.md`; extra files (references, scripts, evals) are read only when the skill points to them.

## How to add a skill

1. Create `.claude/skills/<name>/SKILL.md`.
2. Add YAML frontmatter with `name` and `description`. The description decides when the skill triggers: say what it does and when to use it.
3. Keep the body short and imperative. Link to docs instead of copying them.
4. List it in `.claude/README.md`, this file and the skills table in `docs/AI_AGENT.md`.

## How to add a subagent

1. Create `.claude/agents/<name>.md` with frontmatter `name`, `description`, `tools`, `model`.
2. Say what it reads first, how it works, and what "done" means (commands that must pass).
3. List it in `.claude/README.md`, this file and `docs/AI_AGENT.md`.
