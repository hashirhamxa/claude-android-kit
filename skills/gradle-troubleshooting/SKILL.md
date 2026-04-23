---
name: gradle-troubleshooting
description: Workflow for diagnosing and fixing Gradle, AGP, Kotlin, Compose Compiler, and KSP build failures in Android and KMP projects. Includes the standard diagnostic sequence, the version-matrix check, and the most common error categories with fixes.
---

# Gradle Troubleshooting — Workflow

Deterministic sequence for debugging broken Android / KMP builds. Don't guess.

## Standard diagnostic sequence

Follow in order, move on only if the previous step doesn't resolve it.

### 1. Read the full error

Most build failures bury the real cause mid-stack, not at the top or bottom. Read the entire output. Look for:
- `Caused by:` lines (the root of the stack).
- `> Task :<module>:<task> FAILED` (the specific failing task).
- Version numbers mentioned in the error.

### 2. Version matrix check

60% of build failures are version misalignment. Check each pair:

- **AGP ↔ Gradle wrapper** — `gradle-wrapper.properties` must match AGP's requirement.
- **AGP ↔ compileSdk** — AGP X requires compileSdk ≥ Y.
- **Kotlin ↔ Compose Compiler** — on Kotlin < 2.0, the standalone Compose Compiler version must match Kotlin exactly. On Kotlin 2.0+, use the `org.jetbrains.kotlin.plugin.compose` plugin, which tracks Kotlin.
- **Kotlin ↔ KSP** — KSP version string format `<kotlin>-<ksp>`, e.g. `2.0.21-1.0.25`. The prefix must equal the Kotlin version.
- **KMP ↔ Xcode** — each Kotlin version supports a range of Xcode versions. Check the Kotlin release notes if iOS builds fail mysteriously.

### 3. Try clean + invalidate

```
./gradlew --stop
rm -rf .gradle/ build/
./gradlew clean
./gradlew <failing-task>
```

If Android Studio is misbehaving: File → Invalidate Caches → Restart.

### 4. Get more signal

```
./gradlew <task> --stacktrace
./gradlew <task> --info
./gradlew <task> --scan
```

A Build Scan URL is the best output for anything complex — it shows the full dependency graph, task inputs, timings.

### 5. Dependency insight

For "duplicate class" or "cannot find" errors:

```
./gradlew :<module>:dependencies --configuration releaseRuntimeClasspath
./gradlew :<module>:dependencyInsight --dependency <artifact> --configuration releaseRuntimeClasspath
```

This shows every version of the artifact pulled in and why.

## Error categories

### Version conflict

**Symptom:** "Plugin with id X not found" or "Could not find com.foo:bar:1.2.3".

**Fix:**
1. Verify the plugin/dependency is in `libs.versions.toml`.
2. Verify the plugin is declared with `apply false` in the root `build.gradle.kts`.
3. Verify the repository is declared — `google()` for AndroidX, `mavenCentral()` for most others.

### Compose Compiler mismatch

**Symptom:** "This version of the Compose Compiler requires Kotlin X.Y.Z".

**Fix (Kotlin < 2.0):** pin Compose Compiler to the exact version matching Kotlin.

```toml
[versions]
kotlin = "1.9.23"
compose-compiler = "1.5.11"

[libraries]
# In app/build.gradle.kts
# android { composeOptions { kotlinCompilerExtensionVersion = libs.versions.compose.compiler.get() } }
```

**Fix (Kotlin 2.0+):** remove manual Compose Compiler version, use the plugin:

```kotlin
plugins {
    alias(libs.plugins.kotlin.compose)
}
```

```toml
[plugins]
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
```

### KSP version mismatch

**Symptom:** "Kotlin version X.Y.Z and KSP version A.B.C-X.Y.Z.D do not agree".

**Fix:** update KSP version string to match current Kotlin. The prefix is the Kotlin version; the suffix is the KSP version itself.

### Duplicate class

**Symptom:** "Duplicate class com.foo.Bar found in modules ...".

**Fix:**
1. Run `./gradlew :app:dependencyInsight --dependency <artifact>` to find both paths.
2. Pick the one you want. Exclude the other:
   ```kotlin
   implementation(libs.some.library) {
       exclude(group = "com.conflicting", module = "artifact")
   }
   ```
3. If two artifacts legitimately provide the same class, the libs themselves conflict — one must go.

### Manifest merger failure

**Symptom:** "Manifest merger failed : Attribute X@Y value=(A) from AndroidManifest.xml is also present at [lib] AndroidManifest.xml value=(B)".

**Fix:** in the app `AndroidManifest.xml`:
```xml
<application
    ...
    tools:replace="<attributeName>"
    xmlns:tools="http://schemas.android.com/tools">
```

### R8 / ProGuard missing classes

**Symptom:** `:app:minifyReleaseWithR8` fails with "missing classes".

**Fix:**
1. Check the R8 output file: `app/build/outputs/mapping/release/missing_rules.txt`. Paste its contents into `proguard-rules.pro`.
2. Prefer library-provided rules — check the library's README for "ProGuard/R8 rules" section.
3. If a library dynamically loads classes (reflection, ServiceLoader), add `-keep` rules for those packages.

### KMP iOS framework not found

**Symptom:** Xcode error "framework not found Shared" or "Undefined symbol".

**Fix:**
1. Verify Xcode Build Phase runs `./gradlew :composeApp:embedAndSignAppleFrameworkForXcode` before Compile Sources.
2. Verify Framework Search Paths include `$(SRCROOT)/../composeApp/build/xcode-frameworks/$(CONFIGURATION)/$(SDK_NAME)`.
3. Check Kotlin target matches simulator/device: `iosSimulatorArm64` for Apple Silicon simulators, `iosX64` for Intel simulators, `iosArm64` for devices.
4. Rebuild the framework manually: `./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64`.

### KMP commonMain compilation fails on Android-only API

**Symptom:** "Unresolved reference: Log" or "Unresolved reference: Context" in commonMain.

**Fix:** the API doesn't exist in commonMain. Three options:
1. Replace with a multiplatform equivalent (`Napier` instead of `Log`).
2. Move the code to `androidMain`.
3. Introduce `expect`/`actual` if a single common API is needed with platform-specific impl.

See `kmp-migration-planner` agent for guided restructuring.

### Gradle daemon OOM

**Symptom:** Daemon disappeared, "expecting value" errors from tools, OOM exception in daemon logs.

**Fix:** in `gradle.properties`:
```
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
```

Also clear daemon: `./gradlew --stop`.

### Lint blocking release build

**Symptom:** `:app:lintRelease` fails with errors.

**Fix:**
1. First, check if the lint errors are real. Often they are.
2. If you need to ship and fix later, override in `build.gradle.kts`:
   ```kotlin
   android {
       lint {
           abortOnError = false       // during hotfix only
           warningsAsErrors = false
       }
   }
   ```
3. Don't leave this in main branch. Fix the lint issues and restore strict mode.

## When it still doesn't work

If the standard sequence and category checks don't resolve it:

1. **Build Scan** — `./gradlew <task> --scan`. Paste the URL into the chat and read it with the gradle-resolver agent.
2. **Upstream issue** — search GitHub issues for the exact error message. Libraries often have known issues with specific version combinations.
3. **Bisect versions** — roll Kotlin, AGP, or Compose back one version at a time until the build passes. This isolates the offender.
4. **Minimal repro** — strip the project to the smallest config that still fails. Often reveals the conflict.

## Prevention

After fixing, consider adding a guardrail:
- A `// CAUTION:` comment in `libs.versions.toml` near the versions that must move together.
- A `tests/` entry that validates the build works with key configurations.
- A note in `CLAUDE.md` under "Known pitfalls" so future sessions don't re-hit the same issue.
