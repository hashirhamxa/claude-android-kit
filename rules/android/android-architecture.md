# Android Architecture

Clean Architecture + MVVM with **Manual DI via AppContainer**. No Hilt, no Koin, no Dagger. Ever.

## Why manual DI

- Compile-time verification without annotation processors.
- Zero reflection, zero KSP overhead on clean builds.
- Explicit dependency graph — reading `AppContainer.kt` tells you the whole app.
- Trivial to swap implementations in tests (constructor injection only).

If a project has a compelling reason to use Hilt, override this rule in that project's `CLAUDE.md`.

## Module layering

Every project has these logical layers, even if they live in the same Gradle module:

```
ui/            # Composables, view models, navigation
domain/        # Use cases, domain models, repository interfaces
data/          # Repository implementations, DAOs, network clients, mappers
di/            # AppContainer, feature containers
util/          # Pure utility functions, extensions
```

Dependencies only flow inward: `ui → domain ← data`. UI never imports data. Data never imports ui.

## AppContainer pattern

One top-level `AppContainer` owns app-scoped singletons (database, HTTP client, shared preferences). Feature-scoped containers hang off it.

```kotlin
interface AppContainer {
    val db: AppDatabase
    val httpClient: HttpClient
    val transactionRepository: TransactionRepository
    val smsParserContainer: SmsParserContainer
}

class DefaultAppContainer(context: Context) : AppContainer {
    override val db: AppDatabase by lazy {
        Room.databaseBuilder(context, AppDatabase::class.java, "app.db")
            .addMigrations(*AppDatabase.MIGRATIONS)
            .build()
    }

    override val httpClient: HttpClient by lazy {
        HttpClient(OkHttp) {
            install(ContentNegotiation) { json() }
            install(Logging) { level = LogLevel.HEADERS }
        }
    }

    override val transactionRepository: TransactionRepository by lazy {
        DefaultTransactionRepository(db.transactionDao(), Dispatchers.IO)
    }

    override val smsParserContainer: SmsParserContainer by lazy {
        SmsParserContainer(transactionRepository)
    }
}
```

Attach to `Application`:

```kotlin
class App : Application() {
    lateinit var container: AppContainer
    override fun onCreate() {
        super.onCreate()
        container = DefaultAppContainer(this)
    }
}
```

Reach from composables via a `LocalAppContainer` `CompositionLocal`, or from Activities via `(application as App).container`.

## ViewModel construction

Use the modern AndroidX `viewModelFactory` with `initializer` DSL from `androidx.lifecycle.viewmodel`:

```kotlin
val transactionListViewModelFactory = viewModelFactory {
    initializer {
        val app = (this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as App)
        TransactionListViewModel(app.container.transactionRepository)
    }
}
```

Or inject via composable route:

```kotlin
@Composable
fun TransactionListRoute(
    container: AppContainer = (LocalContext.current.applicationContext as App).container,
    viewModel: TransactionListViewModel = viewModel(
        factory = viewModelFactory {
            initializer { TransactionListViewModel(container.transactionRepository) }
        }
    )
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    TransactionListScreen(
        uiState = uiState,
        onItemClick = viewModel::onItemClick,
        onRefresh = viewModel::onRefresh
    )
}
```

## MVVM & StateFlow rules

- View models own `StateFlow<UiState>` and expose it as a read-only `StateFlow`.
- `UiState` is a single immutable data class. No separate `isLoading`, `error`, `data` flows.
- When combining or transforming repository flows, produce state with `SharingStarted.WhileSubscribed(5_000)`:
  ```kotlin
  val uiState: StateFlow<TransactionListUiState> = repository.observeTransactions()
      .map { transactions -> TransactionListUiState(items = transactions.map { it.toUi() }, isLoading = false) }
      .stateIn(
          scope = viewModelScope,
          started = SharingStarted.WhileSubscribed(5_000),
          initialValue = TransactionListUiState(isLoading = true)
      )
  ```
  *(The 5-second timeout preserves upstream subscriptions during configuration changes like screen rotations without leaking when backgrounded).*
- View models take repository interfaces, never concrete implementations.
- No Android framework types (`Context`, `Resources`, `View`) in view models. Ever.
- `SavedStateHandle` for process-death-surviving state only, not for all state.

```kotlin
data class TransactionListUiState(
    val items: List<TransactionUi> = emptyList(),
    val isLoading: Boolean = false,
    val error: UiError? = null
)
```

## Repository rules

- Single source of truth = local DB. Network writes to DB, UI reads from DB.
- Repository returns `Flow<T>` for observable data, `suspend fun` for one-shot operations.
- Repository handles its own threading with `flowOn(Dispatchers.IO)`. Never pushes threading concerns up.
- Network errors stay in the repository layer. Surface them as typed domain errors.

## Use cases

- Use cases are classes with a single `operator fun invoke(...)`.
- One use case per business action. Don't group unrelated actions.
- Use cases compose repositories; they don't compose other use cases unless there's genuine reuse.
- If a use case is just a pass-through to a repository, skip it. Not every screen needs a use case layer.

## Navigation & Edge-to-Edge

- **Compose Type-Safe Navigation**: Routes are `@Serializable` objects or data classes using `kotlinx.serialization`.
- Single Activity (`MainActivity`). No Fragments in new code.
- Always call `enableEdgeToEdge()` in `MainActivity.onCreate()` (enforced by default on Android 15+).
- Handle window insets explicitly in UI layouts using `Modifier.windowInsetsPadding(WindowInsets.safeDrawing)` or `Scaffold`.

```kotlin
// ui/nav/Routes.kt
@Serializable object TransactionListRoute
@Serializable data class TransactionDetailRoute(val transactionId: String)

// NavHost setup
NavHost(navController = navController, startDestination = TransactionListRoute) {
    composable<TransactionListRoute> {
        TransactionListRoute(onNavigateToDetail = { id ->
            navController.navigate(TransactionDetailRoute(id))
        })
    }
    composable<TransactionDetailRoute> { backStackEntry ->
        val route: TransactionDetailRoute = backStackEntry.toRoute()
        TransactionDetailRoute(transactionId = route.transactionId)
    }
}
```

## Package structure (feature-first)

```
com.hash.myapp/
├── App.kt
├── MainActivity.kt
├── di/AppContainer.kt
├── ui/
│   ├── theme/
│   ├── nav/
│   ├── common/           # Shared composables
│   └── transactions/     # Feature
│       ├── list/
│       ├── detail/
│       └── TransactionsContainer.kt
├── domain/
│   ├── model/
│   ├── repository/       # Interfaces
│   └── usecase/
└── data/
    ├── local/
    ├── remote/
    └── repository/       # Implementations
```

Flat until it hurts. Don't pre-create folders for features that don't exist yet.
