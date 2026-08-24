# Changelog

## [1.1.0] -- 2026-08-24

### Added
- **Konsist Architecture Unit Testing Suite**: Added `com.lemonappdev:konsist` to `gradle/libs.versions.toml` and implemented `ArchitectureKonsistTest.kt` in `composeApp/src/commonTest/` to verify semantic boundaries, zero Android imports in `commonMain`, ViewModels exposing read-only `StateFlow`, and repository package encapsulation.
- **Lightweight / Single-Module Feature Profile**: Enhanced `tools/scaffold_feature.py` with `--lightweight` (`-l`) flag to scaffold unified `:feature:<name>` modules for fast hackathons, utility screens, and MVPs alongside enterprise 3-tier architectures.
- **Enhanced Static Linter**: Upgraded `tools/verify_architecture.py` with automatic block comment, line comment, and string literal stripping to eliminate regex false positives, plus aliased import detection.
- **Native iOS CI Pipeline Enhancement**: Upgraded `.github/workflows/ci.yml` on macOS-14 runners with conditional Xcode simulator builds and test execution.

---

## [1.0.0] -- 2026-08-24

### Added
- **Single Source of Truth (SSOT)**: 5 core architecture rule documents in `.shared-rules/` (`01-architecture-udf.md`, `02-compose-guidelines.md`, `03-kmp-guidelines.md`, `04-swiftui-interop.md`, `05-testing-verification.md`).
- **AI Platform Adapters**:
  - Cursor `.mdc` rules (`.cursor/rules/`) with target file globs.
  - Claude Code `CLAUDE.md` and slash commands (`/scaffold-feature`, `/review-compose`, `/verify`).
  - Google Antigravity `AGENT_WORKSPACE.md` and `.antigravity/gates/task_verification_gates.json`.
- **End-to-End Reference Applications**:
  - `composeApp/`: Android & Desktop entry with Material 3 `AppTheme`, Navigation Compose, and Koin initialization.
  - `iosApp/`: Native iOS SwiftUI entry with Swift 6 `@Observable` ViewModels and SKIE bindings.
  - `feature/auth/`: Scaffolding of reference `:domain`, `:data`, and `:ui` modules.
- **Gradle Convention Plugins (`build-logic`)**: `kit.kmp.library`, `kit.kmp.feature`, `kit.android.application`.
- **Interactive Project Bootstrapper (`init.sh`)**: One-command initialization with recursive package refactoring.
- **Core Multiplatform Modules**: `:core:network` (Ktor 3), `:core:database` (Room 3 KMP), `:core:designsystem` (Material 3).

---

## [0.2.1] -- 2026-05-15

### Added
- Feedback logging in `cak:session-end` hook -- appends one JSON line to `~/.claude/.cak-feedback.jsonl` on session stop
- `templates/cak-feedback.template.md` -- per-project reflection log template
- `scripts/cak-feedback-report.js` -- weekly feedback aggregator; reads JSONL + per-project markdown logs; outputs markdown report to stdout
- `cak.js feedback` subcommand -- runs the report with defaults; `--weeks N`, `--projects`, and `--init` flags
- `CAK_FEEDBACK_LOGGING` env var -- set to `off` to disable passive session logging
- `GUIDE.md` section 17 -- Measuring the kit

---

## [0.2.0] -- 2026-05-15

### Added
- Hook runtime: `hooks/hooks.json` wiring 5 entries
- Agent `@android-build-resolver`, `@android-security-reviewer`, `@kotlin-reviewer`, `@room-migration-planner`
- Automated installer (`install.sh`, `install.ps1`) and Node CLI `scripts/cak.js`

---

## [0.1.0] -- Initial Release
- Initial kit: 8 rules, 4 agents, 7 commands, 5 skills, 2 templates
