# Git Workflow

## Branches

- `main` — always deployable / releasable.
- `develop` — integration branch if the project uses one; skip if main-only flow.
- Feature branches: `feature/<short-description>`.
- Fixes: `fix/<short-description>`.
- Chores: `chore/<short-description>`.
- Experiments: `spike/<short-description>` — never merged as-is.

Short, hyphenated, lowercase. No ticket numbers in the branch name unless the team convention requires it.

## Commit messages

Conventional Commits, trimmed to what's useful:

```
<type>(<scope>): <subject>

<body — optional, wrap at 72>

<footer — optional, e.g. "Fixes #123">
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `style`, `build`.

Scope: the feature or module, e.g. `transactions`, `sms-parser`, `onboarding`, `ci`.

Subject: imperative, lowercase, no period. "add X" not "Added X."

```
feat(sms-parser): detect HBL credit reversals as REFUND

Adds regex variant for "Credit reversal" messages, maps to
TransactionType.REFUND. Covers the case where a merchant refund
arrives as a separate SMS rather than a modification to the
original debit.

Refs: TAMAAM-142
```

## Commits stay small

- One logical change per commit.
- If the diff needs "and" to describe, it's two commits.
- Refactors land separately from features. Don't bury a refactor inside a feature commit.

## PRs

- Title matches the commit style.
- Description answers: **what**, **why**, **how to test**.
- Screenshots or screen recordings for UI changes. Before/after for refactors with UI implications.
- Linked to an issue or ticket.
- Self-review before asking for review — read the whole diff yourself first.

## Review

- Author runs CI locally before pushing when possible.
- Reviewer blocks on correctness, security, architecture. Style is for the linter.
- Reviewer leaves "nit:" prefix on non-blocking comments so the author knows they can merge without addressing.

## Rebasing & squashing

- Rebase feature branches on `main`/`develop` before merging, not merge commits.
- Squash on merge if commits are messy. Keep commits separate if each one is meaningful.
- Never rebase `main` or shared branches.
- `git rebase -i` on your own branches freely. Clean history is worth the effort.

## Tags and releases

- Semantic versioning for app releases: `v1.4.0`, `v1.4.1-hotfix`.
- Annotated tags (`git tag -a`), not lightweight.
- Release notes generated from commits since the last tag — the Conventional Commits format makes this trivial.

## .gitignore hygiene

Start every project with a solid `.gitignore`:

```
# Android
*.iml
.gradle/
local.properties
.idea/
.DS_Store
captures/
build/
*.apk
*.aab
*.keystore
release/

# Kotlin / KMP
kotlin-js-store/
.konan/

# iOS (for KMP)
xcuserdata/
Pods/
*.xcworkspace/xcuserdata/

# Tooling
.kotlin/
.cxx/

# Secrets
local.properties
google-services.json    # only if the project policy excludes it
GoogleService-Info.plist
.env
.env.local
```

Review `git status --ignored` occasionally to see what's excluded. It shouldn't surprise you.

## Pre-commit hooks

Minimum three hooks:

1. **ktlint / detekt** on staged Kotlin files.
2. **Secret scan** — `gitleaks` or a regex grep for common key patterns.
3. **Run unit tests** for the module being edited (optional if slow).

Set up via `pre-commit` framework or a shell script in `.githooks/`.

## What not to commit

- Generated code (unless the project deliberately checks it in).
- `build/`, `.idea/` (except shared `.idea/runConfigurations/`), `xcuserdata/`.
- Local API keys, personal test accounts.
- Commented-out code. Delete it; `git log` remembers.
- `TODO` without an owner or a ticket. Either fix it or track it.
