---
description: Bootstrap a new KMP (Kotlin Multiplatform) project targeting Android + iOS with Compose Multiplatform, Manual DI, Ktor, SQLDelight, and shared domain/data layers.
argument-hint: <app-name> [package-name]
---

# /new-kmm

Bootstrap a new Kotlin Multiplatform project.

## Usage

```
/new-kmm Maidan com.hash.maidan
```

## What you produce

1. **Delegate to the `android-architect` agent** (same agent handles KMP decisions) for confirmation of the structure and target platforms. Default: Android + iOS. If the user needs desktop or web, surface that question.

2. **File structure (AGP 9.0 compatible):**
   ```
   <root>/
   ├── CLAUDE.md                               # From templates/CLAUDE.kmm.template.md
   ├── README.md
   ├── .gitignore                              # Android + Kotlin + Xcode
   ├── build.gradle.kts                        # Root
   ├── settings.gradle.kts                     # Includes :shared, :androidApp (+ :desktopApp if needed)
   ├── gradle.properties
   ├── gradle/
   │   └── libs.versions.toml
   ├── shared/                                 # Pure KMP library — no android application plugin
   │   ├── build.gradle.kts                   # kotlin("multiplatform") + android.library + compose
   │   └── src/
   │       ├── commonMain/
   │       │   ├── kotlin/<package-path>/
   │       │   │   ├── domain/
   │       │   │   │   ├── model/
   │       │   │   │   ├── repository/
   │       │   │   │   └── usecase/
   │       │   │   ├── data/
   │       │   │   │   ├── remote/             # Ktor client
   │       │   │   │   ├── local/              # SQLDelight DB wrapper
   │       │   │   │   └── repository/
   │       │   │   ├── di/
   │       │   │   │   └── AppContainer.kt     # expect class
   │       │   │   ├── ui/                     # Shared Compose screens + view models
   │       │   │   │   └── home/
   │       │   │   └── util/
   │       │   └── sqldelight/<package-path>/  # .sq files
   │       ├── commonTest/
   │       ├── androidMain/
   │       │   └── kotlin/<package-path>/
   │       │       ├── di/AppContainer.kt      # actual
   │       │       └── platform/               # Android-specific impls
   │       ├── iosMain/
   │       │   └── kotlin/<package-path>/
   │       │       ├── di/AppContainer.kt      # actual
   │       │       ├── MainViewController.kt   # iOS Compose entry point
   │       │       └── platform/
   │       └── iosTest/
   ├── androidApp/                             # Android application module (thin shell)
   │   ├── build.gradle.kts                   # com.android.application only — no multiplatform
   │   └── src/main/
   │       ├── AndroidManifest.xml
   │       └── kotlin/<package-path>/
   │           └── MainActivity.kt             # Sets up AppContainer, calls setContent { App() }
   └── iosApp/                                 # Xcode project (not Gradle-managed)
       ├── iosApp.xcodeproj/
       └── iosApp/
           ├── iOSApp.swift
           └── ContentView.swift               # Bridges to Compose via MainViewController
   ```

3. **libs.versions.toml defaults:**
   - Kotlin: latest stable.
   - AGP: matched.
   - Compose Multiplatform: latest stable.
   - Ktor: latest.
   - SQLDelight: latest.
   - kotlinx-datetime, kotlinx-serialization, kotlinx-coroutines.
   - multiplatform-settings for prefs.
   - Napier for multiplatform logging.

4. **shared/build.gradle.kts:**
   - `kotlin("multiplatform")`, `kotlin-serialization`, `sqldelight`, `android-library` plugins.
   - Targets: `androidTarget()`, `iosX64()`, `iosArm64()`, `iosSimulatorArm64()`.
   - iOS framework block: name after the app, `isStatic = true` for release.
   - Hierarchical source sets (default in recent Kotlin).
   - Ktor engine dependencies: `ktor-client-okhttp` in androidMain, `ktor-client-darwin` in iosMain.
   - SQLDelight driver deps matched by source set.

5. **androidApp/build.gradle.kts:**
   - Plugin: `com.android.application` only. No `kotlin("multiplatform")`, no Compose plugin.
   - `dependencies` block: `implementation(project(":shared"))`, `androidx.activity.compose`.
   - Standard `android` block: namespace, compileSdk, defaultConfig (applicationId, minSdk, targetSdk, versionCode, versionName), compileOptions.
   - AGP 9.0 compatible by design — application plugin is isolated in its own module.

6. **AppContainer expect/actual** — skeleton showing one repository wired up. Include a fake implementation in commonTest to demonstrate the testing pattern.

7. **An example shared screen** — a simple "Home" composable in `composeApp/commonMain` that reads from the AppContainer via a commonMain view model. Verifies end-to-end wiring works.

8. **iosApp Xcode project** — a stub Xcode workspace that imports the shared framework. The user will open this in Xcode to continue. Include a README step explaining:
   - `cd iosApp && open iosApp.xcodeproj`
   - Framework search paths are preconfigured.
   - First iOS build runs `./gradlew :shared:linkDebugFrameworkIosSimulatorArm64` automatically via the run script phase.

9. **CLAUDE.md filled in** with the KMP-specific conventions:
   - Target platforms.
   - Source set strategy (commonMain first, expect/actual sparingly).
   - Engine choices (OkHttp on Android, Darwin on iOS).
   - How to add new shared features.
   - How to run each target (`./gradlew :composeApp:assembleDebug`, open Xcode for iOS).

10. **Commit plan:**
    ```
    chore: initial KMP scaffold
    feat(shared): AppContainer expect/actual with SQLDelight + Ktor
    feat(ui): compose multiplatform home screen
    chore: ios xcode project bridging shared framework
    chore: CLAUDE.md and README
    ```

## House rules enforced during scaffolding

- No Hilt, no Koin. AppContainer expect/actual.
- Compose Multiplatform for UI (not separate SwiftUI unless user requests).
- Ktor for networking, SQLDelight for DB. No Room (Room is Android-only).
- Napier or Kermit for logging, never `println` in shared code.
- Version catalog.
- iosApp is an Xcode project at the repo root, not a Gradle module — this is the standard KMP structure.
- AGP 9.0 compatible: `com.android.application` lives only in `androidApp/`, never in `shared/`.

## Questions to ask

- Targets beyond Android + iOS? (desktop, web) — default: no.
- Compose Multiplatform or native UI per platform? — default: CMP.
- Backend? Firebase (Android-first), Supabase (fully multiplatform via Ktor), or custom? — default: ask.
- Auth provider? Default: Supabase Auth for Supabase backends; Firebase Auth for Firebase backends.

## After scaffolding

End with:
- Path to the project.
- Commands:
  - `./gradlew :androidApp:assembleDebug` — build Android.
  - `./gradlew :shared:linkDebugFrameworkIosSimulatorArm64` — build iOS framework.
  - `cd iosApp && open iosApp.xcodeproj` — open iOS in Xcode.
- Reminder: `local.properties` with secret keys before running.
