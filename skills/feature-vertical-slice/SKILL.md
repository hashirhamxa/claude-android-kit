---
name: feature-vertical-slice
description: Workflow for adding a feature as a full vertical slice — entity, DAO, repository, use case (if needed), view model, UI, navigation, and tests. Use when adding any non-trivial feature to an existing Android or KMP project.
---

# Feature Vertical Slice — Workflow

Add a feature that goes through every layer in one coherent pass. Vertical, not horizontal — don't build all data layer first and UI later.

## Decision tree before scaffolding

Ask yourself (or the user):

1. **Does this feature touch the network, local DB, both, or neither?** Determines which data layer files to create.
2. **Is there a business rule beyond CRUD?** If yes, one use case. If no, skip the use case layer.
3. **Is this a list, detail, or form?** Determines the UI starting shape.
4. **Does it share data with existing features?** If yes, reuse models; don't copy.

## File creation order (top-down, by layer)

### 1. Domain model

`domain/model/Booking.kt`:
```kotlin
data class Booking(
    val id: String,
    val turfId: String,
    val startAt: Instant,
    val endAt: Instant,
    val status: BookingStatus,
)

enum class BookingStatus { PENDING, CONFIRMED, CANCELLED }
```

Domain models know nothing about Room, Ktor, or Compose. Pure Kotlin.

### 2. Repository interface

`domain/repository/BookingRepository.kt`:
```kotlin
interface BookingRepository {
    fun observeAll(): Flow<List<Booking>>
    suspend fun refresh(): Result<Unit>
    suspend fun book(turfId: String, start: Instant, end: Instant): Result<Booking>
    suspend fun cancel(id: String): Result<Unit>
}
```

`Flow` for observable, `suspend` for actions. `Result` at boundaries.

### 3. Use case (only if there's real business logic)

`domain/usecase/BookTurfUseCase.kt`:
```kotlin
class BookTurfUseCase(
    private val bookingRepo: BookingRepository,
    private val turfRepo: TurfRepository,
) {
    suspend operator fun invoke(turfId: String, start: Instant, end: Instant): Result<Booking> {
        val turf = turfRepo.get(turfId).getOrElse { return Result.failure(it) }
        if (!turf.isOpenAt(start, end)) {
            return Result.failure(BookingError.OutsideOperatingHours)
        }
        return bookingRepo.book(turfId, start, end)
    }
}
```

**Skip the use case if all it does is forward to the repository.** Not every feature needs one.

### 4. Data layer — local

Android (Room):

`data/local/BookingEntity.kt`:
```kotlin
@Entity(tableName = "bookings")
data class BookingEntity(
    @PrimaryKey val id: String,
    val turfId: String,
    val startAt: Long,
    val endAt: Long,
    val status: String,
)
```

`data/local/BookingDao.kt`:
```kotlin
@Dao
interface BookingDao {
    @Query("SELECT * FROM bookings ORDER BY startAt DESC")
    fun observeAll(): Flow<List<BookingEntity>>

    @Query("SELECT * FROM bookings WHERE id = :id")
    suspend fun get(id: String): BookingEntity?

    @Upsert
    suspend fun upsert(entities: List<BookingEntity>)

    @Query("DELETE FROM bookings WHERE id = :id")
    suspend fun delete(id: String)
}
```

Add to `AppDatabase`:
```kotlin
@Database(entities = [BookingEntity::class, ...], version = 2, exportSchema = true)
abstract class AppDatabase : RoomDatabase() {
    abstract fun bookingDao(): BookingDao
    ...
}
```

Version bump + migration.

KMP (SQLDelight): create `.sq` file with table + queries. No manual entity class; SQLDelight generates one.

### 5. Data layer — remote (if applicable)

`data/remote/BookingDto.kt` — with `@Serializable`.

`data/remote/BookingApi.kt` — Ktor requests:
```kotlin
class BookingApi(private val client: HttpClient, private val baseUrl: String) {
    suspend fun list(): List<BookingDto> = client.get("$baseUrl/bookings").body()
    suspend fun create(body: CreateBookingDto): BookingDto = client.post("$baseUrl/bookings") {
        contentType(ContentType.Application.Json); setBody(body)
    }.body()
}
```

### 6. Mappers

`data/mapper/BookingMappers.kt`:
```kotlin
fun BookingEntity.toDomain() = Booking(id, turfId, Instant.fromEpochMilliseconds(startAt), ...)
fun Booking.toEntity() = BookingEntity(id, turfId, startAt.toEpochMilliseconds(), ...)
fun BookingDto.toEntity() = BookingEntity(...)
```

Mappers are plain functions. No classes.

### 7. Repository implementation

`data/repository/DefaultBookingRepository.kt`:
```kotlin
class DefaultBookingRepository(
    private val dao: BookingDao,
    private val api: BookingApi,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO,
) : BookingRepository {

    override fun observeAll(): Flow<List<Booking>> =
        dao.observeAll().map { list -> list.map { it.toDomain() } }.flowOn(dispatcher)

    override suspend fun refresh(): Result<Unit> = withContext(dispatcher) {
        runCatching {
            val remote = api.list()
            dao.upsert(remote.map { it.toEntity() })
        }
    }

    override suspend fun book(turfId: String, start: Instant, end: Instant) = withContext(dispatcher) {
        runCatching {
            val dto = api.create(CreateBookingDto(turfId, start.toEpochMilliseconds(), end.toEpochMilliseconds()))
            dao.upsert(listOf(dto.toEntity()))
            dto.toEntity().toDomain()
        }
    }

    override suspend fun cancel(id: String) = withContext(dispatcher) {
        runCatching {
            api.delete(id)
            dao.delete(id)
        }
    }
}
```

### 8. Wire into AppContainer

```kotlin
interface AppContainer {
    ...
    val bookingRepository: BookingRepository
    val bookTurfUseCase: BookTurfUseCase   // if using
}

class DefaultAppContainer(context: Context) : AppContainer {
    ...
    private val bookingApi by lazy { BookingApi(httpClient, BuildConfig.API_URL) }

    override val bookingRepository: BookingRepository by lazy {
        DefaultBookingRepository(db.bookingDao(), bookingApi)
    }

    override val bookTurfUseCase by lazy {
        BookTurfUseCase(bookingRepository, turfRepository)
    }
}
```

### 9. UI layer

`ui/booking/BookingUiState.kt`:
```kotlin
data class BookingUiState(
    val isLoading: Boolean = true,
    val bookings: List<BookingUi> = emptyList(),
    val error: UiError? = null,
)

data class BookingUi(val id: String, val turfName: String, val timeRange: String, val status: BookingStatus)
```

`ui/booking/BookingViewModel.kt`:
```kotlin
class BookingViewModel(
    private val repository: BookingRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(BookingUiState())
    val uiState: StateFlow<BookingUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.observeAll()
                .map { bookings -> bookings.map { it.toUi() } }
                .catch { e -> _uiState.update { it.copy(isLoading = false, error = UiError.from(e)) } }
                .collect { ui -> _uiState.update { it.copy(isLoading = false, bookings = ui) } }
        }
        refresh()
    }

    fun onRefresh() = refresh()

    fun onCancel(id: String) = viewModelScope.launch {
        repository.cancel(id).onFailure { e ->
            _uiState.update { it.copy(error = UiError.from(e)) }
        }
    }

    private fun refresh() = viewModelScope.launch {
        repository.refresh().onFailure { e ->
            _uiState.update { it.copy(error = UiError.from(e)) }
        }
    }
}
```

`ui/booking/BookingRoute.kt` and `BookingScreen.kt` — Route wires view model, Screen is stateless.

### 10. Navigation

Add route to `ui/nav/Routes.kt`:
```kotlin
@Serializable object BookingRoute
```

Add destination to `AppNavHost`:
```kotlin
composable<BookingRoute> {
    val container = LocalAppContainer.current
    BookingRoute(
        viewModel = viewModel(factory = viewModelFactory { BookingViewModel(container.bookingRepository) }),
        onBack = { navController.popBackStack() },
    )
}
```

### 11. Tests

`BookingViewModelTest.kt`:
```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class BookingViewModelTest {
    private val repository = FakeBookingRepository()

    @Before fun setUp() = Dispatchers.setMain(UnconfinedTestDispatcher())
    @After fun tearDown() = Dispatchers.resetMain()

    @Test
    fun `emits loading then list when repository emits`() = runTest {
        val vm = BookingViewModel(repository)
        vm.uiState.test {
            assertTrue(awaitItem().isLoading)
            repository.emit(listOf(fakeBooking()))
            val state = awaitItem()
            assertFalse(state.isLoading)
            assertEquals(1, state.bookings.size)
        }
    }
}
```

`FakeBookingRepository` — use a `MutableSharedFlow` internally, expose via `observeAll`.

`DefaultBookingRepositoryTest.kt` — in-memory Room DB, verify DAO + mapper together.

### 12. DB migration (if Android + Room)

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY NOT NULL,
                turfId TEXT NOT NULL,
                startAt INTEGER NOT NULL,
                endAt INTEGER NOT NULL,
                status TEXT NOT NULL
            )
        """.trimIndent())
    }
}
```

Register in `AppDatabase.MIGRATIONS`.

### 13. Commit plan

```
feat(booking): domain models and repository interface
feat(booking): data layer — dao, api, repository impl
feat(booking): view model and ui
feat(booking): nav wiring and appcontainer
test(booking): view model and repository tests
```

## Checklist before calling the feature done

- [ ] All tests pass: `./gradlew test`.
- [ ] App builds: `./gradlew assembleDebug`.
- [ ] Screen has previews for at least: empty, loading, error, data.
- [ ] No Android types in view model.
- [ ] No domain types leak UI concerns (no `@Composable` in domain).
- [ ] AppContainer wiring complete.
- [ ] Nav route registered.
- [ ] Migration written (if schema changed).
- [ ] CLAUDE.md updated if this feature introduces a new pattern or package.

## When to break from the template

Skip layers when they add nothing:

- No use case if the repository method is a pass-through.
- No DTO if the API returns the exact domain shape and you don't want to decouple.
- No feature container if the feature has ≤ 2 dependencies.

Add layers when they clarify:

- Separate `<Feature>EventHandler` if event logic is complex (e.g. SMS parsing dispatch).
- Separate mapper object (not top-level functions) if mappers need dependency injection for config.

Don't follow the template blindly. It's a starting shape, not a law.
