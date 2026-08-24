---
description: Scaffold a complete, clean-architecture feature module (Domain, Data, UI)
argument-hint: "[feature-name]"
arguments: [feature]
---

Scaffold a production-ready feature module for: $feature

Execute the following steps:
1. Create `:feature:$feature:domain`
   - Define `$feature/domain/model/` data classes.
   - Define `$feature/domain/repository/${feature^}Repository.kt` interface.
2. Create `:feature:$feature:data`
   - Implement `${feature^}RepositoryImpl.kt` using Ktor/Room data sources.
3. Create `:feature:$feature:ui`
   - Create `${feature^}Contract.kt` defining `${feature^}UiState`, `${feature^}UiIntent`, `${feature^}UiEffect`.
   - Create `${feature^}ViewModel.kt` utilizing `stateIn(WhileSubscribed(5000))`.
   - Create `${feature^}Screen.kt` using Jetpack Compose with `@Serializable` navigation destination.
4. Register modules in `settings.gradle.kts`.
5. Run `./gradlew :feature:$feature:ui:compileDebugKotlin` to verify.
