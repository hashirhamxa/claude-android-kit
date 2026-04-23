---
description: Add a new feature as a vertical slice — domain model, repository, view model, UI, navigation, and tests — following project conventions. Use for any non-trivial feature addition.
argument-hint: <feature-name>
---

# /new-feature

Scaffold a full vertical slice for a new feature.

## Usage

```
/new-feature booking
/new-feature match-invite
```

Feature name is hyphenated. The scaffolder converts to PascalCase for types, camelCase for variables, and a lowercase folder name.

## What you produce

1. **Ask two questions max** before scaffolding:
   - What does the feature do in one sentence?
   - Is it primarily list-based, detail-based, or form-based? (Determines the starter screen shape.)

2. **Delegate to the `android-architect` agent** for a brief shape check — confirm which layers the feature needs (maybe no use case, maybe no DTO if purely local, etc.).

3. **Scaffold files:**

   ```
   ui/<feature>/
     <Feature>Route.kt                 # Wires view model, handles nav events
     <Feature>Screen.kt                # Stateless UI, takes UiState + callbacks
     <Feature>ViewModel.kt             # StateFlow<UiState>, handles events
     <Feature>UiState.kt               # Sealed or data class for state
     components/                       # Feature-specific composables

   domain/
     model/<Feature>.kt                # Domain model (if not already in model/)
     repository/<Feature>Repository.kt # Interface
     usecase/<Verb><Feature>UseCase.kt # Only if genuine business logic

   data/
     local/<Feature>Entity.kt          # Room entity (Android) / SQLDelight .sq file (KMP)
     local/<Feature>Dao.kt             # If Room
     remote/<Feature>Dto.kt            # If there's a network API
     remote/<Feature>Api.kt            # Ktor endpoint
     repository/Default<Feature>Repository.kt  # Implementation
     mapper/<Feature>Mappers.kt        # Dto ↔ Domain ↔ UI

   di/<Feature>Container.kt            # If the feature has enough dependencies to warrant its own container

   test/
     <Feature>ViewModelTest.kt         # With fake repository
     <Feature>RepositoryTest.kt        # With in-memory DB
     <Feature>MappersTest.kt           # If there are mappers
   ```

4. **Wire into AppContainer:**
   - Add `val <feature>Repository: <Feature>Repository` to the `AppContainer` interface.
   - Add the lazy-initialized implementation to `DefaultAppContainer`.
   - Or, if complex, add `val <feature>Container: <Feature>Container`.

5. **Wire into navigation:**
   - Add a `@Serializable object <Feature>Route` to `ui/nav/Routes.kt`.
   - Add the composable to `AppNavHost`:
     ```kotlin
     composable<<Feature>Route> {
         <Feature>Route(appContainer = appContainer, onBack = navController::popBackStack)
     }
     ```

6. **Pre-fill state and reducer patterns** — don't leave TODOs for every function. At least one happy-path flow should work end-to-end:
   - ViewModel loads data on init.
   - Repository returns a fake list (the user will plug in real data).
   - Screen renders the list.
   - Clicking an item triggers the event callback.

7. **Tests must compile and pass** — use fakes, not mocks. The user shouldn't have to fix the tests before running them.

## Pattern templates

### ViewModel shape

```kotlin
class <Feature>ViewModel(
    private val repository: <Feature>Repository
) : ViewModel() {

    private val _uiState = MutableStateFlow(<Feature>UiState())
    val uiState: StateFlow<<Feature>UiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.observeAll()
                .catch { e -> _uiState.update { it.copy(isLoading = false, error = UiError.fromThrowable(e)) } }
                .collect { items ->
                    _uiState.update { it.copy(isLoading = false, items = items.map { it.toUi() }) }
                }
        }
    }

    fun onItemClick(id: String) { /* event */ }
    fun onRefresh() { viewModelScope.launch { repository.sync() } }
}
```

### Route composable shape

```kotlin
@Composable
fun <Feature>Route(
    appContainer: AppContainer,
    onBack: () -> Unit,
) {
    val vm: <Feature>ViewModel = viewModel(factory = viewModelFactory {
        <Feature>ViewModel(appContainer.<feature>Repository)
    })
    val uiState by vm.uiState.collectAsStateWithLifecycle()
    <Feature>Screen(
        uiState = uiState,
        onItemClick = vm::onItemClick,
        onRefresh = vm::onRefresh,
        onBack = onBack,
    )
}
```

### Screen composable shape (stateless)

```kotlin
@Composable
fun <Feature>Screen(
    uiState: <Feature>UiState,
    onItemClick: (String) -> Unit,
    onRefresh: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) { ... }
```

Previews for empty, loading, error, and with-data states.

## After scaffolding

- Print the files created.
- Print the wiring touched (AppContainer, Routes, NavHost).
- Suggest: "Run the unit tests for this feature: `./gradlew :app:testDebugUnitTest --tests *<Feature>*`"
- Remind: fill in real data source (API endpoint, Room entity fields) before the feature ships.

## Guardrails

- Don't scaffold a use case if the repository method is a pass-through. Call it out as deliberately skipped.
- Don't create a feature container if the feature has ≤ 2 dependencies. Put them in AppContainer directly.
- If the feature shares a model with an existing feature, reuse the existing model; don't duplicate.
- If scaffolding in a KMP project, put business logic in `shared/commonMain` and only UI in `composeApp`.
