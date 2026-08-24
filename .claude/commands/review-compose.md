---
description: Audit Jetpack Compose and Compose Multiplatform code for anti-patterns and performance issues
---

Audit the current Compose UI implementation against `.shared-rules/02-compose-guidelines.md`:

Check for:
1. Any usage of `collectAsState()` instead of `collectAsStateWithLifecycle()`.
2. Missing stable keys in `LazyColumn` / `LazyRow` items (`items(items, key = { ... })`).
3. Instantiating objects or Modifiers inside Composable function bodies without `remember`.
4. Hardcoded insets or missing `Modifier.safeDrawingPadding()` / `Modifier.imePadding()`.
5. Direct ViewModel parameter passing into leaf UI components (must pass plain state + lambdas).

Report any violations with file path, line number, and the exact code fix.
