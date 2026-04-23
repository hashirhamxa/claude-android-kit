---
description: Delegate Compose UI review to the compose-reviewer agent. Pass a file, folder, or feature name.
argument-hint: <file-or-folder>
---

# /compose-review

Run a Compose code review on the given file(s) or feature folder.

## Usage

```
/compose-review app/src/main/java/com/hash/app/ui/transactions/
/compose-review app/src/main/java/com/hash/app/ui/home/HomeScreen.kt
/compose-review onboarding
```

If the argument is a folder, review every `.kt` file containing `@Composable` in that folder.

If the argument is a feature name (no slashes, no `.kt` extension), resolve it to `ui/<name>/` under the main source set.

## What you do

1. Resolve the argument to one or more concrete files. Verify they exist.
2. Read every file.
3. Delegate the review to the `compose-reviewer` agent with the file contents.
4. Return the agent's review verbatim, prefixed with the resolved file list.

## Guardrails

- Don't modify any files. This is read-only review.
- If zero `@Composable` functions are found in the target, report that and stop.
- If the target includes view model or repository files, include them in the bundle but flag to the reviewer that they're for context only — the reviewer should not review them, only note if their API is misused by the UI.

## After review

If the reviewer returns blocking issues, offer to:
- Auto-fix specific items the user selects.
- Open the file at the line of each blocking issue.
- Re-run review after fixes.
