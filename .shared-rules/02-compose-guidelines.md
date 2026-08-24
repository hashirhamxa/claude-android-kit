# Jetpack Compose Guidelines

## 1. State Collection Standard
- **Mandatory Lifecycle Awareness:** Always collect UI state using `collectAsStateWithLifecycle()` from `androidx.lifecycle.compose`.
- **Banned:** Raw `collectAsState()` is strictly forbidden in UI Composables as it fails to stop upstream flow emissions when the app is in the background.

```kotlin
@Composable
fun FeatureScreen(viewModel: FeatureViewModel = koinViewModel()) {
    // REQUIRED
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    // BANNED:
    // val uiState by viewModel.uiState.collectAsState()
}
```

## 2. Compose Stability & Recomposition Performance
- **Kotlin 2.x Strong Skipping:** Strong skipping mode is enabled by default. Ensure composable parameters are either `@Immutable`, `@Stable`, or primitive/standard collections wrapped in immutable structures.
- **External & Multiplatform Models:** External models or non-annotated models from shared KMP modules must be wrapped in `@Immutable` value classes or registered in the Compose stability configuration file (`stability_config.conf`).

```kotlin
// Multiplatform/External Model Wrapper
@Immutable
data class ImmutableItemList(val items: List<ItemUiModel>)
```

## 3. Type-Safe Navigation
- **Navigation 2.8+ / Navigation3:** All screen destinations and arguments must use `@Serializable` Kotlin objects or data classes.
- **Banned:** String-based route paths (`"user/{id}"`) and string concatenation are strictly prohibited.

```kotlin
@Serializable
data class UserDetailsDestination(val userId: String)

@Serializable
data object HomeDestination

// Usage with NavHost
NavHost(navController = navController, startDestination = HomeDestination) {
    composable<HomeDestination> { ... }
    composable<UserDetailsDestination> { backStackEntry ->
        val route: UserDetailsDestination = backStackEntry.toRoute()
    }
}
```

## 4. Edge-to-Edge & Inset Handling
- **Root Layouts:** Root screen composables must explicitly handle system insets using `Modifier.safeDrawingPadding()`, `Modifier.windowInsetsPadding()`, or `Modifier.imePadding()` to ensure zero overlap with system bars, camera cutouts, and software keyboards.

```kotlin
Scaffold(
    modifier = Modifier
        .fillMaxSize()
        .safeDrawingPadding()
) { innerPadding ->
    Box(modifier = Modifier.padding(innerPadding).imePadding()) {
        // Screen content
    }
}
```

## 5. List Performance & Stable Keys
- **Explicit Keys:** `LazyColumn`, `LazyRow`, and `LazyVerticalGrid` must define explicit, stable keys for every item. Never rely on list index as key for mutable lists.

```kotlin
LazyColumn(modifier = Modifier.fillMaxSize()) {
    items(
        items = uiState.items,
        key = { item -> item.id } // MANDATORY stable key
    ) { item ->
        ItemRow(item = item)
    }
}
```
