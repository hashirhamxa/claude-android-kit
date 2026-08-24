<div align="center">

# 🚀 Claude Android Kit
### Production Multiplatform AI Mobile Toolkit

[![CI](https://github.com/hashirhamxa/claude-android-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/hashirhamxa/claude-android-kit/actions/workflows/ci.yml)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.1.10-7F52FF.svg?logo=kotlin&logoColor=white)](https://kotlinlang.org)
[![Compose Multiplatform](https://img.shields.io/badge/Compose_Multiplatform-1.7.3-4285F4.svg?logo=jetpackcompose&logoColor=white)](https://www.jetbrains.com/lp/compose-multiplatform/)
[![Swift](https://img.shields.io/badge/Swift-6.0-F05138.svg?logo=swift&logoColor=white)](https://swift.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Release-v1.1.0-green.svg)](VERSION)

**A production-grade mobile architecture and AI developer toolkit bridging Jetpack Compose, Kotlin Multiplatform (KMP), Android Native, and Native iOS (SwiftUI).**  
*Engineered to eliminate LLM hallucinations and code drift across Claude Code, Cursor, and Google Antigravity.*

</div>

---

## ⚡ Instant One-Line Bootstrapper

Bootstrap a brand-new project with package renaming, git initialization, and architecture hooks in one command:

```bash
# Enterprise 3-Tier Architecture
curl -sSL https://raw.githubusercontent.com/hashirhamxa/claude-android-kit/main/init.sh | bash -s my-awesome-app com.mycompany.app

# Lightweight / Single-Module Feature Profile
curl -sSL https://raw.githubusercontent.com/hashirhamxa/claude-android-kit/main/init.sh | bash -s my-awesome-app com.mycompany.app --lightweight
```

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    .shared-rules/ (SSOT)                    │
│             UDF • Compose • KMP • Swift • Tests             │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Dynamic Rule Binding)
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│    Claude Code    │  │      Cursor       │  │ Google Antigravity│
│     CLAUDE.md     │  │   .cursor/rules/  │  │ AGENT_WORKSPACE.md│
│  .claude/commands │  │    *.mdc Globs    │  │ Verification Gates│
└───────────────────┘  └───────────────────┘  └───────────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                   Modular Codebase                                    │
│                                                                                       │
│   ┌───────────────────────────────────────────────────────────────────────────────┐   │
│   │                                 build-logic                                   │   │
│   │        kit.kmp.library • kit.kmp.feature • kit.android.application            │   │
│   └───────────────────────────────────────┬───────────────────────────────────────┘   │
│                                           │                                           │
│                   ┌───────────────────────┴───────────────────────┐                   │
│                   ▼                                               ▼                   │
│   ┌───────────────────────────────┐               ┌───────────────────────────────┐   │
│   │         core:network          │               │         core:database         │   │
│   │    Ktor 3 (OkHttp/Darwin)     │               │           Room 3 KMP          │   │
│   └───────────────┬───────────────┘               └───────────────┬───────────────┘   │
│                   │                                               │                   │
│                   └───────────────────────┬───────────────────────┘                   │
│                                           ▼                                           │
│   ┌───────────────────────────────────────────────────────────────────────────────┐   │
│   │                                feature:<name>                                 │   │
│   │    :domain (Pure Models) ──▶ :data (Ktor/Room) ──▶ :ui (UDF + StateFlow)      │   │
│   └───────────────────────────────────────┬───────────────────────────────────────┘   │
│                                           │                                           │
│                   ┌───────────────────────┴───────────────────────┐                   │
│                   ▼                                               ▼                   │
│   ┌───────────────────────────────┐               ┌───────────────────────────────┐   │
│   │    composeApp (Android/CMP)   │               │       iosApp (Native iOS)     │   │
│   │   Compose • Navigation 2.8+   │               │   SwiftUI • SKIE Observable   │   │
│   └───────────────────────────────┘               └───────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

- **Single Source of Truth (SSOT):** Centralized rules in `.shared-rules/` synchronized across Cursor (`.cursor/rules/`), Claude Code (`CLAUDE.md`), and Antigravity (`AGENT_WORKSPACE.md`).
- **Modern Multiplatform Stack:** Kotlin 2.1+, Compose Multiplatform 1.7+, Ktor 3.x, Room 3 KMP (`BundledSQLiteDriver`), and Koin 4.x.
- **Native Swift & iOS Interop:** Pre-configured [SKIE](https://skie.touchlab.co/) bridge converting Kotlin `StateFlow` and sealed hierarchies directly into Swift `AsyncSequence`, `@Observable` macros, and pattern-matchable enums.
- **Strict UDF Contracts:** Sealed `UiState`, `UiIntent`, and single-fire `UiEffect` pipelines with `stateIn(WhileSubscribed(5000))` and `Channel.receiveAsFlow()`.
- **Convention Plugins (`build-logic`):** Clean, reusable Gradle plugins (`kit.kmp.library`, `kit.kmp.feature`, `kit.android.application`) managing SDKs, targets, and compiler flags.
- **Automated Scaffolding & Verification:** Zero-dependency Python tools to scaffold features and statically lint code for banned anti-patterns before compilation.

---

## 📁 Repository Layout

```text
├── .shared-rules/       # Central SSOT guidelines (Architecture, Compose, KMP, Swift, Tests)
├── .cursor/rules/       # Cursor IDE rules mapped with target file globs (*.mdc)
├── .claude/             # Claude Code slash commands (/scaffold-feature, /review-compose, /verify)
├── .antigravity/        # Antigravity task gates and agent role execution boundaries
├── build-logic/         # Gradle Convention Plugins (build-logic hierarchy)
├── core/
│   ├── network/         # Ktor 3 client factory + OkHttp / Darwin engines
│   ├── database/        # Room 3 KMP database + multiplatform driver builders
│   └── designsystem/    # Material 3 Adaptive tokens, Theme, Typography, Colors
├── feature/             # Feature modules (:domain, :data, :ui)
│   └── auth/            # Reference authentication feature module
├── composeApp/          # Multiplatform & Android entry application
├── iosApp/              # Native iOS SwiftUI application with SKIE bindings
├── gradle/
│   └── libs.versions.toml # Conflict-free central version catalog
├── tools/               # Automation scripts (scaffolding, static AST linter, verification)
├── CLAUDE.md            # Claude Code entry point
└── AGENT_WORKSPACE.md   # Antigravity & multi-agent workspace configuration
```

---

## 🤖 AI Agent Setup Guide

### 1. Cursor Setup
Open the repository in Cursor. Context rules activate automatically based on file globs:
- Editing `*Screen.kt` attaches `02-compose-guidelines.mdc`.
- Editing `commonMain/**/*.kt` attaches `03-kmp-guidelines.mdc`.
- Editing `iosApp/**/*.swift` attaches `04-swiftui-interop.mdc`.

### 2. Claude Code Setup
Launch Claude Code in your terminal from the project root. Use pre-configured slash commands:
- `/scaffold-feature <name>`: Automatically builds `:domain`, `:data`, and `:ui` modules and registers them.
- `/review-compose`: Audits Compose code for unstable lambdas, missing keys, and un-remembered objects.
- `/verify`: Runs the cross-platform compile and test suite.

### 3. Google Antigravity Setup
Open the project with Google Antigravity. `AGENT_WORKSPACE.md` and `.antigravity/gates/task_verification_gates.json` enforce:
- Role isolation: `SharedCoreAgent` (Core & Domain), `AndroidUiAgent` (Compose UI), `IosNativeAgent` (SwiftUI).
- Mandatory verification gates: Prevents task completion if architecture linting or compilation fails.

---

## ⌨️ Command Cheatsheet

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Scaffold Feature (3-Tier)** | `python tools/scaffold_feature.py <name> [pkg]` | Generates enterprise `:domain`, `:data`, and `:ui` modules |
| **Scaffold Feature (Lightweight)** | `python tools/scaffold_feature.py <name> -l` | Generates single-module `:feature:<name>` for fast MVPs |
| **Lint Architecture (Static)** | `python tools/verify_architecture.py` | Fast static check for SSOT rule violations (comments-stripped) |
| **Lint Architecture (Semantic)**| `./gradlew testDebugUnitTest` | Runs Konsist AST-level architectural unit tests |
| **Verify Builds** | `./tools/verify_build.sh` | Compiles Android, KMP Common, iOS Simulator & tests |
| **Claude Scaffold** | `/scaffold-feature <name>` | In-chat slash command for module generation |
| **Claude Compose Audit**| `/review-compose` | In-chat audit for Compose anti-patterns |
| **Setup Dev Env** | `./tools/setup_dev_environment.sh` | Installs `.githooks` and executable permissions |

---

## 📋 Dependency Catalog Summary

| Category | Primary Library | Version | Role |
| :--- | :--- | :--- | :--- |
| **Toolchain** | Kotlin / AGP | `2.1.10` / `8.8.1` | K2 Compiler & Gradle plugins |
| **UI** | Compose Multiplatform | `1.7.3` | Shared declarative UI |
| **Navigation** | Navigation Compose | `2.8.7` | Type-safe navigation (`@Serializable`) |
| **Network** | Ktor Client | `3.1.0` | Multiplatform networking (`OkHttp` + `Darwin`) |
| **Database** | Room KMP | `2.7.0-alpha13` | SQLite-backed local persistence (`BundledSQLiteDriver`) |
| **DI** | Koin | `4.0.2` | Multiplatform Dependency Injection |
| **iOS Interop** | SKIE | `0.10.1` | Swift Concurrency & `@Observable` bridge |
| **Testing** | Turbine / Kotest | `1.2.0` / `5.9.1` | Coroutines Flow unit testing |

---

## 🧪 CI/CD Matrix Pipeline

All pull requests and commits run through a dual-runner matrix on GitHub Actions:
- **Ubuntu Runner (`ubuntu-latest`):** Executes static architecture linting, Android builds, KMP metadata generation, and unit tests via `./gradlew testDebugUnitTest`.
- **macOS Runner (`macos-14`):** Executes Apple Silicon iOS target framework compilation via `./gradlew compileKotlinIosSimulatorArm64`.

---

## 📄 License

Licensed under the Apache License, Version 2.0 (the "License"). See [LICENSE](LICENSE) for details.
