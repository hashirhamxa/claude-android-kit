# Claude Code Project Configuration: Mobile Multiplatform Kit

## Architecture & SSOT
All development must strictly adhere to the single source of truth rules located in `.shared-rules/`:
- `01-architecture-udf.md`: Unidirectional Data Flow, StateFlow production, Clean boundaries.
- `02-compose-guidelines.md`: Compose stability, collectAsStateWithLifecycle, Navigation.
- `03-kmp-guidelines.md`: Multiplatform dependencies, Ktor 3, Room KMP.
- `04-swiftui-interop.md`: SKIE bridge, Swift 6 concurrency, Observable wrappers.
- `05-testing-verification.md`: Turbine flow testing, test conventions.

## Build & Verification Commands
- Check Android & KMP Compilation: `./gradlew compileDebugKotlin compileKotlinIosSimulatorArm64`
- Run All Common Unit Tests: `./gradlew allTests` or `./gradlew testDebugUnitTest`
- Lint & Code Style: `./gradlew ktlintCheck` or `./gradlew detekt`

## Core Rules
1. Never introduce raw string navigation routes (must use `@Serializable`).
2. Never use `collectAsState()` in Compose; always use `collectAsStateWithLifecycle()`.
3. Never put Android SDK imports (`android.*`) in `commonMain`.
4. Run `./gradlew compileDebugKotlin compileKotlinIosSimulatorArm64` before completing any multi-file feature refactoring.
