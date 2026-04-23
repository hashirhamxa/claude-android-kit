---
description: Bootstrap a new Android (non-KMP) project with Hash's conventions — Manual DI, Compose, Clean Arch + MVVM, Room + Ktor + Firebase, testing scaffolding, CLAUDE.md.
argument-hint: <app-name> [package-name]
---

# /new-android

Bootstrap a new pure-Android project with full conventions in place.

## Usage

```
/new-android TamaamPaisa com.hash.tamaampaisa
```

First arg is the display name and module name. Second arg (optional) is the package name; defaults to `com.hash.<lowercase-app-name>`.

## What you produce

Invoke this workflow when the user runs this command:

1. **Delegate to the `android-architect` agent first** to confirm architectural shape and flag anything unusual about the project brief. One short exchange, not a full design doc.

2. **Produce the project scaffold** in the current working directory (or a new subdirectory named after the app). Do not overwrite existing files without explicit confirmation.

3. **File structure:**
   ```
   <root>/
   ├── CLAUDE.md                           # Copied from templates/CLAUDE.android.template.md, filled in
   ├── README.md                           # Project overview
   ├── .gitignore                          # Android + Kotlin defaults
   ├── build.gradle.kts                    # Root
   ├── settings.gradle.kts
   ├── gradle.properties
   ├── gradle/
   │   ├── wrapper/
   │   └── libs.versions.toml              # Version catalog — all versions here
   ├── app/
   │   ├── build.gradle.kts
   │   ├── proguard-rules.pro
   │   └── src/
   │       ├── main/
   │       │   ├── AndroidManifest.xml
   │       │   ├── java/<package-path>/
   │       │   │   ├── App.kt              # Application, owns AppContainer
   │       │   │   ├── MainActivity.kt     # Single activity, Compose root
   │       │   │   ├── di/
   │       │   │   │   └── AppContainer.kt
   │       │   │   ├── ui/
   │       │   │   │   ├── theme/          # Color, Type, Shape, AppTheme
   │       │   │   │   ├── nav/            # AppNavHost, Route serializables
   │       │   │   │   └── common/         # Shared composables
   │       │   │   ├── domain/
   │       │   │   │   ├── model/
   │       │   │   │   ├── repository/     # Interfaces
   │       │   │   │   └── usecase/
   │       │   │   └── data/
   │       │   │       ├── local/          # Room DB, DAOs, entities
   │       │   │       ├── remote/         # Ktor client, DTOs, APIs
   │       │   │       └── repository/     # Implementations
   │       │   └── res/                    # Themes, colors, strings
   │       └── test/
   │           └── java/<package-path>/
   │               └── ExampleUnitTest.kt  # Scaffold
   ```

4. **libs.versions.toml defaults:**
   - AGP: latest stable at the time of generation (verify with web_search if unsure).
   - Kotlin: latest stable compatible with AGP.
   - Compose BOM: latest stable.
   - Ktor: latest stable.
   - Room: latest stable.
   - Coroutines: latest stable.
   - Turbine, MockK for tests.
   - JUnit 4 (still the Android default).

5. **build.gradle.kts essentials:**
   - `compileSdk` + `targetSdk` at current stable (verify), `minSdk` at 24 unless the user overrides.
   - `jvmTarget = "17"`, `sourceCompatibility = JavaVersion.VERSION_17`.
   - `buildFeatures { compose = true; buildConfig = true }`.
   - BuildConfig fields for Supabase/Firebase/API URLs, pulled from `local.properties`.
   - R8 enabled on release (`isMinifyEnabled = true`).

6. **AppContainer skeleton** with Room, Ktor, one example repository. Not a full implementation — just the pattern, with TODOs.

7. **MainActivity + a single "Home" screen** demonstrating the Route/Screen split and view model wiring.

8. **Theme files** with Material 3, dynamic color enabled on Android 12+, a light+dark scheme.

9. **CLAUDE.md filled in** with:
   - Project name.
   - Package name.
   - Stack summary (repeating the rules compact, so Claude Code sessions have context).
   - Module map.
   - Conventions (pointing back to `~/.claude/rules/` but noting overrides if any).
   - Known TODOs / bootstrap items remaining.

10. **Commit plan** — print the suggested initial commits at the end:
    ```
    chore: initial project scaffold
    feat(di): AppContainer with Room, Ktor, example repository
    feat(ui): home screen with route/screen split
    chore: CLAUDE.md and project README
    ```

## House rules you must enforce during scaffolding

- No Hilt. No Koin. AppContainer only.
- Compose only, no XML layouts (manifest + theme XMLs are fine).
- Version catalog (`libs.versions.toml`), not hardcoded versions in `build.gradle.kts`.
- No `google-services.json` until the user adds a real Firebase project.
- `local.properties.example` committed with placeholder keys; real `local.properties` ignored.

## Questions to ask the user before scaffolding

Ask only if not inferable from the args. Prefer reasonable defaults.

- Target min SDK? (Default: 24.)
- Firebase? (Default: yes, scaffolded but disabled until `google-services.json` is added.)
- Supabase? (Default: yes, scaffolded with placeholder BuildConfig fields.)
- Offline-first with Room? (Default: yes.)
- Any specific feature to scaffold beyond the home screen? (Default: no.)

Keep the conversation tight. The user wants working scaffolding, not a design review.

## After scaffolding

End with:
- Path to the new project.
- What to run first: `./gradlew assembleDebug` to verify build.
- Where to fill in secrets: `local.properties`.
- Link to the `CLAUDE.md` for the project-specific conventions.
