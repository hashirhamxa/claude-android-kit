# Google Antigravity Agent Workspace Specification

## System Directives
This workspace contains a multiplatform Kotlin & Swift codebase. Agents must conform to the architecture rules in `.shared-rules/`.

## Multi-Agent Execution Lanes

| Agent Role | Scope Restrictions | Primary Verification Command |
| :--- | :--- | :--- |
| **Shared Core Agent** | `commonMain/`, `:core:*`, `:feature:*:domain`, `:feature:*:data` | `./gradlew compileKotlinMetadata compileKotlinIosSimulatorArm64` |
| **Android UI Agent** | `androidMain/`, `:feature:*:ui` | `./gradlew compileDebugKotlin testDebugUnitTest` |
| **iOS Native Agent** | `iosApp/`, Swift source files | `xcodebuild -workspace iosApp.xcworkspace -scheme iosApp -sdk iphonesimulator build` |
| **QA / Verifier Agent**| Root orchestration & test suites | `./gradlew check allTests` |

## Task Completion Gates (Strict)
Before generating task artifacts or marking a feature complete:
1. **Zero Unchecked Imports:** Ensure no Android-specific packages (`android.*`, `androidx.compose.*`) exist in `commonMain`.
2. **KMP Simulator Verification:** `./gradlew compileKotlinIosSimulatorArm64` must return exit code `0`.
3. **UDF Contract Compliance:** Verify `UiState` is sealed and exposed exclusively via `StateFlow`.
