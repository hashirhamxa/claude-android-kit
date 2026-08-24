---
description: Run cross-platform verification checks across Android, KMP, and iOS simulator targets
---

Execute verification build commands:

!`./gradlew compileDebugKotlin compileKotlinIosSimulatorArm64 testDebugUnitTest`

Summarize the build output:
- Confirm if both Android and iOS targets compiled successfully.
- If errors occurred, inspect the error output and propose immediate fixes.
