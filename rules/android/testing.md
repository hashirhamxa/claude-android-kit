<!-- Derived from rules/05-testing.md during Phase 1 split.
     Extends rules/common/testing.md — install common/ alongside this file -->
# Testing

## Test doubles

- **MockK when you must** (Android/JVM only). Use `mockk<T>(relaxed = true)` sparingly — it hides intent.

## ViewModel tests

```kotlin
class TransactionListViewModelTest {

    private val repository = FakeTransactionRepository()
    private lateinit var viewModel: TransactionListViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        viewModel = TransactionListViewModel(repository)
    }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `emits loading then data when transactions load`() = runTest {
        viewModel.uiState.test {
            assertTrue(awaitItem().isLoading)
            repository.emit(listOf(fakeTransaction()))
            val state = awaitItem()
            assertFalse(state.isLoading)
            assertEquals(1, state.items.size)
        }
    }
}
```

Assertions are on observable state, not internal fields.

## Repository tests

- Test against an in-memory Room database.
- Test every DAO query — these silently break on schema migrations.
- Test every migration explicitly if you have more than one.

## UI tests — minimal

- Compose UI tests (`createComposeRule`) for critical flows only: auth, checkout, primary nav.
- No instrumented tests for things a unit test covers.
- Snapshot tests (Paparazzi or Roborazzi) for visual regressions on design-heavy screens. Review diffs manually.

## Structure

```
src/test/                  # Unit tests (JVM)
src/androidTest/           # Instrumented tests (rare)
src/test/resources/        # Fixtures, SMS samples, JSON responses
```
