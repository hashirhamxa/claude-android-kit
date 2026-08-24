---
description: Create and apply a lightweight single-file patch (patch.md) for small bug fixes (< 20 LOC)
argument-hint: "[fix-name]"
arguments: [name]
---

Execute lightweight quickfix for: $name

1. Run `python tools/openspec_manager.py quickfix $name`.
2. Inspect the created `openspec/changes/YYYY-MM-DD-quickfix-$name/patch.md`.
3. Document the Root Cause Analysis in `patch.md`.
4. Apply the targeted fix directly to the relevant file.
5. Add or update the regression test.
6. Run `python tools/verify_architecture.py && ./gradlew testDebugUnitTest`.
7. Archive the quickfix using `python tools/openspec_manager.py archive YYYY-MM-DD-quickfix-$name`.
