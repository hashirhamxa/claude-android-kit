---
name: new-project-kmm
description: Step-by-step workflow for bootstrapping a Kotlin Multiplatform project targeting Android + iOS with Compose Multiplatform, SQLDelight, Ktor, and Manual DI via expect/actual AppContainer. Use when starting a new KMP project from scratch. Triggered by /new-kmm or explicit request for a new KMP/KMM project.
---

# New KMP Project — Workflow

End-to-end recipe for a KMP project with Android + iOS targets and Compose Multiplatform UI.

## Prereqs

- Android Studio with KMP plugin.
- Xcode (latest stable compatible with the Kotlin version).
- JDK 17.
- iOS Simulator installed.
- Optionally: CocoaPods if the iOS team uses it (but default is framework, not Pod).

## Steps

### 1. Gather inputs

- App name.
- Package name (`com.hash.<name>`).
- Targets — confirm Android + iOS; ask if desktop or web is needed.
- Backend choice — Supabase (default for cross-platform), Firebase (Android-first), or custom Ktor API.

### 2. Verify current versions

- Kotlin latest stable.
- Compose Multiplatform matching Kotlin.
- Ktor latest.
- SQLDelight latest.
- AGP compatible with Kotlin.
- Xcode version for Kotlin/Native compatibility.

If in doubt, search `kotlin multiplatform release notes` and `compose multiplatform release notes`.

### 3. Root files

`settings.gradle.kts`:
```kotlin
pluginManagement {
    repositories {
        google()
        gradlePluginPortal()
        mavenCentral()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories { google(); mavenCentral() }
}
rootProject.name = "<AppName>"
include(":shared", ":androidApp")
```

`gradle.properties`:
```
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
android.useAndroidX=true
kotlin.code.style=official
kotlin.mpp.applyDefaultHierarchyTemplate=true
```

### 4. libs.versions.toml

Same pattern as Android, but with multiplatform libraries. Include these sections and entries:

```toml
[versions]
kotlin                = "<latest stable>"
agp                   = "<latest stable>"
compose-multiplatform = "<latest stable from jetbrains.com/lp/compose-multiplatform>"
ktor                  = "<latest stable>"
sqldelight            = "<latest stable>"
kotlinx-coroutines    = "<latest stable>"
kotlinx-serialization = "<latest stable>"
kotlinx-datetime      = "<latest stable>"
multiplatform-settings = "<latest stable>"
napier                = "<latest stable>"
androidx-activity-compose = "<latest stable>"
androidx-lifecycle    = "<latest stable>"

[plugins]
kotlin-multiplatform  = { id = "org.jetbrains.kotlin.multiplatform", version.ref = "kotlin" }
kotlin-serialization  = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
kotlin-android        = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
# kotlin-compose version must match Kotlin exactly — version.ref = "kotlin", not compose-multiplatform
kotlin-compose        = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
jetbrains-compose     = { id = "org.jetbrains.compose", version.ref = "compose-multiplatform" }
android-application   = { id = "com.android.application", version.ref = "agp" }
android-library       = { id = "com.android.library", version.ref = "agp" }
sqldelight            = { id = "app.cash.sqldelight", version.ref = "sqldelight" }

[libraries]
ktor-client-core                  = { module = "io.ktor:ktor-client-core", version.ref = "ktor" }
ktor-client-content-negotiation   = { module = "io.ktor:ktor-client-content-negotiation", version.ref = "ktor" }
ktor-serialization-kotlinx-json   = { module = "io.ktor:ktor-serialization-kotlinx-json", version.ref = "ktor" }
ktor-client-logging               = { module = "io.ktor:ktor-client-logging", version.ref = "ktor" }
ktor-client-okhttp                = { module = "io.ktor:ktor-client-okhttp", version.ref = "ktor" }
ktor-client-darwin                = { module = "io.ktor:ktor-client-darwin", version.ref = "ktor" }
kotlinx-coroutines-core           = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "kotlinx-coroutines" }
kotlinx-coroutines-test           = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "kotlinx-coroutines" }
kotlinx-serialization-json        = { module = "org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "kotlinx-serialization" }
kotlinx-datetime                  = { module = "org.jetbrains.kotlinx:kotlinx-datetime", version.ref = "kotlinx-datetime" }
sqldelight-runtime                = { module = "app.cash.sqldelight:runtime", version.ref = "sqldelight" }
sqldelight-coroutines-extensions  = { module = "app.cash.sqldelight:coroutines-extensions", version.ref = "sqldelight" }
sqldelight-android-driver         = { module = "app.cash.sqldelight:android-driver", version.ref = "sqldelight" }
sqldelight-native-driver          = { module = "app.cash.sqldelight:native-driver", version.ref = "sqldelight" }
multiplatform-settings            = { module = "com.russhwolf:multiplatform-settings", version.ref = "multiplatform-settings" }
napier                            = { module = "io.github.aakira:napier", version.ref = "napier" }
turbine                           = { module = "app.cash.turbine:turbine", version = "<latest stable>" }
androidx-activity-compose         = { module = "androidx.activity:activity-compose", version.ref = "androidx-activity-compose" }
androidx-lifecycle-runtime-compose = { module = "androidx.lifecycle:lifecycle-runtime-compose", version.ref = "androidx-lifecycle" }
```

### 5. `shared` module

The shared module is a pure KMP library. It holds all domain, data, and shared Compose UI code. It must never apply `com.android.application`.

`shared/build.gradle.kts`:
```kotlin
plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)          // library, not application — AGP 9.0 requirement
    alias(libs.plugins.jetbrains.compose)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.sqldelight)
}

kotlin {
    androidTarget {
        compilations.all { kotlinOptions { jvmTarget = "17" } }
    }

    listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach {
        it.binaries.framework {
            baseName = "Shared"
            isStatic = true
        }
    }

    sourceSets {
        commonMain.dependencies {
            implementation(libs.ktor.client.core)
            implementation(libs.ktor.client.content.negotiation)
            implementation(libs.ktor.serialization.kotlinx.json)
            implementation(libs.ktor.client.logging)
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.kotlinx.serialization.json)
            implementation(libs.kotlinx.datetime)
            implementation(libs.sqldelight.runtime)
            implementation(libs.sqldelight.coroutines.extensions)
            implementation(libs.multiplatform.settings)
            implementation(libs.napier)
            // Compose Multiplatform — shared UI lives here
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.ui)
            implementation(compose.components.resources)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation(libs.kotlinx.coroutines.test)
            implementation(libs.turbine)
        }
        androidMain.dependencies {
            implementation(libs.ktor.client.okhttp)
            implementation(libs.sqldelight.android.driver)
        }
        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)
            implementation(libs.sqldelight.native.driver)
        }
    }
}

android {
    namespace = "<package>.shared"
    compileSdk = <latest>
    defaultConfig { minSdk = <min> }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

sqldelight {
    databases {
        create("AppDatabase") {
            packageName.set("<package>.db")
        }
    }
}
```

### 6. AppContainer expect / actual

`shared/src/commonMain/.../di/AppContainer.kt`:
```kotlin
expect class AppContainer {
    val httpClient: HttpClient
    val database: AppDatabase
    // repositories added per feature
}

// Factory used by platform actuals
class CommonDependencies {
    fun httpClient(engine: HttpClientEngineFactory<*>): HttpClient =
        HttpClient(engine) {
            install(ContentNegotiation) { json() }
            install(Logging) { level = LogLevel.HEADERS }
        }

    fun database(driver: SqlDriver): AppDatabase = AppDatabase(driver)
}
```

`shared/src/androidMain/.../di/AppContainer.kt`:
```kotlin
actual class AppContainer(context: Context) {
    private val common = CommonDependencies()
    actual val httpClient: HttpClient = common.httpClient(OkHttp)
    actual val database: AppDatabase = common.database(
        AndroidSqliteDriver(AppDatabase.Schema, context, "app.db")
    )
}
```

`shared/src/iosMain/.../di/AppContainer.kt`:
```kotlin
actual class AppContainer {
    private val common = CommonDependencies()
    actual val httpClient: HttpClient = common.httpClient(Darwin)
    actual val database: AppDatabase = common.database(
        NativeSqliteDriver(AppDatabase.Schema, "app.db")
    )
}
```

### 7. `androidApp` module

Thin Android application shell. No multiplatform plugin. Depends on `:shared` for all business logic and shared UI.

`androidApp/build.gradle.kts`:
```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "<package>"
    compileSdk = <latest>
    defaultConfig {
        applicationId = "<package>"
        minSdk = <min>
        targetSdk = <latest>
        versionCode = 1
        versionName = "0.1.0"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(project(":shared"))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
}
```

This module never applies `kotlin("multiplatform")`. AGP 9.0 compatibility is maintained by isolating the application plugin here.

### 8. App entry points

`shared/src/commonMain/.../ui/App.kt`:
```kotlin
@Composable
fun App(container: AppContainer) {
    MaterialTheme {
        HomeRoute(container)
    }
}
```

`androidApp/src/main/kotlin/.../MainActivity.kt`:
```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val container = AppContainer(applicationContext)
        setContent { App(container) }
    }
}
```

`shared/src/iosMain/.../MainViewController.kt`:
```kotlin
fun MainViewController(): UIViewController = ComposeUIViewController {
    val container = remember { AppContainer() }
    App(container)
}
```

### 9. Xcode project

Create `iosApp/iosApp.xcodeproj` with a SwiftUI entry point that bridges to the Compose UIViewController:

`iosApp/iosApp/iOSApp.swift`:
```swift
import SwiftUI

@main
struct iOSApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

`iosApp/iosApp/ContentView.swift`:
```swift
import SwiftUI
import ComposeApp

struct ContentView: View {
    var body: some View {
        ComposeView().ignoresSafeArea()
    }
}

struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.MainViewController()
    }
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}
```

Xcode Build Phases — add a Run Script before Compile:
```
cd "$SRCROOT/.."
./gradlew :shared:embedAndSignAppleFrameworkForXcode
```

Framework Search Paths — `$(SRCROOT)/../shared/build/xcode-frameworks/$(CONFIGURATION)/$(SDK_NAME)`.

### 10. CLAUDE.md

Copy `templates/CLAUDE.kmm.template.md` to project root and fill in.

### 11. .gitignore

Include Android + Kotlin + Xcode patterns:
```
# Android / Kotlin
.gradle/
build/
.idea/
local.properties
*.iml
.kotlin/
kotlin-js-store/

# Xcode
*.xcuserdatad/
*.xcodeproj/xcuserdata/
*.xcworkspace/xcuserdata/
DerivedData/
*.pbxproj.bak

# macOS
.DS_Store
```

### 12. Verify

```
./gradlew :androidApp:assembleDebug
./gradlew :shared:linkDebugFrameworkIosSimulatorArm64
```

Both should succeed. Then open `iosApp/iosApp.xcodeproj` in Xcode and run on a simulator.

**File tree after setup:**

```
<AppName>/
├── shared/
│   ├── build.gradle.kts      <- multiplatform + android library + compose
│   └── src/
│       ├── commonMain/       <- domain, data, Compose UI, App.kt
│       ├── androidMain/      <- AppContainer actual, platform impls
│       └── iosMain/          <- AppContainer actual, MainViewController.kt
├── androidApp/
│   ├── build.gradle.kts      <- android application only, depends on :shared
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── kotlin/MainActivity.kt
├── iosApp/                   <- Xcode project, not a Gradle module
└── settings.gradle.kts       <- include(":shared", ":androidApp")
```

Use the KMP wizard at kmp.jetbrains.com as the starting point — it now generates this structure by default.

### 13. Initial commit

```
git init
git add .
git commit -m "chore: initial KMP scaffold"
```

## Completion output

- Project path.
- Build verification results for both targets.
- Next commands:
  - `./gradlew :androidApp:assembleDebug` — confirm Android builds.
  - `/new-feature <n>` to scaffold a feature in the shared module.
  - `open iosApp/iosApp.xcodeproj` for iOS work.

## Common pitfalls to flag

- If Xcode build fails with "framework not found," the Run Script didn't execute. Ensure it's in Build Phases *before* Compile Sources. The run script must reference `:shared:embedAndSignAppleFrameworkForXcode`, not `:composeApp:...`.
- If commonMain doesn't resolve Ktor, check that the Ktor version is compatible with the Kotlin version.
- If iOS compilation is slow on first build, that's expected — Kotlin/Native compilation is not incremental on first run.
