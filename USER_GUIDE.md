# Claude Android Kit — Developer & AI Agent User Guide

Welcome to the **Claude Android Kit** user guide. This toolkit is engineered to provide a production-ready, zero-drift mobile architecture spanning **Jetpack Compose**, **Kotlin Multiplatform (KMP)**, **Android Native**, and **Native iOS (SwiftUI)**, while eliminating LLM hallucinations and code drift across **Claude Code**, **Cursor**, and **Google Antigravity**.

---

## 📑 Table of Contents
1. [Core Architecture & Mental Model](#1-core-architecture--mental-model)
2. [Quick Setup & Initialization](#2-quick-setup--initialization)
3. [AI Agent Workflows (Cursor, Claude Code, Antigravity)](#3-ai-agent-workflows)
4. [Feature Scaffolding Guide](#4-feature-scaffolding-guide)
5. [Architecture & Coding Standards](#5-architecture--coding-standards)
6. [Native iOS & SwiftUI Interop](#6-native-ios--swiftui-interop)
7. [Verification, Linting & CI/CD](#7-verification-linting--cicd)
8. [FAQ & Troubleshooting](#8-faq--troubleshooting)

---

## 1. Core Architecture & Mental Model

### The Single Source of Truth (SSOT)
All architectural rules, naming conventions, and lifecycle constraints are defined once in `.shared-rules/`:

```text
┌─────────────────────────────────────────────────────────────┐
│                    .shared-rules/ (SSOT)                    │
│      01-UDF • 02-Compose • 03-KMP • 04-Swift • 05-Tests     │
└──────────────────────────────┬──────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│    Claude Code    │  │      Cursor       │  │ Google Antigravity│
│     CLAUDE.md     │  │   .cursor/rules/  │  │ AGENT_WORKSPACE.md│
│  .claude/commands │  │    *.mdc Globs    │  │ Verification Gates│
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

### Module Hierarchy
Every feature is split into 3 decoupled tiers:
- **`:feature:<name>:domain`**: Pure Kotlin models, repository interfaces, and use cases (**zero Android imports**).
- **`:feature:<name>:data`**: Repository implementations backed by `:core:network` (Ktor 3) and `:core:database` (Room 3 KMP).
- **`:feature:<name>:ui`**: Compose Multiplatform UI, ViewModel (`StateFlow`), and type-safe navigation routes.

---

## 2. Quick Setup & Initialization

### Option A: Initialize a New Project from Scratch
Run the one-line interactive bootstrapper in your terminal:

```bash
curl -sSL https://raw.githubusercontent.com/hashirhamxa/claude-android-kit/main/init.sh | bash -s my-app com.mycompany.app
```

This command will:
1. Clone the toolkit into `my-app/`.
2. Recursively refactor all packages and directories to `com.mycompany.app`.
3. Configure `.githooks/` pre-commit validators.
4. Run the initial architecture linter.

### Option B: Clone & Configure Existing Repository

```bash
git clone https://github.com/hashirhamxa/claude-android-kit.git
cd claude-android-kit

# Run developer bootstrap script
chmod +x tools/setup_dev_environment.sh
./tools/setup_dev_environment.sh
```

---

## 3. AI Agent Workflows

### Working in Cursor
Open the project in Cursor. Rule files in `.cursor/rules/*.mdc` automatically attach to your AI chat / Composer context based on active file patterns:

| Editing File | Auto-Attached Rule | Enforced Constraints |
| :--- | :--- | :--- |
| `*ViewModel.kt` | `01-architecture-udf.mdc` | `StateFlow` via `.stateIn()`, `Channel` for effects |
| `*Screen.kt` | `02-compose-guidelines.mdc` | `collectAsStateWithLifecycle()`, stable keys, insets |
| `commonMain/**/*.kt` | `03-kmp-guidelines.mdc` | Zero `android.*` imports, pure Kotlin domain |
| `iosApp/**/*.swift` | `04-swiftui-interop.mdc` | `@MainActor`, SKIE enum pattern matching |
| `*Test.kt` | `05-testing-verification.mdc` | Turbine Flow assertions, in-memory test doubles |

### Working in Claude Code
Start Claude Code in your project directory:

```bash
claude
```

Use the built-in slash commands:
- **`/scaffold-feature <name>`**: Automates creation of `:domain`, `:data`, and `:ui` submodules and registers them in `settings.gradle.kts`.
- **`/review-compose`**: Audits open or modified Compose files for performance traps (unstable parameters, missing `remember`, raw `collectAsState()`).
- **`/verify`**: Executes Android, KMP Common, and iOS simulator builds.

### Working in Google Antigravity
Antigravity automatically reads `AGENT_WORKSPACE.md` and `.antigravity/gates/task_verification_gates.json`:
- **Execution Lanes**: Prevents agents from crossing boundaries (e.g. `SharedCoreAgent` cannot modify `androidMain`).
- **Blocking Gates**: Automatically halts tasks if `python tools/verify_architecture.py` detects an anti-pattern.

---

## 4. Feature Scaffolding Guide

### 1. Run Scaffolding Command
Generate a new feature module (e.g., `profile`):

```bash
python tools/scaffold_feature.py profile com.kit
```

This creates:
```text
feature/profile/
├── domain/
│   ├── build.gradle.kts
│   └── src/commonMain/kotlin/com/kit/profile/domain/
│       ├── model/ProfileItem.kt
│       └── repository/ProfileRepository.kt
├── data/
│   ├── build.gradle.kts
│   └── src/commonMain/kotlin/com/kit/profile/data/
│       └── repository/ProfileRepositoryImpl.kt
└── ui/
    ├── build.gradle.kts
    └── src/commonMain/kotlin/com/kit/profile/ui/
        ├── ProfileContract.kt     # UiState, UiIntent, UiEffect, ProfileRoute
        ├── ProfileViewModel.kt    # StateFlow + Channels
        └── ProfileScreen.kt       # Compose Screen with safe insets
```

### 2. Register in `settings.gradle.kts`
Add the new modules:

```kotlin
include(":feature:profile:domain")
include(":feature:profile:data")
include(":feature:profile:ui")
```

### 3. Wire into Navigation & Koin
In `composeApp/src/commonMain/kotlin/com/kit/app/di/AppModule.kt`:
```kotlin
val featureProfileModule = module {
    single<ProfileRepository> { ProfileRepositoryImpl() }
    viewModelOf(::ProfileViewModel)
}
```

In `composeApp/src/commonMain/kotlin/com/kit/app/App.kt`:
```kotlin
composable<ProfileRoute> {
    val viewModel: ProfileViewModel = koinViewModel()
    ProfileScreen(viewModel = viewModel)
}
```

---

## 5. Architecture & Coding Standards

### Unidirectional Data Flow (UDF) Contract
Every UI screen adheres to a sealed contract:

```kotlin
// 1. Immutable State
sealed interface ProfileUiState {
    data object Loading : ProfileUiState
    data class Success(val items: List<ProfileItem>) : ProfileUiState
    data class Error(val message: String) : ProfileUiState
}

// 2. User Actions
sealed interface ProfileUiIntent {
    data object Refresh : ProfileUiIntent
    data class OnItemClicked(val id: String) : ProfileUiIntent
}

// 3. Single-Fire Side Effects
sealed interface ProfileUiEffect {
    data class NavigateToDetails(val id: String) : ProfileUiEffect
    data class ShowToast(val message: String) : ProfileUiEffect
}
```

### ViewModel Rules
1. **State Production:** Always use `.stateIn(scope = viewModelScope, started = SharingStarted.WhileSubscribed(5_000), initialValue = ...)`.
2. **Side Effects:** Expose effects as `Channel<UiEffect>(Channel.BUFFERED).receiveAsFlow()`.
3. **No Android Imports:** ViewModels in `commonMain` must import `androidx.lifecycle.ViewModel`, not `android.*`.

### Compose UI Rules
1. **State Collection:** Always use `val state by viewModel.uiState.collectAsStateWithLifecycle()`. (Raw `collectAsState()` is banned).
2. **Edge-to-Edge:** Apply `Modifier.safeDrawingPadding()` or `Modifier.imePadding()` to root screens.
3. **Lazy Lists:** Provide a unique, stable key to `items(items, key = { it.id })`.

---

## 6. Native iOS & SwiftUI Interop

The toolkit uses **SKIE** to seamlessly project Kotlin coroutines and sealed interfaces into native Swift:

### Consuming Kotlin ViewModel in SwiftUI

```swift
import SwiftUI
import ComposeApp

@Observable
@MainActor
final class SwiftProfileViewModel {
    private let viewModel: ProfileViewModel
    var uiState: ProfileUiState = ProfileUiStateLoading()

    init(viewModel: ProfileViewModel) {
        self.viewModel = viewModel
    }

    func observeState() async {
        // SKIE converts StateFlow to Swift AsyncSequence
        for await state in viewModel.uiState {
            self.uiState = state
        }
    }
}

struct ProfileView: View {
    let state: ProfileUiState

    var body: some View {
        // SKIE enables exhaustive switch pattern matching on Kotlin sealed classes
        switch onEnum(of: state) {
        case .loading:
            ProgressView()
        case .success(let successState):
            List(successState.items, id: \.id) { item in
                Text(item.title)
            }
        case .error(let errorState):
            Text("Error: \(errorState.message)")
        }
    }
}
```

---

## 7. Verification, Linting & CI/CD

### 1. Static Architecture Linter (Fast Fail)
Check for banned imports (`android.*` in commonMain), raw `collectAsState()`, string routes, and `GlobalScope`:

```bash
python tools/verify_architecture.py
```

### 2. Full Multiplatform Compilation Gate
Compile Android, KMP common metadata, and iOS simulator targets, then execute unit tests:

```bash
./tools/verify_build.sh
```

### 3. Continuous Integration Matrix
On every push/PR, GitHub Actions runs:
- **`ubuntu-latest`:** Architecture Linter $\rightarrow$ Android build $\rightarrow$ Unit tests with Turbine.
- **`macos-14`:** Native iOS simulator build (`compileKotlinIosSimulatorArm64`).

---

## 8. FAQ & Troubleshooting

#### Q: Why does `verify_architecture.py` fail on my import?
> Ensure you did not import `android.*` or `androidx.compose.ui.platform.LocalContext` inside `commonMain`. Platform-specific code must live in `androidMain` or behind an interface.

#### Q: How do I test `Flow` emissions in `commonTest`?
> Use `Turbine`:
> ```kotlin
> viewModel.uiState.test {
>     assertEquals(UiState.Loading, awaitItem())
>     // ...
> }
> ```

#### Q: How do I add a new multiplatform dependency?
> 1. Add version and library definition in `gradle/libs.versions.toml`.
> 2. Add it to a convention bundle or reference it in your module's `build.gradle.kts`.

---

Happy building! 🚀 If you have questions or want to propose new rules, refer to [CONTRIBUTING.md](CONTRIBUTING.md).
