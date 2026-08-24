# SwiftUI & Apple Platform Interoperability

## 1. SKIE Integration
- **Mandatory Bridge:** Use **SKIE** (Simple Kotlin Interop Export) for bridging Kotlin Coroutines, `StateFlow`, `SharedFlow`, and `suspend` functions into Swift concurrency.
- **Swift Concurrency Support:** SKIE converts Kotlin flows to Swift `AsyncSequence` and enables seamless integration with SwiftUI `@Observable` (iOS 17+) and `ObservableObject`.

```swift
import SwiftUI
import SharedKit

@Observable
@MainActor
final class SwiftFeatureViewModel {
    private let kmpViewModel: FeatureViewModel
    var state: UiState = UiStateLoading()

    init(kmpViewModel: FeatureViewModel) {
        self.kmpViewModel = kmpViewModel
    }

    func observeState() async {
        for await nextState in kmpViewModel.uiState {
            self.state = nextState
        }
    }
}
```

## 2. Sealed Hierarchies to Native Swift Enums
- **Exhaustive Matching:** Leverage SKIE-generated Swift enums with associated values for Kotlin `sealed interface` / `sealed class` hierarchies.
- **Type-Casting Prohibition:** Direct Swift `is` or `as?` type-casting on Kotlin class hierarchies is forbidden; always use exhaustive `switch` pattern matching.

```swift
struct FeatureContentView: View {
    let state: UiState

    var body: some View {
        switch onEnum(of: state) {
        case .loading:
            ProgressView()
        case .content(let contentState):
            ItemList(items: contentState.items)
        case .error(let errorState):
            ErrorView(message: errorState.message)
        }
    }
}
```

## 3. Swift 6 Concurrency & Thread Isolation
- **`@MainActor` Isolation:** All SwiftUI views, ViewModels, and UI-bound adapters consuming shared Kotlin flows or invoking suspend functions must be explicitly decorated with `@MainActor`.
- **Background Execution:** Long-running computations dispatched from shared Kotlin code must remain isolated from the Swift UI actor until state is emitted.
