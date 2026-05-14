<!-- Derived from rules/05-testing.md during Phase 1 split.
     Platform-specific testing rules: rules/android/testing.md and rules/kmp/testing.md -->
# Testing

Pragmatic, not dogmatic. TDD where it speeds things up, test-after where it doesn't.

## Coverage targets

- Domain layer (use cases, pure logic): **~90%**. This is where tests pay off most.
- Data layer (repositories, mappers, parsers): **~75%**. Parsers especially — edge cases matter.
- View models: **~70%**. Test state transitions, not implementation details.
- UI (composables): **low coverage is fine**. Snapshot tests for critical screens only. Don't chase numbers.

Don't game coverage by testing getters. Coverage is a signal, not a goal.

## Test doubles

- **Fakes over mocks.** A `FakeTransactionRepository` that stores in a `MutableList` is usually clearer than a mocked one.
- **Turbine** for `Flow` assertions. Never `.first()` in tests when you want to check a sequence.

## Parser / SMS / regex tests

These are the highest-leverage tests in apps like TamaamPaisa. Every edge case gets a named test:

```kotlin
@Test fun `HBL debit SMS — standard format`() { ... }
@Test fun `HBL debit SMS — amount with thousand separator`() { ... }
@Test fun `HBL debit SMS — truncated by carrier`() { ... }
@Test fun `JazzCash cashback — treated as credit, not refund`() { ... }
```

Keep real-world SMS samples as test fixtures in `test/resources/sms/`. Never commit real personal data — redact amounts and account tails.

## Flow testing

- `runTest` for coroutine tests.
- Turbine's `.test { }` block for collecting.
- `awaitItem()` for next value, `expectNoEvents()` to assert nothing emitted, `cancelAndIgnoreRemainingEvents()` at the end.
- Never rely on `delay(...)` in tests. Use `advanceTimeBy` on the test dispatcher.

## Naming

```kotlin
@Test fun `<behavior> when <condition>`() { ... }
@Test fun `<subject> <behavior>`() { ... }
```

Backtick-quoted descriptive names. No `testDoSomething` Java-style names.

## What not to test

- Framework code (Android, Compose, Room). It's not your code.
- Trivial property getters.
- Generated code (SQLDelight, serialization).
- Composables that are pure layout with no logic — previews cover them.

## TDD when it fits

Use TDD (write the test first) for:

- Parsers, regex, deduplication logic.
- State machines and reducers.
- Anything with a finite, well-defined input/output spec.

Skip TDD for exploratory UI work, animation tuning, or anything where the shape of the answer isn't clear yet.
