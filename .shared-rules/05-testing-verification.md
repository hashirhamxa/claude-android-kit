# Testing & Verification Standards

## 1. Unit Testing with `kotlin.test` & Turbine
- **Coroutines & Flow Emissions:** All unit tests for ViewModels, Use Cases, and Repositories must use `kotlin.test` and **Turbine** (`app.cash.turbine:turbine`) to assert Flow states and side effect emissions in `commonTest`.

```kotlin
class FeatureViewModelTest {

    @Test
    fun `when refresh intent triggered, emits loading then content`() = runTest {
        val fakeRepo = FakeItemRepository()
        val viewModel = FeatureViewModel(GetItemUseCase(fakeRepo))

        viewModel.uiState.test {
            assertEquals(UiState.Loading, awaitItem())
            fakeRepo.emitItems(listOf(Item(id = "1", title = "Test")))
            val contentState = awaitItem()
            assertIs<UiState.Content>(contentState)
            assertEquals(1, contentState.items.size)
        }
    }
}
```

## 2. Test Doubles: Fakes over Heavy Mocking
- **In-Memory Fakes:** Implement lightweight in-memory `Fake` classes in `commonTest` for repository and data source interfaces.
- **Prohibition:** Avoid heavy bytecode manipulation/reflection-based mocking libraries (e.g., Mockito) in `commonTest`. Fakes ensure deterministic, fast, multiplatform-compatible tests.

```kotlin
class FakeItemRepository : ItemRepository {
    private val flow = MutableSharedFlow<List<Item>>(replay = 1)

    override fun observeItems(): Flow<List<Item>> = flow

    suspend fun emitItems(items: List<Item>) {
        flow.emit(items)
    }
}
```

## 3. CLI Verification Commands
Run standard CLI validation suites prior to pushing code:

- **Android compilation & unit tests:**
  ```bash
  ./gradlew compileDebugKotlin testDebugUnitTest
  ```

- **iOS compilation check (KMP targets):**
  ```bash
  ./gradlew compileKotlinIosSimulatorArm64
  ```

- **Full multiplatform verification:**
  ```bash
  ./gradlew allTests
  ```
