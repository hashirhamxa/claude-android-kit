<div align="center">

# 🚀 Claude Android Kit
### Production Multiplatform AI Mobile Toolkit

[![CI](https://github.com/hashirhamxa/claude-android-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/hashirhamxa/claude-android-kit/actions/workflows/ci.yml)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.1.10-7F52FF.svg?logo=kotlin&logoColor=white)](https://kotlinlang.org)
[![Compose Multiplatform](https://img.shields.io/badge/Compose_Multiplatform-1.7.3-4285F4.svg?logo=jetpackcompose&logoColor=white)](https://www.jetbrains.com/lp/compose-multiplatform/)
[![Swift](https://img.shields.io/badge/Swift-6.0-F05138.svg?logo=swift&logoColor=white)](https://swift.org)
[![Konsist](https://img.shields.io/badge/Architecture_Tests-Konsist-orange.svg)](https://konsist.lemonappdev.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Release-v1.1.0-green.svg)](VERSION)

**A production-grade mobile architecture and AI developer toolkit bridging Jetpack Compose, Kotlin Multiplatform (KMP), Android Native, and Native iOS (SwiftUI).**  
*Ships with 8 specialized AI Subagents, 5 Workflow Skills, 7 Slash Commands, and SSOT Architecture Rules to eliminate LLM hallucinations and code drift across Claude Code, Cursor, and Google Antigravity.*

</div>

---

## ⚡ Instant One-Line Bootstrapper

Bootstrap a brand-new project with package renaming, git initialization, and architecture hooks in one command:

```bash
# Enterprise 3-Tier Architecture (:domain, :data, :ui)
curl -sSL https://raw.githubusercontent.com/hashirhamxa/claude-android-kit/main/init.sh | bash -s my-awesome-app com.mycompany.app

# Lightweight / Single-Module Profile (Fast MVPs & Hackathons)
curl -sSL https://raw.githubusercontent.com/hashirhamxa/claude-android-kit/main/init.sh | bash -s my-awesome-app com.mycompany.app --lightweight
```

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    .shared-rules/ (SSOT)                    │
│             UDF • Compose • KMP • Swift • Tests             │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Dynamic Rule & Agent Binding)
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│    Claude Code    │  │      Cursor       │  │ Google Antigravity│
│     CLAUDE.md     │  │   .cursor/rules/  │  │ AGENT_WORKSPACE.md│
│ 8 Agents • 7 Cmds │  │    *.mdc Globs    │  │ Verification Gates│
│     5 Skills      │  │                   │  │                   │
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

## 🤖 AI Subagents (`agents/`)

The toolkit includes 8 specialized domain subagents engineered for deep contextual pair programming:

| Subagent | Role & Specialization | Typical Prompts / Use Cases |
| :--- | :--- | :--- |
| **`@android-architect`** | Module architecture, dependency flow, Clean Architecture boundaries, and UDF contracts. | *"Design the module structure for an offline-first chat feature."* |
| **`@compose-reviewer`** | Jetpack & CMP UI performance, stability tags, strong skipping analysis, and a11y audits. | *"Audit this screen composable for unnecessary recompositions."* |
| **`@gradle-resolver`** | Dependency conflicts, version catalogs, Gradle convention plugins, and multi-project sync. | *"Fix dependency collision between Ktor 3 and Coil 3."* |
| **`@kmp-migration-planner`** | Android Native $\rightarrow$ KMP migration strategies, `expect`/`actual` extraction, and SKIE interop. | *"Plan migration of our Android Room database to Room 3 KMP."* |
| **`@android-build-resolver`** | Deep build error diagnostics: R8/ProGuard rules, AGP compatibility, KSP/KAPT, compiler bugs. | *"Diagnose this R8 NoSuchMethodError in the release APK."* |
| **`@android-security-reviewer`** | Pre-release audits: Biometrics, Keystore/Keychain, network security config, and secret handling. | *"Audit our authentication token storage implementation."* |
| **`@kotlin-reviewer`** | Coroutines & Flow concurrency safety, immutable domain models, and repository contracts. | *"Review this repository implementation for structured concurrency bugs."* |
| **`@room-migration-planner`** | Database schema evolution, auto-migrations, DDL validation, and `MigrationTestHelper` tests. | *"Write a schema migration from v1 to v2 adding an encrypted column."* |

---

## 🧠 AI Skills (`skills/`)

Pre-packaged multi-step workflows that guide AI agents through end-to-end development recipes:

1. **`feature-vertical-slice`**: Bootstraps full vertical-slice features across `:domain`, `:data`, `:ui`, and DI in a single deterministic pass.
2. **`ui-from-image`**: Converts Figma designs, wireframes, and screenshot images directly into pixel-perfect, responsive Compose UI code.
3. **`gradle-troubleshooting`**: Systematic 5-step diagnostic playbook for diagnosing and resolving complex Gradle and KMP build failures.
4. **`new-project-android`**: Step-by-step wizard for scaffolding pure native Android applications with Jetpack Compose.
5. **`new-project-kmm`**: Complete scaffolding playbook for dual-target Android + Native iOS SwiftUI applications.

---

## ⌨️ Slash Commands (`commands/`)

Fast terminal shortcuts available inside Claude Code and AI chat environments:

| Slash Command | Description | Example Usage |
| :--- | :--- | :--- |
| **`/new-android`** | Bootstraps a brand new native Android project with opinionated defaults. | `/new-android MyApp com.company.app` |
| **`/new-kmm`** | Bootstraps a full Kotlin Multiplatform + iOS SwiftUI project. | `/new-kmm MyApp com.company.app` |
| **`/new-feature`** | Scaffolds a vertical slice feature module (`:domain`, `:data`, `:ui`). | `/new-feature payment` |
| **`/compose-review`** | Performs a deep performance and stability audit on Compose UI code. | `/compose-review PaymentScreen.kt` |
| **`/gradle-fix`** | Diagnoses and resolves Gradle build errors and dependency mismatches. | `/gradle-fix` |
| **`/ui-from-image`** | Generates Compose UI composables from an image or screenshot asset. | `/ui-from-image assets/login.png` |
| **`/audit-kit`** | Audits the current repository against `.shared-rules/` SSOT rules. | `/audit-kit` |

---

## ✨ Key Features

- **Single Source of Truth (SSOT):** Centralized rules in `.shared-rules/` synchronized across Cursor (`.cursor/rules/`), Claude Code (`CLAUDE.md`), and Antigravity (`AGENT_WORKSPACE.md`).
- **Semantic Konsist Testing:** AST-level architectural tests in `composeApp/src/commonTest/` preventing architecture drift and forbidden imports.
- **Modern Multiplatform Stack:** Kotlin 2.1+, Compose Multiplatform 1.7+, Ktor 3.x, Room 3 KMP (`BundledSQLiteDriver`), and Koin 4.x.
- **Native Swift & iOS Interop:** Pre-configured [SKIE](https://skie.touchlab.co/) bridge converting Kotlin `StateFlow` and sealed hierarchies directly into Swift `AsyncSequence`, `@Observable` macros, and pattern-matchable enums.
- **Strict UDF Contracts:** Sealed `UiState`, `UiIntent`, and single-fire `UiEffect` pipelines with `stateIn(WhileSubscribed(5000))` and `Channel.receiveAsFlow()`.
- **Convention Plugins (`build-logic`):** Reusable Gradle plugins (`kit.kmp.library`, `kit.kmp.feature`, `kit.android.application`) managing SDKs, targets, and compiler flags.
- **Dual Scaffolding Profiles:** Enterprise 3-tier modularization or lightweight single-module feature generation via CLI flags.

---

## 📁 Repository Layout

```text
├── .shared-rules/       # Central SSOT guidelines (Architecture, Compose, KMP, Swift, Tests)
├── .cursor/rules/       # Cursor IDE rules mapped with target file globs (*.mdc)
├── .claude/             # Claude Code slash commands (/scaffold-feature, /review-compose, /verify)
├── .antigravity/        # Antigravity task gates and agent role execution boundaries
├── agents/              # 8 Specialized domain subagents (@android-architect, @compose-reviewer, etc.)
├── skills/              # 5 Multi-step AI workflow skills (ui-from-image, vertical-slice, etc.)
├── commands/            # 7 Slash command definitions for interactive development
├── build-logic/         # Gradle Convention Plugins (build-logic hierarchy)
├── core/
│   ├── network/         # Ktor 3 client factory + OkHttp / Darwin engines
│   ├── database/        # Room 3 KMP database + multiplatform driver builders
│   └── designsystem/    # Material 3 Adaptive tokens, Theme, Typography, Colors
├── feature/             # Feature modules (:domain, :data, :ui)
│   └── auth/            # Reference authentication feature module
├── composeApp/          # Multiplatform & Android entry application + Konsist tests
├── iosApp/              # Native iOS SwiftUI application with SKIE bindings
├── gradle/
│   └── libs.versions.toml # Conflict-free central version catalog
├── tools/               # Automation scripts (scaffolding, static AST linter, verification)
├── CLAUDE.md            # Claude Code entry point
└── AGENT_WORKSPACE.md   # Antigravity & multi-agent workspace configuration
```

---

## 🚀 Quick Start

### 1. Developer Environment Setup
Run the bootstrap script to configure local Git hooks and permissions:

```bash
chmod +x tools/setup_dev_environment.sh
./tools/setup_dev_environment.sh
```

### 2. Scaffold a New Feature
Generate a feature module with complete UDF contracts:

```bash
# Enterprise 3-Tier (:domain, :data, :ui)
python tools/scaffold_feature.py profile com.kit

# Lightweight Single-Module (Fast MVPs)
python tools/scaffold_feature.py profile com.kit --lightweight
```

Then register the new modules in `settings.gradle.kts`:

```kotlin
include(":feature:profile:domain")
include(":feature:profile:data")
include(":feature:profile:ui")
```

### 3. Run Architectural Testing
Verify code constraints via static and AST-level checks:

```bash
# Fast Static Linter (Comment-stripped)
python tools/verify_architecture.py

# Semantic Konsist Unit Tests
./gradlew testDebugUnitTest
```

### 4. Cross-Platform Compilation Check
Validate Android, KMP Common metadata, and native iOS simulator targets:

```bash
./tools/verify_build.sh
```

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
| **Architecture Tests** | Konsist | `0.17.3` | Semantic architectural unit testing |
| **Testing** | Turbine / Kotest | `1.2.0` / `5.9.1` | Coroutines Flow unit testing |

---

## 🧪 CI/CD Matrix Pipeline

All pull requests and commits run through a dual-runner matrix on GitHub Actions:
- **Ubuntu Runner (`ubuntu-latest`):** Executes static architecture linting, Android builds, KMP metadata generation, and Konsist/Turbine unit tests via `./gradlew testDebugUnitTest`.
- **macOS Runner (`macos-14`):** Executes Apple Silicon iOS target framework compilation (`compileKotlinIosSimulatorArm64`) and Xcode simulator verification.

---

## 📄 License

Licensed under the Apache License, Version 2.0 (the "License"). See [LICENSE](LICENSE) for details.
