<!-- Applies to both Jetpack Compose and Compose Multiplatform.
     If a CMP-specific section grows significantly, split into android/compose.md + kmp/compose.md. -->
# Compose Patterns

Rules for Jetpack Compose and Compose Multiplatform. Apply the same way regardless of target.

## State hoisting is non-negotiable

Composables that display state take state as a parameter. They take callbacks for events. They do not own state unless they are the top of a feature and intentionally scoped that way.

```kotlin
// Good — stateless, reusable
@Composable
fun TransactionRow(
    transaction: TransactionUi,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) { ... }

// Bad — composable owns state that callers can't influence
@Composable
fun TransactionRow(transactionId: String) {
    var transaction by remember { mutableStateOf<TransactionUi?>(null) }
    LaunchedEffect(transactionId) { transaction = fetch(transactionId) } // NO
    ...
}
```

## Unidirectional data flow

State flows down, events flow up. The view model owns state, the UI renders it, events come back as function calls on the view model.

```kotlin
@Composable
fun TransactionListScreen(
    uiState: TransactionListUiState,
    onItemClick: (String) -> Unit,
    onRefresh: () -> Unit,
) { ... }

@Composable
fun TransactionListRoute(viewModel: TransactionListViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    TransactionListScreen(
        uiState = uiState,
        onItemClick = viewModel::onItemClick,
        onRefresh = viewModel::onRefresh,
    )
}
```

The `Route` composable wires the view model. The `Screen` composable is pure UI and previewable.

## collectAsStateWithLifecycle, not collectAsState

`collectAsStateWithLifecycle()` stops collecting when the screen is in the background. Use it everywhere for app state. `collectAsState()` is for composables that genuinely need to keep collecting off-screen, which is rare.

## Side effects

- `LaunchedEffect(key)` for suspending work tied to composition. Keys must fully capture when the effect should restart.
- `DisposableEffect(key)` when you need cleanup.
- `SideEffect` for pushing Compose state to non-Compose code on every composition.
- `rememberCoroutineScope()` for launching from event callbacks.
- Never call `suspend` functions directly in composition. Wrap them.

Bad keys cause silent bugs. If the effect depends on nothing external, pass `Unit`:

```kotlin
LaunchedEffect(Unit) { viewModel.loadOnce() }
```

## remember & derivedStateOf

- `remember` for values you compute once per composition.
- `remember(key)` for values you recompute when the key changes.
- `derivedStateOf` only when converting from multiple `State` inputs to a single derived `State` that changes less often than its inputs. If you're using it everywhere, you're probably using it wrong.

## Recomposition hygiene

- No lambdas that capture unstable state inline in hot paths. Hoist them.
- No `mutableStateListOf` when `ImmutableList` + state replacement would work (use `kotlinx.collections.immutable`).
- Annotate custom types with `@Immutable` or `@Stable` when the compiler can't prove stability.
- Use the Compose Compiler metrics report to find recomposition hot spots. Don't guess.

## Modifier ordering matters

Order of `Modifier` operations changes behavior. General order:

```
.size / .fillMaxX           // layout size
.clip(...)                  // shape
.background(...)            // visual
.border(...)                // visual
.clickable { }              // input
.padding(...)               // spacing
```

Padding after clickable gives you a clickable area that includes padding. Padding before clickable doesn't. Choose deliberately.

## Previews

Every non-trivial composable gets a preview. Use a range of state:

```kotlin
@Preview(name = "Empty")
@Preview(name = "Loading", showBackground = true)
@Preview(name = "With data", showBackground = true)
@Composable
private fun TransactionListPreview() {
    AppTheme {
        TransactionListScreen(uiState = ..., onItemClick = {}, onRefresh = {})
    }
}
```

Previews are part of the review. A composable without a preview is incomplete.

## Theme

- One `AppTheme` composable, one `MaterialTheme`, one color/type/shape palette.
- No hardcoded `Color()` or `sp` values in feature code. Everything through `MaterialTheme.colorScheme.*` and `MaterialTheme.typography.*`.
- Dark theme works. Verified in previews.
- Dynamic color (`Material You`) on Android 12+, fall back to brand colors otherwise.

## Navigation

- Compose Navigation with serializable routes.
- Arguments are plain types or `@Serializable` data classes.
- Back-stack-destructive actions (logout, reset) use `popUpTo` with `inclusive = true`.
- Deep link routes live in `ui/nav/DeepLinks.kt`, not scattered.

## Performance defaults

- `LazyColumn`/`LazyRow` for lists. Never `Column` + `verticalScroll` for more than a handful of items.
- `key = { it.id }` on every lazy list. Missing keys are the #1 cause of scroll jank.
- Use `rememberLazyListState` when you need to read or control scroll.
- Images through `coil-compose` or Coil 3 multiplatform. Set an explicit `contentScale` and placeholder.
