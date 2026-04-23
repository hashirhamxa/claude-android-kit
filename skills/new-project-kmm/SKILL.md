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
include(":shared", ":composeApp")
```

`gradle.properties`:
```
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
android.useAndroidX=true
kotlin.code.style=official
kotlin.mpp.applyDefaultHierarchyTemplate=true
```

### 4. libs.versions.toml

Same pattern as Android, but with multiplatform libraries:
- Compose Multiplatform.
- Ktor (core, content-negotiation, serialization-kotlinx-json, logging).
- Ktor engines: `ktor-client-okhttp` (androidMain), `ktor-client-darwin` (iosMain).
- SQLDelight (runtime, coroutines-extensions), drivers: `android-driver`, `native-driver`.
- multiplatform-settings.
- kotlinx-datetime.
- Napier logger.

### 5. `shared` module

`shared/build.gradle.kts`:
```kotlin
plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
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

### 7. `composeApp` module

Compose Multiplatform app module with `androidMain` + `iosMain` entry points.

`composeApp/build.gradle.kts`:
```kotlin
plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.application)
    alias(libs.plugins.jetbrains.compose)
    alias(libs.plugins.kotlin.compose)
}

kotlin {
    androidTarget()

    listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach {
        it.binaries.framework {
            baseName = "ComposeApp"
            isStatic = true
        }
    }

    sourceSets {
        commonMain.dependencies {
            implementation(projects.shared)
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.ui)
            implementation(compose.components.resources)
            implementation(libs.kotlinx.coroutines.core)
        }
        androidMain.dependencies {
            implementation(libs.androidx.activity.compose)
            implementation(libs.androidx.lifecycle.runtime.compose)
        }
    }
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
```

### 8. App entry points

`composeApp/src/commonMain/.../App.kt`:
```kotlin
@Composable
fun App(container: AppContainer) {
    MaterialTheme {
        HomeRoute(container)
    }
}
```

`composeApp/src/androidMain/.../MainActivity.kt`:
```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val container = AppContainer(applicationContext)
        setContent { App(container) }
    }
}
```

`composeApp/src/iosMain/.../MainViewController.kt`:
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
./gradlew :composeApp:embedAndSignAppleFrameworkForXcode
```

Framework Search Paths — `$(SRCROOT)/../composeApp/build/xcode-frameworks/$(CONFIGURATION)/$(SDK_NAME)`.

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
./gradlew :composeApp:assembleDebug
./gradlew :shared:linkDebugFrameworkIosSimulatorArm64
```

Both should succeed. Then open `iosApp/iosApp.xcodeproj` in Xcode and run on a simulator.

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
  - `/new-feature <n>` to scaffold a feature in the shared module.
  - `open iosApp/iosApp.xcodeproj` for iOS work.

## Common pitfalls to flag

- If Xcode build fails with "framework not found," the Run Script didn't execute. Ensure it's in Build Phases *before* Compile Sources.
- If commonMain doesn't resolve Ktor, check that the Ktor version is compatible with the Kotlin version.
- If iOS compilation is slow on first build, that's expected — Kotlin/Native compilation is not incremental on first run.
