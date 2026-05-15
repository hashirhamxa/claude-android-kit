# Hooks

Hooks are the runtime layer around Claude Code tool use. They do two things in this kit: catch a few Android-specific mistakes early, and carry a small amount of local session state between runs.

## Manual install

Copy `hooks/hooks.json` to `~/.claude/hooks.json`, then copy `scripts/` to `~/.claude/scripts/` so the `node scripts/hooks/...` commands resolve from the same root.

## Hook inventory

### `cak:session-start`

Trigger: `SessionStart`
Blocking: no
Profiles: `minimal`, `standard`, `strict`

Loads `.claude-android-kit-state/last-session.md` into startup context when it exists. Respects `CAK_SESSION_START_CONTEXT` and `CAK_SESSION_START_MAX_CHARS`.

### `cak:session-end`

Trigger: `Stop`
Blocking: no
Profiles: `minimal`, `standard`, `strict`

Overwrites `.claude-android-kit-state/last-session.md` with a small repo-local summary: timestamp, cwd, project name, optional git branch, optional `CLAUDE.md` project name.

### `cak:release-guard`

Trigger: `PreToolUse` on `Bash`
Blocking: yes
Profiles: `minimal`, `standard`, `strict`

Blocks `:app:installRelease` and `assembleRelease` unless `ALLOW_RELEASE_BUILD=1` is set. This is the only fail-closed hook in v1.

### `cak:kt-lint`

Trigger: `PostToolUse` on `Edit|Write`, then script-side filter for `*.kt`
Blocking: no
Profiles: `standard`, `strict`

Finds the nearest Gradle wrapper and runs `ktlintCheck` after Kotlin edits. If ktlint fails, it warns on stderr and lets the turn continue.

### `cak:manifest-audit`

Trigger: `PostToolUse` on `Edit`, then script-side filter for `AndroidManifest.xml`
Blocking: no
Profiles: `standard`, `strict`

Warns on exported components without `android:permission`, and warns on `android:debuggable="true"` outside a `/debug/` manifest path.

## Environment variables

### `CAK_HOOK_PROFILE`

Default: `standard`
What it does: selects which hook IDs are active without editing `hooks.json`.
Example: `export CAK_HOOK_PROFILE=minimal`

### `CAK_DISABLED_HOOKS`

Default: unset
What it does: disables specific hooks by ID after profile selection.
Example: `export CAK_DISABLED_HOOKS="cak:kt-lint,cak:manifest-audit"`

### `CAK_SESSION_START_MAX_CHARS`

Default: `8000`
What it does: caps how much saved session context is injected at startup.
Example: `export CAK_SESSION_START_MAX_CHARS=4000`

### `CAK_SESSION_START_CONTEXT`

Default: `on`
What it does: turns SessionStart context injection off without disabling the hook entry.
Example: `export CAK_SESSION_START_CONTEXT=off`

### `CAK_SESSION_PERSISTENCE`

Default: `on`
What it does: turns repo-local session summary writing on or off.
Example: `export CAK_SESSION_PERSISTENCE=off`

### `ALLOW_RELEASE_BUILD`

Default: unset
What it does: allows release install/build commands that `cak:release-guard` would otherwise block.
Example: `export ALLOW_RELEASE_BUILD=1`

### `CAK_FEEDBACK_LOGGING`

Default: `on`
What it does: controls whether the `cak:session-end` hook appends a JSON line to `~/.claude/.cak-feedback.jsonl`. Set to `off` to disable passive session logging entirely.
Example: `export CAK_FEEDBACK_LOGGING=off`

## Disabling a specific hook

Use `CAK_DISABLED_HOOKS` with one or more hook IDs:

```bash
export CAK_DISABLED_HOOKS="cak:manifest-audit"
```

That keeps the checked-in hook graph intact and disables only the hook you named.

## Profile shortcuts

`minimal` enables `cak:session-start`, `cak:session-end`, and `cak:release-guard`.

`standard` enables all five hooks.

`strict` is identical to `standard` in v1. It is a documented placeholder for future stricter Android checks, not extra behavior today.
