# Changelog

## [0.2.1] -- 2026-05-15

### Added

- Feedback logging in `cak:session-end` hook -- appends one JSON line to `~/.claude/.cak-feedback.jsonl` on session stop
- `templates/cak-feedback.template.md` -- per-project reflection log template
- `scripts/cak-feedback-report.js` -- weekly feedback aggregator; reads JSONL + per-project markdown logs; outputs markdown report to stdout
- `cak.js feedback` subcommand -- runs the report with defaults; `--weeks N`, `--projects`, and `--init` flags
- `CAK_FEEDBACK_LOGGING` env var -- set to `off` to disable passive session logging
- `GUIDE.md` section 17 -- Measuring the kit

### Notes

- Passive log captures session metadata only (timestamp, project, branch, cwd, kit version). Agent and command invocation tracking will follow when Claude Code exposes that state to hooks reliably.

---

## [0.2.0] -- 2026-05-15

### Added

- Hook runtime: `hooks/hooks.json` wiring 5 entries -- SessionStart context injection, Stop persistence, SessionEnd lifecycle marker, PreToolUse release build guard, PostToolUse kt-lint and manifest audits
- `scripts/hooks/` implementations: `session-start.js`, `session-end.js`, `kt-lint-check.js`, `manifest-audit.js`, `release-guard.js`
- `scripts/lib/utils.js` -- shared hook utilities
- `hooks/README.md` -- full hook configuration and escape-hatch docs
- `install.sh` -- macOS/Linux installer; profiles `minimal`, `core`, `full`; flags `--dry-run`, `--force`, `--without-hooks`, `--uninstall`
- `install.ps1` -- Windows PowerShell installer; identical contract to `install.sh`
- `scripts/cak.js` -- Node.js lifecycle CLI: `doctor`, `repair`, `list-installed`, `uninstall`, `version`
- `VERSION` -- kit version string (`0.2.0`)
- Agent `@android-build-resolver` -- compile errors, R8/ProGuard, KSP/KAPT, Compose Compiler <-> Kotlin mismatches, AGP conflicts
- Agent `@android-security-reviewer` -- pre-release Android security audit (manifest, network config, secrets, storage, tokens, ProGuard)
- Agent `@kotlin-reviewer` -- data and domain layer Kotlin review (coroutines, Flow, DI, mappers, repository contract)
- Agent `@room-migration-planner` -- Room schema migration planning, DDL generation, and `MigrationTestHelper` test generation
- `CHANGELOG.md` (this file)

### Changed

- Rules restructured from 8 flat numbered files to 12 files in 4 namespaced subdirectories: `rules/common/`, `rules/kotlin/`, `rules/android/`, `rules/kmp/`
- `rules/05-testing.md` split into `common/testing.md`, `android/testing.md`, `kmp/testing.md`
- `rules/06-security.md` split into `common/security.md`, `android/security.md`, `kmp/security.md`
- Install target changed from `~/.claude/rules/` (flat files) to `~/.claude/rules/cak/` (namespaced subdirectories)
- `README.md`: agent count updated to 8; version label added; install block updated to Option A (automated) / Option B (manual)
- `GUIDE.md`: install block updated to namespaced paths; Section 6 adds four new agent entries; Appendix A and C updated for 8 agents; Section 16 (install guide) added

### Notes

Users who installed v0.1.0 by manually copying the flat rule files into `~/.claude/rules/` need to update their installation. Remove the old numbered files (`01-kotlin-style.md` through `08-productivity-anti-duplication.md`) from `~/.claude/rules/`, then re-install using the new structure: `mkdir -p ~/.claude/rules/cak` and copy each subdirectory (`common/`, `kotlin/`, `android/`, `kmp/`) into `~/.claude/rules/cak/`. Any project-level `CLAUDE.md` overrides that reference the old flat rule paths should be updated to the namespaced equivalents (e.g. `~/.claude/rules/android-architecture.md` -> `~/.claude/rules/cak/android/android-architecture.md`). The automated installer handles this in one command: `./install.sh --profile core --force`.

---

## [0.1.0] -- initial release

### Added

- Initial kit: 8 rules (flat, numeric prefixes), 4 agents, 7 commands, 5 skills, 2 templates
