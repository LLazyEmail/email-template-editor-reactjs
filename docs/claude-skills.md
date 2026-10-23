# Claude skills

Issue: #10

## Goal

Give Claude (and other agents that read `.claude/skills`) project-specific instructions so changes stay consistent.

## What was added

- `.claude/README.md` — index of skills.
- `.claude/skills/testing` — Vitest and Playwright rules.
- `.claude/skills/deployment` — hosting options and env vars.
- `.claude/skills/editor-conventions` — where the editor lives and how to change it.
- Existing `software-development-best-practices` skill is unchanged.

## How skills are used

Claude Code loads a skill when the task matches the `description` in `SKILL.md`. Each skill is a folder with a required `SKILL.md`.

## How to add another skill

1. Create `.claude/skills/<name>/SKILL.md`.
2. Add YAML frontmatter with `name` and `description`.
3. Keep the body short and imperative.
4. Link it from `.claude/README.md` and this doc.
