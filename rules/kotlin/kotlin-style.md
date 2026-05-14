# Kotlin Style

Applies to all Kotlin code across Android, KMP, and shared modules.

## Immutability first

- Prefer `val` over `var`. Reach for `var` only inside short-lived local scopes.
- Data classes for value types. Never use `var` properties in data classes.
- Collections: use `listOf`, `mapOf`, `setOf` by default. `mutableListOf` only inside the function that builds the collection.
- For state exposed to UI, use `StateFlow<ImmutableType>`. Treat every emission as a new value.

## Null safety

- No `!!` in production code. If you need it, refactor.
- `?.let { }` for side effects on non-null. `?:` for fallbacks. Both chained for defaults + actions.
- `requireNotNull` at boundaries where null is a bug, not a state.
- Nullable return types mean "legitimately absent," not "I was too lazy to model the error."

## Error handling

- `Result<T>` or a sealed `Outcome<T>` wrapper at module boundaries. Exceptions inside a module, typed results across modules.
- Never swallow `CancellationException`. Re-throw if you catch `Throwable`.
- Domain errors are sealed classes, not strings.

```kotlin
sealed interface TransactionError {
    data object DuplicateDetected : TransactionError
    data class ParseFailed(val raw: String) : TransactionError
    data class Unknown(val cause: Throwable) : TransactionError
}
```

## Coroutines & Flow

- Suspend at the edges (repositories, use cases). Keep domain logic non-suspending where possible.
- Use structured concurrency. No `GlobalScope` outside of genuinely process-scoped work.
- `Dispatchers.IO` for disk/network, `Dispatchers.Default` for CPU-bound, no explicit dispatcher for pure logic.
- `StateFlow` for hot state with a current value. `SharedFlow` for events. Cold `Flow` for streams from storage/network.
- Always use `flowOn` at the repository boundary, not in the view model.

## Sealed types over enums when behavior differs

- Enum when the variants are just labels.
- Sealed interface/class when each variant carries different data or behavior.
- Prefer `sealed interface` over `sealed class` unless you need state.

## Scope functions — use with intent

- `let` — transform nullable.
- `run` — call methods on a receiver and return a result.
- `apply` — configure an object, return it.
- `also` — side effect (logging), return the original.
- `with` — multiple calls on a non-null receiver.

If the scope function adds no clarity, just write the plain code.

## Imports

- No wildcard imports (`import foo.*`). Explicit only.
- Group: stdlib, third-party, project. Android Studio's default organizer is fine.

## Formatting

- 4-space indent (Kotlin standard, not 2).
- Trailing commas on multi-line parameter lists.
- Max line length 120.
- `ktlint` or `detekt` in every project. Fail the build on violations.

## Prefer these idioms

- `buildList { }` over manual `mutableListOf` + `add` loops.
- `when` expressions over long `if/else` chains.
- Extension functions over static utility classes.
- Top-level functions over singleton objects when there's no state.
- `companion object` only when you genuinely need Java interop or reflection access.
