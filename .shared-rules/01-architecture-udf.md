# Architecture & Unidirectional Data Flow (UDF)

## 1. UDF Contract

Every feature UI layer must follow strict sealed hierarchies for state, intents, and effects:

```kotlin
// 1. Immutable State
sealed interface UiState {
    data object Loading : UiState
    data class Content(val items: List<ItemUiModel>) : UiState
    data class Error(val message: String) : UiState
}

// 2. User Actions / Intent
sealed interface UiIntent {
    data class SelectItem(val id: String) : UiIntent
    data object Refresh : UiIntent
}

// 3. Single-Fire Side Effects (Navigation, Toasts, Snackbars)
sealed interface UiEffect {
    data class NavigateToDetails(val id: String) : UiEffect
    data class ShowToast(val message: String) : UiEffect
}
```

## 2. ViewModel Standard

- **State Exposure:** Expose `StateFlow<UiState>` created with `.stateIn(...)` to guarantee lifecycle-aware subscription and state caching.
- **Effect Exposure:** Expose one-off side effects via `Channel.receiveAsFlow()` to prevent event dropping or replay bugs.
- **Zero Android Imports:** Domain and Repository interfaces must have zero Android framework dependencies (`android.*`). Keep them pure Kotlin.

```kotlin
class FeatureViewModel(
    private val getItemUseCase: GetItemUseCase
) : ViewModel() {

    private val _effects = Channel<UiEffect>(Channel.BUFFERED)
    val uiEffect: Flow<UiEffect> = _effects.receiveAsFlow()

    val uiState: StateFlow<UiState> = getItemUseCase()
        .map<List<Item>, UiState> { UiState.Content(it.toUiModel()) }
        .onStart { emit(UiState.Loading) }
        .catch { emit(UiState.Error(it.message ?: "Unknown error")) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = UiState.Loading
        )

    fun onIntent(intent: UiIntent) {
        when (intent) {
            is UiIntent.SelectItem -> handleSelection(intent.id)
            is UiIntent.Refresh -> refreshData()
        }
    }

    private fun handleSelection(id: String) {
        viewModelScope.launch {
            _effects.send(UiEffect.NavigateToDetails(id))
        }
    }
}
```

## 3. Clean Architecture Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                          UI Layer                           │
│             (Compose / SwiftUI / ViewModels)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ (calls UseCases / Observes State)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Domain Layer                         │
│         (UseCases, Domain Models, Repository Contracts)      │
│                 * PURE KOTLIN — NO FRAMEWORK *              │
└──────────────────────────────▲──────────────────────────────┘
                               │ (Implements Contracts)
┌──────────────────────────────┴──────────────────────────────┐
│                         Data Layer                          │
│     (Repository Impls, Ktor, Room, DataStore, Network DTOs)  │
└─────────────────────────────────────────────────────────────┘
```

- **Rule 1:** UI layer interacts **only** with Domain (Use Cases or Repository Interfaces).
- **Rule 2:** UI must **never** directly reference or instantiate Data Layer classes (Data Sources, DTOs, DAOs).
- **Rule 3:** Data Layer models (DTOs, DB Entities) must be mapped to Domain Models before crossing into Domain.
