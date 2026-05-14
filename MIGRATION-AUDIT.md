# Migration Audit

Phase 0 audit of `everything-claude-code-main/` as reference input for evolving `claude-android-kit/`.

This document reflects a read-only audit of ECC plus an inventory of the current Android/KMP kit. Nothing in ECC was modified.

## 1. Executive Summary

ECC is not "just a starter pack." It is a packaged Claude Code platform with three big layers: a large content catalog (`agents/`, `skills/`, `commands/`, `rules/`), a runtime layer (`hooks/`, `scripts/`, manifests, install lifecycle, state store), and a shipping layer (plugin manifests, marketplace metadata, multi-target adapters). The main takeaway for `claude-android-kit` is not to copy ECC wholesale. The value is in borrowing its architecture patterns selectively: namespaced rule directories, manifest-driven install profiles, script-backed hooks, runtime feature flags, and plugin-style packaging. The parts that do not fit your philosophy are equally clear: cross-harness adapters, giant catalog breadth, generalized business/operator skills, and a learning system that would add more moving parts than your current kit needs. Your repo should stay Claude Code only, Android/KMP only, and much smaller.

## 2. ECC Top-Level Structure

Every top-level directory in `everything-claude-code-main/` and what it does:

- `.agents/` - alternate packaged agent/skill assets used by some adapter flows.
- `.claude/` - project-local Claude config and ECC-owned local content/state examples.
- `.claude-plugin/` - Claude Code plugin manifest and marketplace metadata source.
- `.codebuddy/` - CodeBuddy adapter install surface and scripts.
- `.codex/` - Codex app/CLI config, agents, and support files.
- `.codex-plugin/` - Codex-specific plugin package metadata.
- `.cursor/` - Cursor adapter assets: hooks, rules, and translated config.
- `.gemini/` - Gemini adapter config and install surface.
- `.github/` - GitHub workflows, metadata, prompts, and Copilot-related files.
- `.kiro/` - Kiro adapter assets, hooks, skills, steering, and installer.
- `.opencode/` - OpenCode plugin/config package, commands, tools, and migration docs.
- `.qwen/` - Qwen adapter config surface.
- `.trae/` - Trae adapter install/uninstall surface.
- `.vscode/` - VS Code/Copilot settings and editor integration files.
- `agents/` - primary Claude Code subagent definitions.
- `assets/` - images and other visual assets for docs/dashboard.
- `commands/` - maintained slash-command surface and command docs.
- `config/` - project stack mapping/configuration data used by install/setup flows.
- `contexts/` - extra prompt context overlays for development/review/research modes.
- `docs/` - long-form documentation, translations, release notes, and architecture docs.
- `ecc2/` - Rust-based ECC2 control-plane prototype.
- `examples/` - sample project configs and example `CLAUDE.md` files.
- `hooks/` - hook documentation plus the canonical `hooks.json`.
- `legacy-command-shims/` - opt-in archive of retired slash-command shims.
- `manifests/` - manifest-driven install module/profile/component metadata.
- `mcp-configs/` - bundled MCP configuration definitions.
- `plugins/` - plugin-related docs and marketplace guidance.
- `research/` - research notes and technical analysis docs.
- `rules/` - common plus language/domain-specific always-on rules.
- `schemas/` - JSON schemas for installs, hooks, plugin data, and state.
- `scripts/` - Node-based runtime, install lifecycle, hook implementations, and CLIs.
- `skills/` - the main workflow/domain skill catalog.
- `src/` - Python package/runtime code for ECC LLM tooling.
- `tests/` - regression suite for hooks, scripts, manifests, installs, and adapters.

## 3. Current `claude-android-kit` Surface

Exact current file inventory:

### `rules/`

- `rules/01-kotlin-style.md`
- `rules/02-android-architecture.md`
- `rules/03-compose-patterns.md`
- `rules/04-kmm-layering.md`
- `rules/05-testing.md`
- `rules/06-security.md`
- `rules/07-git-workflow.md`
- `rules/08-productivity-anti-duplication.md`

### `agents/`

- `agents/android-architect.md`
- `agents/compose-reviewer.md`
- `agents/gradle-resolver.md`
- `agents/kmp-migration-planner.md`

### `commands/`

- `commands/audit-kit.md`
- `commands/compose-review.md`
- `commands/gradle-fix.md`
- `commands/new-android.md`
- `commands/new-feature.md`
- `commands/new-kmm.md`
- `commands/ui-from-image.md`

### `skills/`

- `skills/feature-vertical-slice/SKILL.md`
- `skills/gradle-troubleshooting/SKILL.md`
- `skills/new-project-android/SKILL.md`
- `skills/new-project-kmm/SKILL.md`
- `skills/ui-from-image/SKILL.md`
- `skills/ui-from-image/references/assets.md`
- `skills/ui-from-image/references/cmp-specifics.md`
- `skills/ui-from-image/references/design-tokens.md`
- `skills/ui-from-image/references/figma-mcp.md`
- `skills/ui-from-image/references/project-conventions.md`
- `skills/ui-from-image/references/screenshot-analysis.md`
- `skills/ui-from-image/references/stitch-mcp.md`
- `skills/ui-from-image/references/visual-effects.md`
- `skills/ui-from-image/templates/screen-skeleton.kt`
- `skills/ui-from-image/templates/theme-skeleton.kt`

### `templates/`

- `templates/CLAUDE.android.template.md`
- `templates/CLAUDE.kmm.template.md`

### Surface Mismatch Note

The live repo surface does not match the counts in your task prompt. The repo currently has 8 rules, 4 agents, 7 commands, 5 skills, and 2 templates. `README.md` and `GUIDE.md` already reflect the 8/7/5 counts; the discrepancy is in the task description, not the checked-in docs.

## 4. ECC Hook Architecture

ECC's hook system is plugin-oriented and script-backed. `hooks/hooks.json` is the single source of truth for event registration, but almost every entry delegates into `scripts/hooks/*.js` through a thin bootstrap and the `run-with-flags.js` wrapper rather than embedding large inline shell one-liners. That wrapper enforces profile gating and per-hook disables with `ECC_HOOK_PROFILE=minimal|standard|strict` and `ECC_DISABLED_HOOKS=<ids>`, so the same checked-in hook graph can be softened or narrowed at runtime without editing JSON. `ECC_SESSION_START_MAX_CHARS` caps injected carry-over context, and `ECC_SESSION_START_CONTEXT=off` can disable SessionStart injection entirely. `SessionStart` flows through `session-start-bootstrap.js` into `session-start.js`, which resolves plugin roots safely, discovers the current project/session, injects prior-session summaries, active instincts, learned-skill summaries, and project/package-manager context into Claude's startup context. `Stop` runs `session-end.js` on every response to update a per-session markdown snapshot, while `SessionEnd` adds a lifecycle marker. In practice, ECC persists context opportunistically at `Stop` and treats `SessionEnd` as non-critical cleanup.

## 5. ECC Continuous Learning v2

`skills/continuous-learning-v2/` is an instinct-based learning system, not a simple session summary feature. Hooks capture prompt/tool observations deterministically before and after tool use, then the observer pipeline turns repeated behavior into small "instinct" records with confidence scores, domain tags, evidence, and scope. v2.1 adds project-scoped storage under an external homunculus data directory so React instincts stay in React repos and only broadly reusable patterns become global. `/instinct-status` calls the Python `instinct-cli.py status` flow to show project plus global instincts with confidence bars and domains. `/instinct-import` imports instinct files or URLs into project/global inherited storage with dedupe and confidence-based merge rules. `/instinct-export` emits a shareable YAML-like export filtered by scope/domain/confidence. `/evolve` clusters instincts into candidate skills, commands, or agents, and can optionally generate those files under `evolved/`. It is sophisticated and battle-tested, but it is also a substantial subsystem with its own storage model, CLI, and promotion logic. It is not a lightweight add-on.

## 6. ECC Security Scan and AgentShield

ECC's `skills/security-scan/` is a wrapper around AgentShield rather than a homegrown scanner. The skill instructs Claude to run `npx ecc-agentshield scan` against Claude Code configuration surfaces and interpret the findings. AgentShield checks `CLAUDE.md`, `settings.json`, MCP configs, hooks, and agent definitions for hardcoded secrets, overly broad permissions, dangerous bypass flags, command injection via hook interpolation, risky shell-backed MCP servers, prompt-injection patterns, unnecessary Bash access in agents, and silent error suppression. The ECC README also frames AgentShield as the deeper security lane with optional `--fix` and an `--opus` three-agent red-team/blue-team/auditor mode. In other words: ECC does not merely "remind you to think about security"; it shells out to a dedicated external auditor for config and harness security posture.

## 7. ECC Rule Layering

ECC's `rules/` structure cleanly separates universal guidance from language-specific overlays. `rules/common/` holds language-agnostic policies such as coding style, testing, git workflow, hooks, agents, performance, patterns, and security. Language directories then extend those files rather than replacing the whole system. The Kotlin pack follows that exact pattern: `rules/kotlin/coding-style.md` adds Kotlin-specific decisions like `val` over `var`, no `!!`, sealed state hierarchies, extension/scope-function guidance, and cancellation-safe error handling, explicitly referencing `../common/coding-style.md`. The Swift pack mirrors the same shape with Swift-native tools and idioms (`SwiftFormat`, `SwiftLint`, `let` over `var`, structs by default, typed throws, actors/Sendable/structured concurrency). The important pattern for your kit is not the specific ECC language content; it is the structural split: `common/` for universal principles, then technology packs that extend common guidance and are copied as directories, not flattened files.

## 8. ECC Agent Spec Format

ECC agent files such as `agents/kotlin-reviewer.md` and `agents/kotlin-build-resolver.md` use a simple, consistent frontmatter contract: `name`, `description`, `tools`, and `model`, followed by a focused role prompt. The frontmatter is terse and machine-friendly; the body does the real specialization work. `kotlin-reviewer.md` is review-only despite having broad tool access: it frames its role, defines a checklist by severity, sets stop/escalation rules for critical security issues, and specifies an output format. `kotlin-build-resolver.md` is action-oriented: it includes diagnostic commands, a minimal-change repair workflow, common error classes, stop conditions, and a final status format. The reusable pattern is: small frontmatter, explicit scope, explicit workflow, explicit output contract. The content is synthesized for the target domain. That format is a good fit for your future Android agents because it stays lightweight while still being dispatcher-friendly.

## 9. ECC Install System, Manifests, and Lifecycle

ECC's install architecture is substantially more advanced than a shell copy script. `install.sh` is just a legacy shell wrapper that bootstraps Node dependencies and hands off to `scripts/install-apply.js`. The real source of truth is the manifest layer: `manifests/install-profiles.json` defines named profiles (`minimal`, `core`, `developer`, `security`, `research`, `full`), `install-modules.json` defines installable modules and their target compatibility, and `install-components.json` maps user-facing components like `baseline:hooks` or `lang:kotlin` onto those modules. `scripts/install-plan.js` resolves profiles/components/modules into a concrete operation plan, while `install-apply.js` executes that plan and writes install-state. `scripts/ecc.js` is the umbrella CLI that fronts install, plan, catalog, consult, doctor, repair, status, sessions, work-items, and uninstall. `scripts/lib/install-state.js` writes a validated JSON install-state file describing what was installed, from where, and by which operations. `scripts/lib/install-lifecycle.js` powers `doctor`, `repair`, and `uninstall`: doctor detects missing/drifted managed files against recorded operations and current manifests, repair rebuilds them surgically, and uninstall removes only ECC-managed paths plus empty parent directories. Beyond install-state, ECC also has a separate SQLite state store surfaced by `status.js` and `sessions-cli.js` for runtime session, skill-run, governance, and work-item tracking. The core lesson for your kit is architectural: a manifest-driven installer plus an install-state file makes preview, selective install, repair, and uninstall possible without guesswork.

## 10. ECC Plugin Shipping

ECC ships as a real Claude Code plugin, not just a repo of markdown files. `.claude-plugin/plugin.json` is intentionally minimal: metadata, version, keywords, and pointers to `./skills/` and `./commands/`. It notably does not declare hooks explicitly, because Claude Code v2.1+ auto-loads `hooks/hooks.json` from installed plugins and duplicate declaration causes errors. `.claude-plugin/marketplace.json` wraps that plugin in marketplace metadata so users can add the GitHub repo as a marketplace and then install `ecc@ecc`. This gives ECC a clean plugin identity, short namespace, discoverable metadata, and a shipping story that does not depend on manual file copies alone. The plugin path still cannot distribute rules automatically, which is why ECC documents manual rule copying into `~/.claude/rules/ecc/` even when the plugin is installed.

## 11. What Maps Cleanly to `claude-android-kit`

The ECC patterns that fit your repo well:

- Namespaced rules copied as directories under `~/.claude/rules/cak/`.
- Rule split into `common/`, `kotlin/`, `android/`, and `kmp/`.
- Script-backed hooks with one checked-in `hooks/hooks.json`.
- Small runtime controls like `CAK_HOOK_PROFILE`, `CAK_DISABLED_HOOKS`, and `CAK_SESSION_START_MAX_CHARS`.
- Agent frontmatter shape: `name`, `description`, `tools`, `model`.
- A simplified install lifecycle with `minimal`, `core`, and `full`.
- Install-state tracking so uninstall/repair can stay safe and predictable.
- Optional plugin/marketplace shipping later, once the kit surface stabilizes.

## 12. What Should Not Be Carried Over

The ECC patterns that do not fit your kit:

- Cross-harness assets and adapters (`Cursor`, `Codex`, `OpenCode`, `Gemini`, `Qwen`, etc.).
- Huge generalized skill catalogs across web, backend, ops, media, research, and business workflows.
- Full continuous-learning v2 as an early roadmap item; it is powerful but heavy.
- SQLite runtime state dashboards and governance/event systems.
- Broad MCP packaging by default.
- Generic multi-language rule packs not tied to Android/KMP use.

## 13. Phase 1 Readiness

The repo is ready for Phase 1. The immediate low-risk move is exactly the one you proposed: keep every existing rule body intact, reorganize into namespaced subdirectories, and update the docs/install instructions to copy whole rule directories under `~/.claude/rules/cak/` instead of flattening files into `~/.claude/rules/`.

After that, the clearest high-leverage ECC-derived upgrade path is:

1. Rule restructuring and namespacing.
2. Script-backed hooks with Android-specific safety checks.
3. More precise Android/KMP agents using the ECC frontmatter pattern.
4. A small manifest-aware installer and install-state file.
5. Documentation/versioning pass once the surface settles.

## 14. Phase 1 — Executed

| Old path | New path | Method |
| --- | --- | --- |
| `rules/01-kotlin-style.md` | `rules/kotlin/kotlin-style.md` | `git mv` |
| `rules/02-android-architecture.md` | `rules/android/android-architecture.md` | `git mv` |
| `rules/03-compose-patterns.md` | `rules/android/compose-patterns.md` | `git mv` |
| `rules/04-kmm-layering.md` | `rules/kmp/kmm-layering.md` | `git mv` |
| `rules/07-git-workflow.md` | `rules/common/git-workflow.md` | `git mv` |
| `rules/08-productivity-anti-duplication.md` | `rules/common/productivity-anti-duplication.md` | `git mv` |
| `rules/05-testing.md` | `rules/common/testing.md` | manual create + `git rm` original |
| `rules/05-testing.md` | `rules/android/testing.md` | manual create + `git rm` original |
| `rules/05-testing.md` | `rules/kmp/testing.md` | manual create + `git rm` original |
| `rules/06-security.md` | `rules/common/security.md` | manual create + `git rm` original |
| `rules/06-security.md` | `rules/android/security.md` | manual create + `git rm` original |
| `rules/06-security.md` | `rules/kmp/security.md` | manual create + `git rm` original |

Notes:

- Straight moves used `git mv` to preserve history.
- The two mixed-scope files were split into six new files, then the originals were removed with `git rm`.
- `rules/android/compose-patterns.md` gained the approved top comment noting it currently covers both Jetpack Compose and Compose Multiplatform.
- `rules/common/testing.md` now points to `rules/android/testing.md` and `rules/kmp/testing.md`, and both platform files point back to `common/testing.md`.
- `rules/common/security.md` retains the original mandatory-baseline opening line, and the new platform files point back to `common/security.md`.
