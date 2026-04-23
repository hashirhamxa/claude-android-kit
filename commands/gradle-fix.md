---
description: Delegate a Gradle build failure to the gradle-resolver agent. Captures the failing command's output and produces a diagnosis + fix.
argument-hint: [command-or-log]
---

# /gradle-fix

Diagnose and fix a Gradle build failure.

## Usage

Three modes:

```
/gradle-fix                                   # Re-runs the last failing command (if in build history) and diagnoses
/gradle-fix "./gradlew assembleDebug"          # Runs the specified command and diagnoses on failure
/gradle-fix paste                              # User pastes the error log; you diagnose without running
```

Default mode (no args) tries to find the most recent `./gradlew` output in the session context. If none, ask the user to paste the error or provide a command.

## What you do

1. **Get the failing output.**
   - If a command was given, run it (with `--stacktrace` appended if not present) and capture stderr + stdout.
   - If paste mode, ask the user to paste the full log.
   - If re-running, use the most recent failing command from context.

2. **Read relevant build files:**
   - `build.gradle.kts` (root)
   - `app/build.gradle.kts` or `composeApp/build.gradle.kts`
   - `shared/build.gradle.kts` (if KMP)
   - `gradle/libs.versions.toml`
   - `gradle.properties`
   - `gradle/wrapper/gradle-wrapper.properties`

3. **Delegate to the `gradle-resolver` agent** with the error output and the build files.

4. **Present the diagnosis verbatim** to the user.

5. **Offer to apply the fix** directly if it's a single file edit or version bump. Ask for confirmation before editing version catalog files — version changes have blast radius.

6. **After the fix, re-run the original command** to verify. If it still fails, loop: capture the new error and re-diagnose. Cap at 3 iterations; if still failing, escalate to the user with a summary of what was tried.

## Guardrails

- Never edit `libs.versions.toml` without showing the user the diff first.
- Never bump major versions (AGP 7 → 8, Kotlin 1.9 → 2.0) without flagging it as a migration, not a fix.
- Never delete the `.gradle/` cache without the user's OK — it's slow to rebuild.
- If the error is clearly a KMP-specific iOS build issue, mention that the `kmp-migration-planner` agent might be more appropriate for deeper restructuring and ask before proceeding.

## Escalation path

If after 3 iterations the build still fails:
- Summarize each attempt and what it produced.
- Suggest `./gradlew <task> --scan` for a Build Scan.
- Recommend one of: Android Studio cache invalidation, Gradle daemon restart (`./gradlew --stop`), or a full clean (`rm -rf build/ .gradle/ && ./gradlew clean`).
- Do not keep trying random things.
