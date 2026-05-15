# KMP Layering

For Kotlin Multiplatform (KMP) and Compose Multiplatform (CMP) projects. If the project is pure Android, ignore this file.

## Shared module structure

```
shared/
├── build.gradle.kts
└── src/
    ├── commonMain/
    │   ├── kotlin/com/hash/app/
    │   │   ├── domain/          # Models, use cases, repository interfaces
    │   │   ├── data/            # Repository implementations, DTOs, API clients
    │   │   ├── di/              # AppContainer (expect), Factories
    │   │   └── util/
    │   └── sqldelight/          # SQLDelight schema files
    ├── commonTest/
    ├── androidMain/             # Android-specific implementations
    ├── iosMain/                 # iOS-specific implementations
    └── iosTest/
```

## Project module structure (AGP 9.0+)

AGP 9.0 forbids applying the `com.android.application` plugin inside a module that also has `kotlin("multiplatform")`. The canonical KMP project structure separates concerns into distinct Gradle modules.

Default layout:

```
<AppName>/
├── shared/             <- pure KMP library (kotlin("multiplatform") + com.android.library)
├── androidApp/         <- Android entry point (com.android.application only, depends on :shared)
├── desktopApp/         <- optional desktop entry point (depends on :shared)
├── webApp/             <- optional web entry point (depends on :shared)
└── iosApp/             <- Xcode project (not a Gradle module)
```

The `shared` module contains all domain, data, and shared UI code, including Compose Multiplatform screens and view models. Platform app modules are thin shells that wire the platform entry point and depend on `:shared`.

**The invariant:** `shared/build.gradle.kts` must have `kotlin("multiplatform")` and `com.android.library`. It must never have `com.android.application`.

Verify with:

```bash
grep "android.application" shared/build.gradle.kts   # must return nothing
```

**Migration signal:** If your project has a single `composeApp` module applying both `kotlin("multiplatform")` and `com.android.application`, it needs migration before AGP 9.0. Invoke `@kmp-migration-planner` with the prompt "migrate from composeApp monolith to shared + androidApp structure."

Optional split for projects with native platform UI:

```
shared-logic/    <- business logic only (no Compose dependency)
shared-ui/       <- shared Compose UI (depends on :shared-logic)
androidApp/      <- depends on :shared-ui and :shared-logic
```

Use the shared-logic / shared-ui split when some platform targets use native UI (e.g. SwiftUI on iOS) and you want to avoid a Compose dependency in the shared module for those targets. For projects where all targets use Compose Multiplatform, a single `shared` module is sufficient.

## What goes in commonMain

- Domain models, use cases, repository interfaces.
- Ktor clients (Ktor is fully multiplatform).
- SQLDelight queries and generated code.
- Business logic that doesn't depend on platform APIs.
- Kotlinx.serialization, kotlinx.coroutines, kotlinx.datetime.

If it compiles without `expect`, it belongs in `commonMain`.

## What goes in platform mains

- SQLDelight driver (`AndroidSqliteDriver` vs. `NativeSqliteDriver`).
- Ktor engine (`OkHttp` on Android, `Darwin` on iOS).
- Settings/preferences (`multiplatform-settings` with platform constructors).
- File system access.
- Platform-specific auth (Firebase SDK on Android, native on iOS).
- Biometric/secure storage.

## expect / actual discipline

`expect` is a last resort, not a default. Before reaching for it, try:

1. A common interface + platform-specific factories injected via the container.
2. A multiplatform library that already handles the split (Ktor, SQLDelight, Napier, Settings).
3. Pushing the platform-specific logic up to the UI layer where platform code lives anyway.

When you do use `expect`, keep the surface area tiny:

```kotlin
// commonMain
expect class DatabaseDriverFactory() {
    fun create(): SqlDriver
}

// androidMain
actual class DatabaseDriverFactory(private val context: Context) {
    actual fun create(): SqlDriver =
        AndroidSqliteDriver(AppDatabase.Schema, context, "app.db")
}

// iosMain
actual class DatabaseDriverFactory {
    actual fun create(): SqlDriver =
        NativeSqliteDriver(AppDatabase.Schema, "app.db")
}
```

## Dependency container split

One `expect class AppContainer` in commonMain, two `actual` implementations:

```kotlin
// commonMain
expect class AppContainer {
    val transactionRepository: TransactionRepository
    val userRepository: UserRepository
}

// androidMain
actual class AppContainer(context: Context) { ... }

// iosMain
actual class AppContainer { ... }
```

The iOS side wires the container in Swift's `@main` entry. The Android side wires it in `App.onCreate()`.

## Compose Multiplatform vs. native UI

Default: Compose Multiplatform if the project targets Android + iOS and both apps need feature parity.

Switch to native UI (SwiftUI for iOS) when:

- iOS needs Apple-specific patterns that CMP doesn't wrap well.
- Team has a strong Swift developer.
- Performance-sensitive screens need native feel.

Hybrid is fine: CMP for most screens, SwiftUI bridged for specific ones.

## iOS framework packaging

- Regular Kotlin framework (not CocoaPods) unless the iOS team specifically needs Pod integration.
- Use `isStatic = true` for release builds to avoid dynamic linking overhead.
- Expose a thin `IosAppContainer` wrapper to Swift — Swift consumers should not touch Kotlin types directly except through factories.

## Build setup essentials

- `kotlin("multiplatform")` version matched to Compose Compiler matrix.
- Hierarchical source sets (default in Kotlin 1.9+).
- `android()` target with `compileSdk` matching Gradle plugin requirements.
- `iosX64`, `iosArm64`, `iosSimulatorArm64` as three separate targets with a shared `iosMain`.

## What not to share

Don't force-share:

- Navigation logic that depends on `NavController` vs. `UINavigationController`.
- Analytics SDKs.
- Crash reporters (Firebase Crashlytics on Android, a native SDK on iOS).
- Push notifications — the token retrieval and handling is platform-specific even if the backend is shared.

Share the API calls to your backend. Don't share the plumbing that wires them to platform capabilities.

## Testing

- `commonTest` — test every common module with kotlin.test.
- Turbine works in commonTest.
- MockK doesn't work on iOS; use fake implementations or Mockative for multiplatform mocking.
- Integration tests live in platform-specific test source sets.
