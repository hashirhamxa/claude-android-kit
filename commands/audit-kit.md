---
description: Verify the kit's docs match the actual file inventory. Run before publishing or after restructuring.
argument-hint: [optional focus area]
---

# /audit-kit

Audit this Claude Code kit for documentation drift and packaging hygiene.

## What to do

Do not modify files in this run unless the user explicitly asks you to after the audit. Report only.

1. **Count the actual inventory**
   - Count markdown files in `rules/`, `agents/`, and `commands/`
   - Count `SKILL.md` files in `skills/*/`
   - Count templates in `templates/`

2. **Compare docs to reality**
   - Read `README.md` and `GUIDE.md`
   - Extract claimed counts for rules, agents, slash commands, skills, and templates
   - For every command file in `commands/`, verify it's mentioned in the docs where appropriate
   - For every rule file in `rules/`, verify the guide's rule inventory and health-check script include it
   - Flag stale project names such as `hash-claude-starter`

3. **Check git hygiene**
   - Run `git status --porcelain`
   - Flag untracked or deleted files inside `rules/`, `agents/`, `commands/`, `skills/`, or `templates/`
   - Flag empty directories outside `.git/`

4. **Report clearly**
   - Start with findings ordered by severity
   - Include a claimed-vs-actual summary for counts
   - List missing doc references, stale names, git hygiene issues, and empty directories separately
   - End with a short checklist of suggested edits

## Guardrails

- Do not "fix as you go" in this command
- Prefer concrete file references over vague summaries
- If the repo is already clean, say so explicitly
