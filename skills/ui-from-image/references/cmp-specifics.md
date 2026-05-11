# Compose Multiplatform Specifics

When the target is Compose Multiplatform (CMP), most of the code is identical to Jetpack Compose, but a handful of areas differ. This reference covers those areas.

## Module layout

Standard CMP layout in Hash's projects:

```
composeApp/
├── src/
│   ├── commonMain/
│   │   ├── kotlin/                  ← all shared UI code goes here
│   │   └── composeResources/        ← shared resources (CMP resource system)
│   │       ├── drawable/
│   │       ├── font/
│   │       ├── values/
│   │       └── files/
│   ├── androidMain/                 ← Android-only actuals
│   ├── iosMain/                     ← iOS-only actuals
│   └── desktopMain/                 ← Desktop-only actuals (if applicable)
```

UI screens, composables, ViewModels, and themes all live in `commonMain` unless they require platform APIs.

## Resources

CMP uses its own resource system, distinct from Android's `R` class.

```kotlin
// Android Compose:
import androidx.compose.ui.res.painterResource
Icon(painterResource(R.drawable.ic_logo), null)

// Compose Multiplatform:
import org.jetbrains.compose.resources.painterResource
import yourpackage.composeapp.generated.resources.Res
import yourpackage.composeapp.generated.resources.ic_logo
Icon(painterResource(Res.drawable.ic_logo), null)
```

Strings:

```kotlin
// CMP
import org.jetbrains.compose.resources.stringResource
Text(stringResource(Res.string.welcome))
```

Fonts:

```kotlin
// CMP
import org.jetbrains.compose.resources.Font

val InterFamily = FontFamily(
    Font(Res.font.Inter_Regular, FontWeight.Normal),
    Font(Res.font.Inter_Medium, FontWeight.Medium),
    Font(Res.font.Inter_SemiBold, FontWeight.SemiBold),
    Font(Res.font.Inter_Bold, FontWeight.Bold),
)
```

The `Res` object is generated at build time. Drop the font/drawable files into `commonMain/composeResources/font/` and `commonMain/composeResources/drawable/`, sync Gradle, and they appear under `Res.font.*` / `Res.drawable.*`.

## Previews

CMP previews require the JetBrains preview annotation, not the AndroidX one:

```kotlin
import org.jetbrains.compose.ui.tooling.preview.Preview

@Preview
@Composable
private fun LoginScreenPreview() {
    AppTheme {
        LoginScreen(state = LoginState.Empty, onEvent = {})
    }
}
```

Previews render in the IDE for CMP. Multi-state previews don't get the same fancy UI as Android Studio (e.g., no `@PreviewParameter`), so just write multiple `@Preview`-annotated wrappers.

## Platform differences via expect/actual

When something genuinely differs per platform:

```kotlin
// commonMain/.../platform/HapticFeedback.kt
expect class HapticFeedbackController {
    fun perform(type: HapticType)
}

// androidMain/.../platform/HapticFeedback.kt
actual class HapticFeedbackController(private val view: View) {
    actual fun perform(type: HapticType) {
        view.performHapticFeedback(type.toAndroid())
    }
}

// iosMain/.../platform/HapticFeedback.kt
actual class HapticFeedbackController {
    actual fun perform(type: HapticType) {
        UIImpactFeedbackGenerator(style = type.toIos()).impactOccurred()
    }
}
```

Common things that need expect/actual:

- Haptics
- Status bar / nav bar styling (Android: `SystemUiController` / `WindowInsetsController`; iOS: scene-level config)
- Keyboard show/hide (mostly automatic, but programmatic dismiss differs)
- File picking, sharing
- Browser/external links

For pure UI from a design, you typically **don't** need expect/actual. Designs rarely specify haptics or sharing. Build the UI in `commonMain`, wire up platform behavior later.

## Navigation

CMP has multiple navigation options. Pick what the project already uses; don't introduce a new one for a single screen:

- **Voyager** — widely used in CMP projects, declarative
- **Decompose** — heavier, good for complex multi-module apps
- **Compose Navigation (multiplatform)** — official, now stable for CMP

Detect by checking dependencies:

```bash
grep -r "voyager" gradle/libs.versions.toml composeApp/build.gradle.kts 2>/dev/null
grep -r "decompose" gradle/libs.versions.toml composeApp/build.gradle.kts 2>/dev/null
grep -r "navigation-compose" gradle/libs.versions.toml composeApp/build.gradle.kts 2>/dev/null
```

## ViewModels

CMP doesn't have AndroidX ViewModel directly. Use either:

- `androidx.lifecycle:lifecycle-viewmodel-compose` (now multiplatform) — gives you `ViewModel` in `commonMain`
- A custom state holder pattern using `CoroutineScope` directly

For Hash's projects: use `lifecycle-viewmodel-compose` since AndroidX shipped multiplatform support. Same `ViewModel` API in `commonMain`.

## Manual DI in CMP

Hash uses Manual DI via `AppContainer`. In CMP, this typically lives in `commonMain`:

```kotlin
// commonMain/.../di/AppContainer.kt
class AppContainer(
    private val platformContainer: PlatformContainer,
) {
    val httpClient by lazy { /* Ktor client */ }
    val authRepository by lazy { AuthRepositoryImpl(httpClient, platformContainer.settings) }
    // ...
}

// commonMain/.../di/PlatformContainer.kt
expect class PlatformContainer {
    val settings: Settings  // multiplatform-settings
}
```

For a single UI-from-image task, you don't usually need to touch DI — just consume what's already there.

## Gotchas

- **`Modifier.shadow()` works differently on iOS.** Android renders elevation-style shadows natively. iOS doesn't have the same rendering path — shadows often look weaker. If shadow fidelity matters, render with explicit `drawBehind` or use `Modifier.background` + offset layers.
- **`SubcomposeLayout`-based components** (some `LazyLayout` patterns, custom layouts) work but can have iOS-specific perf characteristics. Stick to standard `Lazy*` lists.
- **Font loading is async on iOS.** First-frame may flash with system fallback. For critical splash screens, render with system font initially and let the brand font swap in.
- **System back button**. Android-only by default. In CMP, opt into back handling via `BackHandler` (now multiplatform in recent versions) or handle at the navigation layer.
