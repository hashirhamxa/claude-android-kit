# Project Specification: Claude Android Kit

## 1. System Overview & Tech Stack
- **Languages:** Kotlin 2.1.10, Swift 6.0, Python 3.11+
- **UI Toolkits:** Jetpack Compose (Android), Compose Multiplatform 1.7.3 (CMP), SwiftUI (Native iOS)
- **Target SDKs:** Android Compile SDK 35, Min SDK 26, Target SDK 35; iOS 16.0+
- **Architecture Pattern:** Clean Architecture + Unidirectional Data Flow (UDF) / MVI
- **Concurrency:** Kotlin Coroutines 1.10.1 & Flow, Swift 6 Concurrency (`@MainActor`, `AsyncSequence`)
- **Networking:** Ktor 3.1.0 (OkHttp for Android, Darwin with ATS & pinning for iOS)
- **Local Persistence:** Room 3 KMP 2.7.0-alpha13 with `BundledSQLiteDriver`
- **Dependency Injection:** Koin 4.0.2 (`koin-compose`, `koin-compose-viewmodel`)
- **Interoperability:** SKIE 0.10.1 (Bridging Kotlin `StateFlow` & sealed classes into native Swift `@Observable` and enums)
- **Build System:** Gradle 8.8+ with Custom Convention Plugins (`build-logic/`)
- **Testing:** `kotlin.test`, Turbine 1.2.0, Konsist 0.17.3 (AST architecture testing)

## 2. Layer & Module Boundaries

```text
┌─────────────────────────────────────────────────────────────┐
│                          UI Layer                           │
│     (Compose Screen / SwiftUI View / ViewModel / Contract)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Invokes UseCases, Observes StateFlow)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Domain Layer                         │
│         (UseCases, Pure Models, Repository Contracts)        │
│              * ZERO ANDROID SDK IMPORTS *                   │
└──────────────────────────────▲──────────────────────────────┘
                               │ (Implements Contracts)
┌──────────────────────────────┴──────────────────────────────┐
│                         Data Layer                          │
│     (Repository Impls, Ktor DataSources, Room DAOs/Entities) │
└─────────────────────────────────────────────────────────────┘
```

## 3. Strict Non-Negotiable Constraints
1. **Zero Framework Imports in Domain:** `android.*` and `androidx.compose.ui.platform.LocalContext` are strictly forbidden in `commonMain` and `:domain` modules.
2. **Lifecycle State Collection:** Compose screens must collect state using `collectAsStateWithLifecycle()`. Raw `collectAsState()` is banned.
3. **Type-Safe Routing:** Navigation routes must use Kotlin `@Serializable` objects/data classes. Raw string paths (`"profile/{id}"`) are forbidden.
4. **Exhaustive Swift Enums:** Kotlin sealed hierarchies must be matched in Swift via SKIE `onEnum(of:)` pattern matching without `as?` casting.
5. **Pre-Commit Gate:** All proposed changes must pass `python tools/verify_architecture.py` and `./gradlew testDebugUnitTest`.
