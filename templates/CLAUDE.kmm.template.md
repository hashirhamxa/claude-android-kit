# CLAUDE.md — {{APP_NAME}}

Project-level Claude Code configuration for {{APP_NAME}}. Layered on top of `~/.claude/rules/*`; anything here overrides or extends the globals.

## Project

- **Name:** {{APP_NAME}}
- **Package:** {{PACKAGE}}
- **Targets:** Android + iOS ({{EXTRA_TARGETS}})
- **Android min SDK:** {{MIN_SDK}}
- **iOS deployment target:** {{IOS_DEPLOYMENT}}
- **Kotlin:** {{KOTLIN_VERSION}}
- **Compose Multiplatform:** {{COMPOSE_VERSION}}
- **Started:** {{DATE}}

## One-line summary

{{ONE_LINER}}

## Stack

| Concern | Choice |
|---|---|
| UI | Compose Multiplatform |
| DI | Manual — `expect class AppContainer`, actuals in `androidMain` and `iosMain` |
| Architecture | Clean Architecture + MVVM, shared business logic |
| Local DB | SQLDelight |
| Networking | Ktor (OkHttp engine on Android, Darwin on iOS) |
| Async | Kotlin Coroutines + Flow |
| Serialization | kotlinx-serialization |
| Date / time | kotlinx-datetime |
| Settings / prefs | multiplatform-settings |
| Logging | Napier |
| Auth | {{AUTH — e.g. Supabase Auth, Firebase Auth}} |
| Backend | {{BACKEND — e.g. Supabase, custom Ktor}} |
| Testing | kotlin.test, Turbine, Mockative (if needed), in-memory SQLDelight |
| Analytics | {{ANALYTICS_OR_NONE}} |
| Crash reporting | {{CRASH_OR_NONE}} |

## Module map

```
shared/                         # Business logic, shared across Android + iOS
├── commonMain/
│   ├── kotlin/<pkg>/
│   │   ├── domain/
│   │   │   ├── model/
│   │   │   ├── repository/    # Interfaces
│   │   │   └── usecase/
│   │   ├── data/
│   │   │   ├── local/
│   │   │   ├── remote/
│   │   │   ├── mapper/
│   │   │   └── repository/    # Implementations
│   │   ├── di/
│   │   │   └── AppContainer.kt   # expect
│   │   └── util/
│   └── sqldelight/<pkg>/      # .sq files
├── commonTest/
├── androidMain/
│   └── kotlin/<pkg>/
│       ├── di/AppContainer.kt  # actual
│       └── platform/
├── iosMain/
│   └── kotlin/<pkg>/
│       ├── di/AppContainer.kt  # actual
│       └── platform/
└── iosTest/

composeApp/                     # UI, Android app entry, iOS view controller
├── commonMain/                 # Shared composables, view models
├── androidMain/                # MainActivity
└── iosMain/                    # MainViewController bridge

iosApp/                         # Xcode project — SwiftUI shell that embeds Compose
└── iosApp.xcodeproj
```

## Source set rules (project-specific)

- Start every new type in `commonMain`. Move to platform source sets only when platform APIs are needed.
- `expect/actual` is the last resort. Prefer interface + platform factory when the surface is non-trivial or needs mocking.
- No Android-only imports in `commonMain`: `android.*`, `androidx.*`, `java.io.File`, `java.util.Date`.
- iOS target set: `iosX64`, `iosArm64`, `iosSimulatorArm64` with a shared `iosMain`.

## Conventions (in addition to ~/.claude/rules)

- **View models in commonMain** using `MutableStateFlow<UiState>` + Kotlin coroutines. On Android, reach them via a view model wrapper with `ViewModelScope`; on iOS, let Swift subscribe via `skie` or a custom `FlowWrapper`.
- **Navigation:** {{NAV_CHOICE — e.g. "Voyager" or "PreCompose" or "custom state-hoisted nav"}}.
- **Resources:** text and images through `compose.components.resources`, not `R.string.*` or `NSLocalizedString`.
- **Logging:** `Napier.plant` once per platform on app start. Never `println` in commonMain.

## Known pitfalls

- iOS framework cache invalidation: when the `shared` module's public API changes, Xcode sometimes holds onto the old framework. If Swift sees missing symbols, run `./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64` and rebuild in Xcode.
- Compose preview doesn't render on iOS — only Android. Use iOS Simulator for iOS UI work.
- `kotlinx-datetime` has no built-in formatting for human-readable dates. Use `LocalDateTime.format()` APIs or a small formatter helper per locale.
- {{PITFALL_1}}

## Common tasks

```bash
# Android
./gradlew :composeApp:assembleDebug
./gradlew :composeApp:installDebug
./gradlew :composeApp:testDebugUnitTest

# Shared
./gradlew :shared:allTests                            # commonTest + platform tests
./gradlew :shared:iosSimulatorArm64Test

# iOS framework
./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64

# Open iOS project
open iosApp/iosApp.xcodeproj
```

## Agents and commands

- `/new-feature <n>` — add a vertical slice across `shared` and `composeApp`.
- `/compose-review <file>` — review UI.
- `/gradle-fix` — build failures.
- `@android-architect` — architectural decisions (covers KMP too).
- `@kmp-migration-planner` — move code between source sets.

## Open TODOs

- [ ] Wire analytics for both platforms.
- [ ] Set up iOS entitlements for {{FEATURE}}.
- [ ] Add CI for both `:composeApp:assembleDebug` and iOS framework build.
- [ ] {{CUSTOM_TODO}}

## Do not

- Do not introduce Hilt or Koin. AppContainer expect/actual only.
- Do not use Room — SQLDelight for KMP. Room is Android-only and breaks the shared layer.
- Do not use OkHttp directly in commonMain — it's Android-only. Use Ktor, with OkHttp engine on androidMain and Darwin on iosMain.
- Do not commit `local.properties` or secrets. Both platforms read from `local.properties` via BuildConfig on Android; iOS reads from `.xcconfig` or a generated Swift file.
- Do not push view model state types into Swift as raw `StateFlow` — wrap them with a bridge that Swift can observe cleanly.
