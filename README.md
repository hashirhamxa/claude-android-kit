# Claude Android Kit: Production Multiplatform AI Mobile Toolkit

A production-grade mobile architecture and AI developer toolkit bridging Jetpack Compose, Kotlin Multiplatform (KMP), Android Native, and Native iOS (SwiftUI). Engineered to eliminate LLM hallucinations and code drift across Claude Code, Cursor, and Google Antigravity.

---

## 🏛️ System Architecture

```text
┌───────────────────────────────────┐
│        .shared-rules/ (SSOT)      │
│  UDF • Compose • KMP • Swift • CI │
└─────────────────┬─────────────────┘
                  │
  ┌───────────────┼───────────────┐
  ▼               ▼               ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│    Claude Code    │  │      Cursor       │  │ Google Antigravity│
│     CLAUDE.md     │  │   .cursor/rules/  │  │ AGENT_WORKSPACE.md│
│  .claude/commands │  │    *.mdc Globs    │  │ Verification Gates│
└───────────────────┘  └───────────────────┘  └───────────────────┘
  │                       │                      │
  └───────────────────────┼──────────────────────┘
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
│   │    Ktor 3 (OkHttp/Darwin)     │               │           Room KMP            │   │
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
│   │        Android Target         │               │          iOS Target           │   │
│   │   Compose • Navigation 2.8+   │               │   SwiftUI • SKIE Observable   │   │
│   └───────────────────────────────┘               └───────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

- **Single Source of Truth (SSOT) Architecture:** Centralized rules in `.shared-rules/` prevent code drift and synchronize constraints across Cursor, Claude Code, and Antigravity.
- **Modern Multiplatform Stack:** Kotlin 2.1+, Jetpack Compose Multiplatform, Ktor 3.x, Room 3 KMP with SQLite Bundled Driver, and Koin 4.x.
- **Native Swift & iOS Interop:** Pre-configured [SKIE](https://skie.touchlab.co/) bridge converting Kotlin `StateFlow` and sealed hierarchies directly into Swift `AsyncSequence`, `@Observable` macros, and pattern-matchable enums.
- **Strict UDF Contracts:** Standardized `UiState` (sealed interface), `UiIntent`, and single-fire `UiEffect` pipelines with `stateIn(WhileSubscribed(5000))`.
- **Zero-Boilerplate Build Logic:** Custom Gradle convention plugins (`kit.kmp.library`, `kit.kmp.feature`, `kit.android.application`) managing SDKs, targets, and compiler options.
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
Generate a 3-tier Clean Architecture feature (`:domain`, `:data`, `:ui`) with complete UDF contracts:

```bash
python tools/scaffold_feature.py <feature_name> [package_name]
# Example: python tools/scaffold_feature.py profile com.kit
```

Then register the new modules in `settings.gradle.kts`:

```kotlin
include(":feature:profile:domain")
include(":feature:profile:data")
include(":feature:profile:ui")
```

### 3. Run Static Architecture Linting
Verify your code against the `.shared-rules/` SSOT without invoking a full build:

```bash
python tools/verify_architecture.py
```

### 4. Cross-Platform Compilation Check
Validate Android, KMP Common metadata, and native iOS simulator targets:

```bash
./tools/verify_build.sh
```

---

## 🤖 AI Agent Workflows

### Cursor
Open the repository in Cursor. Scoped rules (`.cursor/rules/*.mdc`) activate automatically when editing relevant files:
- Editing `*Screen.kt` attaches `02-compose-guidelines.mdc`.
- Editing `commonMain/**/*.kt` attaches `03-kmp-guidelines.mdc`.
- Editing `iosApp/**/*.swift` attaches `04-swiftui-interop.mdc`.

### Claude Code
Run Claude Code in your terminal. Use pre-configured custom slash commands:
- `/scaffold-feature <name>`: Automatically builds `:domain`, `:data`, and `:ui` modules and registers them.
- `/review-compose`: Audits Compose code for unstable lambdas, missing keys, and un-remembered objects.
- `/verify`: Runs the cross-platform compile and test suite.

### Google Antigravity
Open the project with Google Antigravity. The `AGENT_WORKSPACE.md` and `.antigravity/gates/task_verification_gates.json` enforce:
- Scope separation between `SharedCoreAgent`, `AndroidUiAgent`, and `IosNativeAgent`.
- Blocking verification gates that prevent task completion if architecture rules fail.

---

## 📋 Dependency Catalog Summary

| Category | Primary Library | Version | Role |
| :--- | :--- | :--- | :--- |
| **Toolchain** | Kotlin / AGP | `2.1.10` / `8.8.1` | K2 Compiler & Gradle plugins |
| **UI** | Compose Multiplatform | `1.7.3` | Shared declarative UI |
| **Navigation** | Navigation Compose | `2.8.7` | Type-safe navigation (`@Serializable`) |
| **Network** | Ktor Client | `3.1.0` | Multiplatform networking (`OkHttp` + `Darwin`) |
| **Database** | Room KMP | `2.7.0-alpha13` | SQLite-backed local persistence |
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

```text
Copyright 2026 Hashir Hamza

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
