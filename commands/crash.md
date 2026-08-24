---
description: Pull latest Android fatal crashes and stacktraces from connected ADB device to triage and debug
---

Capture and analyze Android crash log:

!`bash tools/logcat_dump.sh`

Analyze the output:
1. Identify the fatal exception type (e.g., `NullPointerException`, `IllegalStateException`, `NoSuchMethodError`, `RecompositionError`).
2. Pinpoint the file path, line number, and method from the stacktrace.
3. Propose and apply the exact fix to prevent the crash.
