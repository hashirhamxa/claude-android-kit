---
description: Execute non-negotiable verification gates against an active OpenSpec change proposal
---

Run full verification for the active change:

1. **Architecture Lint Gate:**
   !`python tools/verify_architecture.py`

2. **Konsist & Unit Tests Gate:**
   !`./gradlew testDebugUnitTest`

3. **Multiplatform Target Gate:**
   !`./gradlew compileDebugKotlin compileKotlinMetadata`

If any gate fails:
- Read compiler and test error outputs.
- Self-correct source files against `openspec/changes/.../design.md`.
- Re-run verification until all gates exit with code 0.
