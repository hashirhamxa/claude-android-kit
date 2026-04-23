---
name: new-project-android
description: Step-by-step workflow for bootstrapping a pure Android project with Manual DI, Compose, Clean Architecture + MVVM, Room, Ktor, and Firebase. Use when starting a new Android-only app from scratch. Triggered by /new-android or explicit request to create a new Android project.
---

# New Android Project — Workflow

End-to-end recipe for a new Android project. Produces a working scaffold the user can build and run.

## Prereqs the user must have

- Android Studio (current stable).
- JDK 17.
- `git` initialized in the target directory (or you create it first).

## Steps

### 1. Gather inputs

Resolve or ask for:
- App display name (e.g. "TamaamPaisa").
- Package name (e.g. `com.hash.tamaampaisa`). Default to `com.hash.<lowercase-app>`.
- min SDK (default 24).
- Target SDK and compileSdk — check latest stable via web_search if unsure.

### 2. Look up current versions

Before writing version numbers, verify:
- Latest stable AGP (and its Gradle requirement).
- Latest stable Kotlin.
- Latest Compose BOM.
- Latest Ktor, Room.
- Compose Compiler version tied to Kotlin (if Kotlin < 2.0; Kotlin 2.0+ bundles the Compose compiler plugin).

If in doubt, search `android developer gradle-agp-release-notes` and `kotlin latest release`.

### 3. Create root files

Root `build.gradle.kts`:
```kotlin
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false   // Kotlin 2.0+
    alias(libs.plugins.ksp) apply false
}
```

`settings.gradle.kts`:
```kotlin
pluginManagement {
    repositories { gradlePluginPortal(); google(); mavenCentral() }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories { google(); mavenCentral() }
}
rootProject.name = "<AppName>"
include(":app")
```

`gradle.properties`:
```
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
android.useAndroidX=true
kotlin.code.style=official
```

### 4. libs.versions.toml

Version catalog with: AGP, Kotlin, Compose BOM, Ktor, Room, Coroutines, Turbine, MockK, Timber. All version strings in `[versions]`, libraries in `[libraries]`, plugins in `[plugins]`. Keep one level of indentation.

### 5. App module

`app/build.gradle.kts`:
```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)      // only on Kotlin 2.0+
    alias(libs.plugins.ksp)                  // for Room
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

        // Read BuildConfig fields from local.properties
        val props = java.util.Properties()
        rootProject.file("local.properties").takeIf { it.exists() }
            ?.inputStream()?.use { props.load(it) }

        buildConfigField("String", "SUPABASE_URL", "\"${props.getProperty("supabase.url", "")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${props.getProperty("supabase.anonKey", "")}\"")
    }

    buildFeatures { compose = true; buildConfig = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.serialization.json)

    implementation(libs.ktor.client.core)
    implementation(libs.ktor.client.okhttp)
    implementation(libs.ktor.client.content.negotiation)
    implementation(libs.ktor.serialization.kotlinx.json)
    implementation(libs.ktor.client.logging)

    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    implementation(libs.timber)

    debugImplementation(libs.androidx.compose.ui.tooling)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.turbine)
    testImplementation(libs.mockk)
}
```

### 6. App class

`App.kt`:
```kotlin
class App : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = DefaultAppContainer(this)
        if (BuildConfig.DEBUG) Timber.plant(Timber.DebugTree())
    }
}
```

### 7. AppContainer

`di/AppContainer.kt`:
```kotlin
interface AppContainer {
    val db: AppDatabase
    val httpClient: HttpClient
    // Feature repositories added here as they're introduced.
}

class DefaultAppContainer(context: Context) : AppContainer {
    override val db: AppDatabase by lazy {
        Room.databaseBuilder(context, AppDatabase::class.java, "app.db").build()
    }
    override val httpClient: HttpClient by lazy {
        HttpClient(OkHttp) {
            install(ContentNegotiation) { json() }
            if (BuildConfig.DEBUG) install(Logging) { level = LogLevel.HEADERS }
        }
    }
}
```

### 8. Empty Room DB

`data/local/AppDatabase.kt`:
```kotlin
@Database(entities = [], version = 1, exportSchema = true)
abstract class AppDatabase : RoomDatabase() {
    companion object {
        val MIGRATIONS: Array<Migration> = emptyArray()
    }
}
```

Entities and DAOs get added per feature.

### 9. Theme + MainActivity + one screen

`ui/theme/AppTheme.kt` — standard Material 3 theme with dynamic color on Android 12+.

`MainActivity.kt`:
```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val container = (application as App).container
        setContent {
            AppTheme {
                CompositionLocalProvider(LocalAppContainer provides container) {
                    AppNavHost()
                }
            }
        }
    }
}

val LocalAppContainer = staticCompositionLocalOf<AppContainer> {
    error("AppContainer not provided")
}
```

`ui/nav/AppNavHost.kt` — single nav host with a home route.

`ui/home/HomeScreen.kt` — a stateless Compose screen with a preview.

### 10. CLAUDE.md

Copy `templates/CLAUDE.android.template.md` to the project root and fill in placeholders.

### 11. local.properties.example

```
sdk.dir=/Users/<you>/Library/Android/sdk
supabase.url=https://your-project.supabase.co
supabase.anonKey=your-anon-key
```

### 12. Verify

Run:
```
./gradlew assembleDebug
```

Should succeed. If not, escalate to the `gradle-resolver` agent.

### 13. Initial commit

```
git add .
git commit -m "chore: initial project scaffold"
```

## Completion output

At the end, print:
- Project path.
- `./gradlew assembleDebug` run result.
- Path to the generated `CLAUDE.md`.
- Next suggested commands: `/new-feature <something>` to add the first real feature.
