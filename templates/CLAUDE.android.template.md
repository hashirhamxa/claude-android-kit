# CLAUDE.md — {{APP_NAME}}

Project-level Claude Code configuration for {{APP_NAME}}. Layered on top of `~/.claude/rules/*`; anything here overrides or extends the globals.

## Project

- **Name:** {{APP_NAME}}
- **Package:** {{PACKAGE}}
- **Platform:** Android (pure, not KMP)
- **Min SDK:** {{MIN_SDK}}
- **Target / Compile SDK:** {{TARGET_SDK}}
- **Language:** Kotlin ({{KOTLIN_VERSION}})
- **Started:** {{DATE}}

## One-line summary

{{ONE_LINER}}

## Stack

| Concern | Choice |
|---|---|
| UI | Jetpack Compose |
| DI | Manual (AppContainer) — no Hilt, no Koin |
| Architecture | Clean Architecture + MVVM, vertical feature slices |
| Local DB | Room + KSP |
| Networking | Ktor (OkHttp engine) |
| Async | Kotlin Coroutines + Flow |
| Nav | Compose Navigation with serializable routes |
| Logging | Timber (DebugTree in debug, CrashlyticsTree in release) |
| Analytics | {{ANALYTICS_OR_NONE}} |
| Crash reporting | {{CRASH_OR_NONE}} |
| Auth | {{AUTH}} |
| Backend | {{BACKEND}} |
| Testing | JUnit 4, Turbine, MockK, in-memory Room |

## Module map

```
app/
├── di/               # AppContainer, feature containers
├── ui/
│   ├── theme/        # AppTheme, Color, Type, Shape
│   ├── nav/          # AppNavHost, Route definitions
│   ├── common/       # Shared composables
│   └── <feature>/    # Route, Screen, ViewModel, UiState, components/
├── domain/
│   ├── model/        # Pure Kotlin domain types
│   ├── repository/   # Repository interfaces
│   └── usecase/      # Business logic (when warranted)
└── data/
    ├── local/        # Room entities, DAOs, AppDatabase, migrations
    ├── remote/       # Ktor API classes, DTOs
    ├── mapper/       # Dto ↔ Entity ↔ Domain ↔ UI
    └── repository/   # Default<Feature>Repository implementations
```

## Conventions (project-specific, in addition to ~/.claude/rules)

- **Feature ownership:** every feature folder owns its UI layer and its repository implementation. Shared models go in `domain/model/`. Reuse over duplication.
- **State:** one `StateFlow<<Feature>UiState>` per view model. Never expose `MutableStateFlow`.
- **Navigation:** `@Serializable object <Feature>Route` for no-arg destinations; `@Serializable data class <Feature>Route(...)` for parameterized. Never pass domain types through nav — pass IDs.
- **Migrations:** every schema change bumps the DB version and adds an explicit `Migration` object. No `fallbackToDestructiveMigration()` in production builds.
- **BuildConfig:** secrets flow through `local.properties` → `buildConfigField` → `BuildConfig`. Never hardcoded.

## Known pitfalls

- {{PITFALL_1 — e.g. "Compose Compiler is pinned to 1.5.11 because we're on Kotlin 1.9.23. When upgrading Kotlin, update both."}}
- {{PITFALL_2}}

## Common tasks

```bash
./gradlew assembleDebug                     # Build debug
./gradlew :app:testDebugUnitTest            # Run unit tests
./gradlew :app:testDebugUnitTest --tests *<Feature>*   # Run one feature's tests
./gradlew :app:lintDebug                    # Run lint
./gradlew :app:dependencies                 # Show dep graph
./gradlew :app:dependencyUpdates            # Check for newer versions (with gradle-versions-plugin)
```

## Agents and commands to use

- `/new-feature <n>` — scaffold a vertical slice.
- `/compose-review <file>` — review UI code.
- `/gradle-fix` — debug build failures.
- `@android-architect` — architectural decisions.

## Open TODOs

- [ ] Add Firebase Crashlytics wiring once `google-services.json` is in place.
- [ ] Set up Play Integrity for production builds.
- [ ] Write migration path for first schema bump.
- [ ] {{CUSTOM_TODO}}

## Do not

- Do not introduce Hilt or Koin. If the AppContainer pattern hits a real limit, discuss before switching.
- Do not add XML layouts. Compose-only.
- Do not commit `local.properties` or any Firebase/Supabase keys.
- Do not log PII, tokens, or raw user content in release.
