# The Guidebook

Everything you need to know about this kit — how it works, when each piece fires, what to change, and what to leave alone. Written for the only intended user: an Android/KMP developer who drives Claude Code as their main implementation agent.

Read it top-to-bottom once. After that, treat it as a reference.

---

## Table of contents

1. [What this kit is (and isn't)](#1-what-this-kit-is-and-isnt)
2. [The 60-second mental model](#2-the-60-second-mental-model)
3. [Quick start](#3-quick-start)
4. [How the pieces fit together](#4-how-the-pieces-fit-together)
5. [The rules — what fires every turn](#5-the-rules--what-fires-every-turn)
6. [The agents — on-demand specialists](#6-the-agents--on-demand-specialists)
7. [The commands — your shortcuts](#7-the-commands--your-shortcuts)
8. [The skills — workflow recipes](#8-the-skills--workflow-recipes)
9. [The templates — per-project CLAUDE.md](#9-the-templates--per-project-claudemd)
10. [Workflows — a day in the life](#10-workflows--a-day-in-the-life)
11. [Customization — what to change, when](#11-customization--what-to-change-when)
12. [KMP deep dive](#12-kmp-deep-dive)
13. [Extending the kit](#13-extending-the-kit)
14. [Troubleshooting](#14-troubleshooting)
15. [FAQ](#15-faq)

---

## 1. What this kit is (and isn't)

**It is** a set of instructions, specialists, and recipes that live inside Claude Code (and anywhere else that respects `~/.claude/`) to make the agent behave like a senior Android/KMP developer who has worked in your codebase before — specifically, someone who makes the same architectural choices you make.

**It isn't**:

- A project template you clone to start a new repo. It's meta-config that generates or shapes projects.
- A replacement for knowing Android/Kotlin. It assumes the engineer is you — informed, opinionated, reviewing Claude's output critically.
- A substitute for `CLAUDE.md` in each project. It's the *global* layer; project-level `CLAUDE.md` layers on top and wins when they disagree.
- Locked. Every file is meant to be edited. Start from this baseline and diverge as your preferences sharpen.

If you're thinking "this would be nicer as a CLI that asks me questions and writes files" — that's a valid next evolution. The kit is the intermediate step that encodes the decisions a CLI would ask about.

---

## 2. The 60-second mental model

Three layers, from most general to most specific:

```
┌──────────────────────────────────────────────┐
│  ~/.claude/rules/*.md                        │  ← Globals — always on
│  (This kit lives here)                       │
├──────────────────────────────────────────────┤
│  <project>/CLAUDE.md                         │  ← Per-project — overrides globals
│  (Generated from templates/, hand-edited)    │
├──────────────────────────────────────────────┤
│  The current conversation                    │  ← Task — overrides everything
│  (You telling Claude what to do right now)   │
└──────────────────────────────────────────────┘
```

Orthogonal to layers, three kinds of help:

- **Agents** — named specialists you delegate to (`@android-architect`, `@compose-reviewer`, etc.).
- **Commands** — slash-shortcuts that bundle a common task (`/new-feature`, `/gradle-fix`, etc.).
- **Skills** — step-by-step recipes the model picks up when its description matches the task.

Rules run every turn. Agents, commands, and skills run on demand.

---

## 3. Quick start

### Install

```bash
git clone https://github.com/hashirhamxa/claude-android-kit.git
cd claude-android-kit

mkdir -p ~/.claude/rules ~/.claude/agents ~/.claude/commands ~/.claude/skills

cp    rules/*    ~/.claude/rules/
cp    agents/*   ~/.claude/agents/
cp    commands/* ~/.claude/commands/
cp -r skills/*   ~/.claude/skills/
```

Keep the cloned directory somewhere permanent (not Downloads) — you'll come back to edit it.

### Verify

Open Claude Code in any directory and ask:

> What conventions do you apply to my Android/Kotlin work?

Claude should summarize the rules — Manual DI, Compose-only, Flow over LiveData, etc. If it doesn't, the rules didn't load. See [Troubleshooting](#14-troubleshooting).

### First project

From an empty directory:

```
/new-android TamaamPaisa com.tamaampaisa.app
```

Answer the 2–3 questions it asks. When it's done, you have a building Android project with `CLAUDE.md` already filled in for you.

For KMP:

```
/new-kmm Maidan com.hash.maidan
```

Same idea, but with a shared module, iOS Xcode project, and Compose Multiplatform wiring.

### First feature

From inside the generated project:

```
/new-feature booking
```

Produces a full vertical slice — domain model, repository, view model, Route/Screen composable pair, nav wiring, tests.

That's the whole loop. Everything else in this guide is refinement.

---

## 4. How the pieces fit together

When you send a prompt to Claude Code:

1. Claude reads the user's rules (`~/.claude/rules/*`) — the whole kit enters the conversation as context.
2. Claude reads the project's `CLAUDE.md` if it exists.
3. Claude reads your prompt and any files you reference.
4. If your prompt starts with `/`, the matching command definition fires (if present in `~/.claude/commands/`). The command is a prompt-within-a-prompt that tells Claude what workflow to run.
5. If the command or the task implicates a skill, the matching skill's `SKILL.md` loads, giving Claude the detailed recipe.
6. If the task benefits from a specialist, Claude dispatches to an agent — either explicitly (you wrote `@android-architect`) or because a command told it to.
7. Claude produces the response, applying the rules throughout.

**Rule hierarchy** — when two sources of guidance conflict:

```
current conversation  >  project CLAUDE.md  >  ~/.claude/rules/
```

If you say "for this task, use Hilt instead of AppContainer," Claude does that for this task. The rule stays unchanged for next time.

---

## 5. The rules — what fires every turn

The rules are the single most important part of the kit. They're what make every response feel like *your* codebase, not generic Android advice.

Eight files in `~/.claude/rules/`, each scoped to one concern. Here's what each enforces, when it matters, and when to override.

### `01-kotlin-style.md`

**Enforces:** immutability first (`val`, data classes, immutable collections), no `!!` in production, `Result`/sealed `Outcome` at module boundaries, coroutines with structured concurrency, no wildcard imports, idiomatic scope function usage.

**When it matters most:** code review, any time Claude writes new Kotlin, especially in domain models.

**When to override:** if you're working on a library that needs to interop with Java (sometimes `!!` or `@JvmStatic` is the only way). Override at the project level with a short note in `CLAUDE.md` explaining the exception.

### `02-android-architecture.md`

**Enforces:** Manual DI via `AppContainer` (no Hilt/Koin), Clean Architecture + MVVM, feature-first package structure, `StateFlow<UiState>` in view models, single-activity navigation.

**When it matters most:** starting a new project, adding a new feature, any architectural question.

**When to override:** if the project inherits Hilt and migration isn't worth it. Put this at the top of the project's `CLAUDE.md`:

```markdown
## Architecture override
This project uses Hilt (inherited). New DI follows Hilt conventions.
AppContainer is not applicable here.
```

Claude will respect it.

### `03-compose-patterns.md`

**Enforces:** state hoisting, `Route`/`Screen` split (stateless previewable Screen, VM-wiring Route), `collectAsStateWithLifecycle`, `LaunchedEffect` with correct keys, stable types, `key = { it.id }` on lazy lists, no hardcoded colors.

**When it matters most:** any Compose code. This is the single most frequently triggered rule in practice.

**When to override:** rarely. Compose conventions are well-established and this file tracks them closely.

### `04-kmm-layering.md`

**Enforces:** `commonMain`-first mindset, `expect`/`actual` as last resort, platform-specific engines in platform mains, SQLDelight over Room for KMP, interface + factory pattern over large `expect class`.

**When it matters most:** KMP projects only. For pure Android, this rule is mostly inert.

**When to override:** project-level if you want to allow Room in a hybrid setup (e.g. Android app shares domain code with an iOS companion but keeps Room for Android storage).

### `05-testing.md`

**Enforces:** fakes over mocks, ~90% domain coverage / ~75% data / ~70% VM, Turbine for Flow, `runTest` + `advanceTimeBy` (never `delay`), parser/regex tests as fixtures with real-world samples, TDD where the spec is clear.

**When it matters most:** when Claude writes any code that includes logic (not just configuration). Especially parsers — see the TamaamPaisa SMS dedup context.

**When to override:** for spikes or throwaway prototypes. Project-level `CLAUDE.md`:

```markdown
## Testing
This is a spike. Skip test generation unless explicitly requested.
```

### `06-security.md`

**Enforces:** no secrets in source (`local.properties` + `BuildConfig`), Supabase RLS on every table, Firebase rules locked by default, certificate pinning in release, `EncryptedSharedPreferences` for tokens, no PII in logs, manifest hardening.

**When it matters most:** any time Claude wires networking, storage, or auth.

**When to override:** never. Security rules are the one set you don't soften. Override at the task level if a specific dev-time workaround is needed, but don't bake it into `CLAUDE.md`.

### `07-git-workflow.md`

**Enforces:** Conventional Commits, branch naming (`feature/`, `fix/`, etc.), small PRs, no commented-out code, no unowned TODOs.

**When it matters most:** when Claude generates commits or opens PRs.

**When to override:** if your team has a different convention (ticket numbers in branches, no squashing). Override at the project level.

### `08-productivity-anti-duplication.md`

**Enforces:** grep before create, read existing candidates fully, extend the current source of truth instead of forking parallel files, wire new files in the same turn, and verify after multi-file work.

**When it matters most:** any feature or refactor that touches more than one file, especially when Claude is tempted to scaffold a sibling repository/use case/component instead of extending the one that's already there.

**When to override:** rarely. The only reasonable exception is a deliberate architecture split that you've already decided at the project level; document that split explicitly in `CLAUDE.md` before asking Claude to create parallel structures.

### Reading tip

When you want to know "will Claude follow X here?" — open the relevant rule file and skim. Three minutes of reading the file beats thirty minutes of prompt iteration.

---

## 6. The agents — on-demand specialists

Agents are named sub-personalities you delegate to. They get their own system prompt (their `.md` file in `~/.claude/agents/`), a focused scope, and sometimes a more capable model. Invoke them explicitly (`@agent-name`), or let commands dispatch to them.

### `@android-architect` (Opus)

**Scope:** architectural decisions — module layout, state design, library selection, trade-off analysis. Not implementation.

**Invoke when:** starting a feature you haven't thought through, evaluating a new dependency, stuck on a layering question.

**Output shape:** Context → Decision → Why → Trade-offs → Implementation sketch → Watch-outs.

**Won't do:** write the whole feature, review existing code line-by-line (that's `@compose-reviewer`), make product decisions.

**Example prompt:**

> @android-architect Maidan needs an offline queue for match invites when the user is out of signal. What's the shape?

Claude will respond with a decision, not a tutorial.

### `@compose-reviewer` (Sonnet)

**Scope:** Compose code review — state hoisting, recomposition hot paths, side effect discipline, modifier order, previews, accessibility.

**Invoke when:** before pushing UI code, or whenever a Compose screen feels "wrong" and you want a checklist applied.

**Output shape:** File list → Summary verdict → Blocking issues (numbered, with fix) → Non-blocking → Good patterns worth calling out.

**Won't do:** review non-UI code, rewrite the files itself (it suggests fixes; you apply them or ask Claude to).

**Example prompt:**

> @compose-reviewer app/src/main/.../ui/transactions/TransactionListScreen.kt

Or use the slash command `/compose-review <file-or-folder>`.

### `@gradle-resolver` (Sonnet)

**Scope:** Gradle, AGP, Kotlin, KSP, Compose Compiler, R8, manifest merger, dependency resolution. All the ways a build can break.

**Invoke when:** any build failure. Don't try to fix it yourself first — the agent has the version matrix internalized.

**Output shape:** Error category → Root cause → Fix → Why it works → Verify command → Prevent next time.

**Example prompt:**

> @gradle-resolver the build is failing with "Compose Compiler requires Kotlin 1.9.22" but we just bumped to Kotlin 2.0.0

Or paste the whole error log. The agent knows what to look for.

### `@kmp-migration-planner` (Sonnet)

**Scope:** moving code between `commonMain`/`androidMain`/`iosMain`, splitting `expect class` that grew too big, diagnosing "why doesn't this compile for iOS" issues.

**Invoke when:** sharing Android-only code to KMP, splitting a bloated expect/actual pair, or when iOS build breaks in ways Android doesn't.

**Output shape:** Current state → Target state → Dependency audit → Migration steps → Risks.

**Example prompt:**

> @kmp-migration-planner I want to share TransactionRepository from the Android app to Maidan's shared module. It currently uses Room and OkHttp.

### How agents actually get used

Most of the time, you don't call agents by hand. The slash commands call them for you:

- `/new-android` and `/new-kmm` check in with `@android-architect` before scaffolding.
- `/new-feature` asks `@android-architect` for a shape check on non-trivial features.
- `/compose-review` delegates entirely to `@compose-reviewer`.
- `/gradle-fix` delegates to `@gradle-resolver`.

You only invoke agents explicitly when you want their specific framing — usually `@android-architect` for an architecture conversation that didn't fit a command.

---

## 7. The commands — your shortcuts

Commands live in `~/.claude/commands/*.md`. Each one is a mini-prompt that configures Claude for a specific task.

### `/new-android <app-name> [package-name]`

Bootstraps a pure-Android project. Produces a buildable scaffold:

- `libs.versions.toml` with current-stable versions.
- `build.gradle.kts` files for root and app.
- `AppContainer` skeleton with Room + Ktor wired.
- `MainActivity` + one home screen demonstrating the Route/Screen pattern.
- Theme files (Material 3, dynamic color on 12+).
- `CLAUDE.md` filled in from the Android template.
- `.gitignore`, `local.properties.example`, initial commit plan.

**When to use it:** day one of any new Android-only app.

**When not to use it:** existing projects (it scaffolds from scratch, doesn't migrate).

**After running:** verify with `./gradlew assembleDebug`, then `/new-feature <first-feature>`.

### `/new-kmm <app-name> [package-name]`

Same as `/new-android`, but for KMP. Produces:

- `shared/` module with `commonMain`/`androidMain`/`iosMain` source sets.
- `composeApp/` module with Compose Multiplatform configured for Android + iOS.
- `iosApp/` Xcode project with a SwiftUI shell that embeds the Compose `UIViewController`.
- `AppContainer` as `expect class` with two `actual` implementations.
- SQLDelight set up in `commonMain`.
- Ktor with OkHttp (Android) and Darwin (iOS) engines.

**When to use it:** day one of any KMP app.

**Expected quirks:** the first iOS build takes a long time — Kotlin/Native isn't incremental on first run. The scaffold warns about this.

### `/new-feature <n>`

Scaffolds a vertical slice in an existing project. Works in both pure-Android and KMP (it detects which by looking at the modules).

**Asks before scaffolding:**
- One-sentence summary of what the feature does.
- List, detail, or form? (determines starter UI shape)

**Produces:**
- Domain model, repository interface, use case (if warranted).
- Room entity + DAO, or SQLDelight `.sq` file.
- Ktor API + DTO + mapper.
- Default repository implementation with `flowOn`.
- `UiState`, view model, Route composable, Screen composable.
- Nav route serializable, wired into `AppNavHost`.
- Wired into `AppContainer`.
- Tests: view model test with `FakeRepository`, repository test with in-memory DB, mapper tests.

**When to use it:** any new feature bigger than "add a button to an existing screen."

**When not to use it:** small additions, bug fixes, single-file changes. Scaffolding overhead isn't worth it.

### `/compose-review <file-or-folder>`

Delegates to `@compose-reviewer`. Returns the review verbatim.

**When to use it:** before opening a PR with UI changes, or when you're not sure a screen is well-structured.

**After running:** if there are blocking issues, ask Claude to apply the fixes. If there are non-blocking nits, decide which are worth addressing.

### `/gradle-fix [command-or-log]`

Three modes:

- `/gradle-fix` with no args — re-runs the last failing Gradle command from conversation history.
- `/gradle-fix "./gradlew assembleDebug"` — runs the given command.
- `/gradle-fix paste` — waits for you to paste the error log.

Delegates to `@gradle-resolver`, offers to apply the fix, re-runs to verify.

**When to use it:** any build failure. Don't try to diagnose yourself first — the agent has the full version matrix.

**Cap:** it'll loop up to 3 diagnosis attempts. If that doesn't fix it, it stops and summarizes what was tried. Don't let it spin longer — escalate to a Build Scan (`--scan`) at that point.

### `/ui-from-image [figma URL | stitch URL | image path | description]`

Runs the visual-to-Compose workflow for Figma links, Stitch links, and screenshots.

**What it does:**
- Detects whether the target project is Android-only or KMP.
- Loads the `ui-from-image` skill and follows its 8-phase workflow.
- Scans for existing `CLAUDE.md`, theme files, and reusable UI components before generating code.
- Resolves assets explicitly instead of inventing broken drawable or font references.

**When to use it:** when you have a visual reference and want Claude to recreate it in Jetpack Compose or Compose Multiplatform.

**When not to use it:** generic UI implementation with no visual reference, or review-only work on existing Compose code.

### `/audit-kit`

Runs a documentation and inventory audit on the kit itself.

**What it does:**
- Counts actual rule, agent, command, skill, and template files.
- Compares those counts with what's claimed in `README.md` and `GUIDE.md`.
- Flags stale names, missing command/rule references, untracked kit assets, and empty directories.
- Reports suggested edits without modifying anything.

**When to use it:** before publishing, after restructuring the kit, or before cutting a release/PR that changes the kit layout.

### Choosing between agent and command

Rule of thumb:

- **Command** when you want the structured workflow (scaffolding, review).
- **Agent (@mention)** when you want a conversation framed by that specialist.

`/compose-review` returns a review. `@compose-reviewer` lets you have a back-and-forth ("what about this specific pattern?" "would you ever allow X?"). Both useful, different contexts.

---

## 8. The skills — workflow recipes

Skills live in `~/.claude/skills/<n>/SKILL.md`. They're deeper than commands — full step-by-step recipes with decision trees.

Claude activates a skill when its description matches the current task. You don't usually invoke skills directly; they back up commands or surface when you ask something that matches.

Five skills in this kit:

### `new-project-android`

The full recipe for bootstrapping an Android project. What `/new-android` uses internally.

**You'll see it surface when:**
- You ask "how do I set up a new Android project with X"
- You're mid-bootstrap and something goes wrong; Claude re-reads the skill to recover.

### `new-project-kmm`

Same, for KMP. Includes Xcode project setup, iOS framework packaging, Build Phase script for `embedAndSignAppleFrameworkForXcode`.

### `feature-vertical-slice`

The full vertical-slice recipe that `/new-feature` uses. Explicit about when to skip layers:

- Skip the use case if it's a pass-through.
- Skip DTO if your API returns domain shape.
- Skip feature container if ≤ 2 dependencies.

Also has the decision tree for list / detail / form UI shapes.

### `gradle-troubleshooting`

The diagnostic sequence for broken builds. Explicitly *not* a fix-it-yourself flowchart — the skill points to `@gradle-resolver` for the actual diagnosis. But the skill is what gives Claude the structure to ask the right questions before calling the agent.

**You'll see it surface when:** `/gradle-fix` fires, or you describe a build issue.

### `ui-from-image`

The visual fidelity workflow for generating Compose or Compose Multiplatform UI from Figma, Stitch, or screenshot inputs.

**You'll see it surface when:**
- You run `/ui-from-image`.
- You ask Claude to recreate a screen from a design file or screenshot.
- You want generated UI to respect existing theme tokens and project conventions instead of freehanding a new style.

### Can I add a skill just by asking for it?

Yes — Claude can activate a skill based on your prompt matching its description. The description field in the YAML frontmatter is the matcher.

Example: if you want Claude to use the KMP project skill on something other than a brand-new project (say, restructuring an existing one), reference the skill directly:

> Use the new-project-kmm recipe's source set layout to restructure the shared module.

---

## 9. The templates — per-project CLAUDE.md

Two templates in `templates/`:

- `CLAUDE.android.template.md` — for pure Android projects.
- `CLAUDE.kmm.template.md` — for KMP projects.

When `/new-android` or `/new-kmm` runs, it copies the relevant template into the new project as `CLAUDE.md` and fills in the `{{PLACEHOLDER}}` fields.

If you're adding `CLAUDE.md` to an existing project, copy the template manually.

### What lives in a project's CLAUDE.md

- **Project metadata** — name, package, min SDK, platform.
- **Stack table** — a quick reference of what's chosen for each concern.
- **Module map** — folder layout, so Claude doesn't have to re-infer it every session.
- **Conventions** — anything project-specific that extends or overrides the globals.
- **Known pitfalls** — past gotchas that caught you. Future-you will thank past-you.
- **Common tasks** — the `./gradlew` commands you actually run.
- **Open TODOs** — bootstrap items still pending.
- **Do-not list** — anti-patterns specific to this project.

### What doesn't belong in CLAUDE.md

- Feature-level detail (that lives in code, tests, or the PR description).
- Secrets.
- Things already covered by global rules, unless you're overriding them.

### Keep it short

A bloated `CLAUDE.md` dilutes its effectiveness. Aim for 100–200 lines. Anything longer means you're treating it as documentation; it's actually live context for every conversation.

---

## 10. Workflows — a day in the life

Concrete scenarios using the kit. Adapt to your actual projects.

### Scenario A: Starting a new KMP app (Maidan)

```
/new-kmm Maidan com.hash.maidan
```

Claude delegates to `@android-architect` for a shape check. Architect asks: "targets beyond Android + iOS?" You say no. "Compose Multiplatform or native iOS?" You say CMP. "Backend?" Supabase.

Scaffolder runs. When done, you have:

```
Maidan/
├── CLAUDE.md                ← already filled in
├── shared/
├── composeApp/
├── iosApp/
└── gradle/libs.versions.toml
```

You verify:

```bash
./gradlew :composeApp:assembleDebug         # Android builds
./gradlew :shared:linkDebugFrameworkIosSimulatorArm64  # iOS framework builds
open iosApp/iosApp.xcodeproj                # Xcode opens, first run takes minutes
```

Before the first feature, you edit `CLAUDE.md`:

```markdown
## One-line summary
Hyperlocal football community + turf booking for Pakistan.

## Backend
Supabase (RLS mandatory). Firebase Auth for OTP.
Cloudinary for user-uploaded images.

## Known pitfalls
- kotlinx-datetime: no built-in formatting. Use the small formatter in util/DateTimeFormatters.kt.
- Supabase client: RLS policies must allow anon insert on matches table for IN/OUT toggle.
```

Now Claude has the project's DNA. Next prompts get project-aware answers.

### Scenario B: Adding the "IN/OUT match invite" feature to Maidan

```
/new-feature match-invite
```

Two questions:
- What does it do? "Lets a player toggle IN or OUT for a scheduled match, and sends push to the group."
- List, detail, or form? "Detail with an action button."

Claude delegates to `@android-architect` (because this touches push, which is platform-specific) for a shape check. Architect flags: "Push is not shareable. Design a `PushSender` interface in `commonMain` with platform factories."

Scaffolder produces the slice. You review:

- `shared/commonMain/.../domain/` has `MatchInvite.kt`, `MatchInviteRepository.kt`.
- `shared/commonMain/.../data/` has repository impl, Supabase API client, mappers.
- `composeApp/commonMain/.../ui/matchinvite/` has `UiState`, `ViewModel`, `Route`, `Screen`.
- `shared/commonMain/.../notification/` has `PushSender` interface (bonus, added by architect's guidance).
- `shared/androidMain/...` has FCM-backed `AndroidPushSender`.
- `shared/iosMain/...` has APNS-backed `IosPushSender`.

Tests scaffolded with a `FakePushSender` that records sent invites. Tests pass on first run.

### Scenario C: Gradle suddenly broken in TamaamPaisa

You pull changes from your branch. Build fails.

```
/gradle-fix
```

`@gradle-resolver` reads `libs.versions.toml`, the error output, and the build files. Diagnoses: "AGP 8.5.0 requires compileSdk ≥ 34, but the app module has compileSdk 33. Bump to 34."

Offers to apply: yes. Re-runs `./gradlew assembleDebug`. Green.

Agent adds a note suggesting you add a comment in `libs.versions.toml`:

```toml
# CAUTION: AGP ≥ 8.5 requires compileSdk ≥ 34. Bump both together.
agp = "8.5.0"
compileSdk = "34"
```

You approve the edit. Fix committed.

### Scenario D: Before pushing a UI PR

You've finished `TransactionDetailScreen` and want a sanity check.

```
/compose-review app/src/main/.../ui/transactions/detail/
```

`@compose-reviewer` returns:

- **Blocking (1):** `TransactionDetailScreen.kt:47` — `var selected by remember { mutableStateOf(...) }` inside a leaf composable. State should be hoisted to the view model.
- **Non-blocking (3):** nits on modifier order, a missing preview for the error state, a lambda that captures unstable state.
- **Good:** `TransactionRow.kt` composable is cleanly stateless with a good preview set.

You tell Claude: "apply the blocking fix, add the preview, skip the other nits." Claude edits. You re-run review. Green. PR ready.

### Scenario E: Moving Android code to KMP

The Maidan app is KMP. The TamaamPaisa app is Android-only but has a really clean `CurrencyFormatter` you want to reuse.

```
@kmp-migration-planner Move CurrencyFormatter from TamaamPaisa's app module into Maidan's shared module's commonMain.
```

Agent asks for the file. You paste. Agent responds:

- **Current state:** uses `java.text.NumberFormat`, `Locale`, Android `Context` for locale resolution.
- **Target state:** commonMain, no `java.*` dependencies, locale passed in explicitly.
- **Dependency audit:** `NumberFormat` → replace with a small formatter using `kotlinx.datetime` patterns (or hand-roll), `Locale` → KMP has `kotlinx.locale` or pass locale code as `String`.
- **Migration steps:** 1) copy file to commonMain with `Context` removed, 2) add `locale: String` param, 3) implement number formatting without `java.text`, 4) add commonTest with fixtures for English, Urdu-numerals, thousand separators...
- **Risks:** Urdu-Arabic digits (`۰۱۲...`) — easy to miss.

You implement (or ask Claude to). Tests pass on both platforms.

---

## 11. Customization — what to change, when

The kit isn't sacred. It's your baseline. Here's the change-log principle.

### Never change (house invariants)

These are why the kit is the kit. Changing them means you've fundamentally changed how you build:

- **Manual DI.** This is your single strongest opinion. If you decide to adopt Hilt for all future projects, that's a big enough shift that the kit itself should be renamed.
- **Compose-only.** No XML in new code. Already industry-standard for new Android apps.
- **Security rules.** Non-negotiable for apps that touch money, messages, or auth — which is most of yours.

### Override at the project level when

Some projects genuinely need different conventions. Put the override in that project's `CLAUDE.md`, not in the kit:

- Project inherits Hilt / Koin → override `02-android-architecture.md`'s DI rule.
- Project requires Fragments (e.g. MapBox or some legacy SDK) → note it.
- Project has a stricter or looser min-SDK requirement.
- Project uses a different networking stack (Retrofit instead of Ktor, though why).
- Specific testing framework (if the team uses JUnit 5 on a server-side Kotlin module).

### Evolve the kit when

You've changed a preference permanently. Edit the kit:

- You've adopted a new preferred library across all projects (say, you've standardized on `voyager-navigator` for KMP nav). Update `04-kmm-layering.md` to mention it.
- You've hit the same pitfall in 3+ projects. Add it as a "common pitfall" to the relevant rule or skill.
- You've found yourself typing the same clarifying preamble into Claude repeatedly. That's a rule ready to be written.

### Remove or disable when

A rule isn't helping:

- Every time it fires, you tell Claude to ignore it. Soften or delete it.
- The rule overlaps with another and Claude gets confused. Consolidate.
- The rule reflects a preference you've outgrown. Delete it, don't archive it.

### Version the kit itself

If you share the kit with teammates or want to track how your preferences evolve:

```bash
cd ~/.claude
git init    # Track rules/, agents/, commands/, skills/
```

Commit each meaningful change. Your future self will find it useful to see "when did I add the KMP migration agent, and why?"

---

## 12. KMP deep dive

Since KMP is the hard part, and half your active projects are KMP: the kit's opinionated take on it.

### The default mental model

**commonMain first, always.** Every new type starts in commonMain. It only moves to a platform source set when it needs a platform API. This is a discipline, not a preference — it's too easy to scatter code across source sets and end up with a project that's KMP in name only.

**Pure Android code isn't shared code.** Moving a file from `app/src/main/` to `shared/src/androidMain/` gives you *zero* multiplatform benefit. If it needs Android APIs, keep it in the app module where it belongs.

**Shared means commonMain.** If it's not in `commonMain`, it's not sharing anything.

### What goes where

| Code type | Source set |
|---|---|
| Domain models, sealed types, use cases | commonMain |
| Repository interfaces | commonMain |
| Ktor client setup (without engine) | commonMain |
| SQLDelight queries + driver wrapper | commonMain |
| Ktor engine (OkHttp vs Darwin) | Platform mains |
| SQLDelight driver (AndroidSqliteDriver vs NativeSqliteDriver) | Platform mains |
| File system access | Platform mains, behind interface |
| Biometric, auth flows | Platform mains |
| UI that differs per platform | Platform mains |
| Compose Multiplatform UI | commonMain (composeApp module) |
| Analytics, crash reporting | Platform mains (often separate SDKs per platform) |
| Push notifications | Platform mains (FCM + APNS) |

### The expect/actual vs interface+factory question

This is the single most consequential KMP design decision. The rule:

**Use `expect`/`actual`** when:
- The API surface is tiny (≤ 5 members).
- There's one natural implementation per platform.
- You don't need to mock it in tests.

Example — a `ClockImpl`:

```kotlin
// commonMain
expect class Clock() {
    fun nowEpochMillis(): Long
}
```

Great fit. Two-line implementations on each platform.

**Use interface + factory** when:
- You need test fakes.
- The surface is non-trivial.
- Multiple implementations per platform might exist.

Example — a `KeyValueStore`:

```kotlin
// commonMain
interface KeyValueStore {
    fun put(key: String, value: String)
    fun get(key: String): String?
}

expect class KeyValueStoreFactory {
    fun create(name: String): KeyValueStore
}
```

Now in tests you can pass a `FakeKeyValueStore` and never touch `KeyValueStoreFactory`.

**When in doubt, interface + factory.** The overhead is small, and the test story is always better.

### The migration playbook (Android → commonMain)

When you want to share existing Android code:

1. **Audit dependencies.** List every non-multiplatform import. Classify each: has common equivalent, needs platform factory, keep Android-only.
2. **Stub in commonMain.** Copy the file. Comment out the non-common imports and any code that uses them. See what compiles.
3. **Introduce one expect at a time.** Never batch. Each `expect` declaration gets a placeholder `actual` on each platform, even if the iOS one is `TODO()`.
4. **Android actual first** (the code originated there).
5. **iOS actual second.** This is the real work. Run iOS build often: `./gradlew :shared:linkDebugFrameworkIosSimulatorArm64`.
6. **Write commonTest.** Every behavior. Run on both platforms.
7. **Delete the original Android-only file.** Only after commonMain version is verified on both.
8. **Wire into container.** Update `AppContainer` expect and both actuals.

The `@kmp-migration-planner` agent runs this playbook for you.

### Common iOS-specific gotchas the kit warns you about

- **`kotlinx-datetime` doesn't format.** There's no `DateTimeFormatter.ISO_INSTANT.format(instant)` equivalent. Roll a small formatter in common, or use a third-party lib.
- **Swift interop naming.** Kotlin data classes with `copy()` don't map cleanly to Swift. If Swift will call it heavily, provide explicit factory methods.
- **`StateFlow` doesn't Swift-observe natively.** You need a bridge (SKIE, or a hand-rolled `FlowWrapper`). Don't expose raw `StateFlow<T>` to Swift consumers.
- **Xcode framework cache.** After public API changes in the shared module, Xcode sometimes holds the old framework. Re-run `linkDebugFrameworkIosSimulatorArm64` and clean Xcode's build folder.
- **First iOS build is slow.** Kotlin/Native on first run is not incremental. Expect several minutes. Not a bug; it's the price.
- **`Dispatchers.Main` requires setup on iOS.** On Kotlin/Native, `Main` isn't automatically available. Ensure `kotlinx-coroutines-core` is the native variant.

### Compose Multiplatform vs native iOS

The kit defaults to Compose Multiplatform. Switch to native iOS (SwiftUI) when:

- You have a strong Swift engineer on the team.
- A specific screen needs iOS-native feel (App Clips, widgets, complications).
- Performance on iOS matters more than code share.

Hybrid is fine: CMP for 80% of screens, SwiftUI bridged for the rest. The `shared` module doesn't care which UI renders it.

### What not to share

Three things belong on each platform, no matter how tempting it is to unify:

1. **Navigation.** Android's `NavController` and iOS's navigation primitives are fundamentally different. Libraries try to bridge this (Voyager, PreCompose); they're okay, not great.
2. **Platform integrations.** Push tokens, deep links, biometric enrollment, permission requests. All platform-specific.
3. **App lifecycle.** `Activity` lifecycle ≠ `UIViewController` lifecycle ≠ `UIApplicationDelegate`. Each app has its own entry code.

Share the business logic these trigger. Don't share the triggers themselves.

---

## 13. Extending the kit

You'll want to add to this over time. Here's how each piece grows.

### Adding a new rule

Copy an existing rule file as a starting structure:

```bash
cp ~/.claude/rules/01-kotlin-style.md ~/.claude/rules/08-analytics.md
```

Edit the content. The file name's number determines load order; pick something sensible (analytics might be 08, a new security sub-rule might be 06a).

Keep rules focused. One file per concern. A 500-line rule file usually means you need two files.

### Adding a new agent

Each agent is a YAML-frontmatter markdown file in `~/.claude/agents/`:

```markdown
---
name: sql-reviewer
description: Reviews SQL queries for correctness, performance, and schema concerns. Invoke on Supabase RPC definitions, raw SQLDelight queries, and database migrations.
tools: ["Read", "Grep", "Glob"]
model: sonnet
---

You are a SQL specialist. ...
```

The `description` field is what the model matches against to decide when the agent is relevant. Write it like a dispatcher instruction, not a bio.

`tools` limits what the agent can do (Read/Grep/Glob/Bash). For reviewers, omit Bash. For resolvers that need to run commands, include it.

`model` — use `opus` for hard decision-making agents, `sonnet` for execution. Haiku for very simple classifiers only.

### Adding a new command

`~/.claude/commands/<n>.md`:

```markdown
---
description: One-line summary of what this command does.
argument-hint: <arg-spec>
---

# /command-name

What you produce when invoked.

## Usage
Example invocations.

## Steps
Numbered. Specific. What files to read, what to ask, what to write.
```

Commands are just prompts with fancy names. The clearer the steps, the more consistent the output.

### Adding a new skill

```
~/.claude/skills/<n>/SKILL.md
```

YAML frontmatter + body:

```markdown
---
name: firebase-setup
description: Step-by-step workflow for adding Firebase to an existing project. Use when the user wants to wire Firebase Auth, Firestore, Analytics, or Crashlytics.
---

# Firebase Setup — Workflow

...
```

The `description` is critical — that's the dispatcher input. Make it specific.

### Should a thing be a rule, an agent, a command, or a skill?

Decision tree:

- Is it *always-on guidance?* → Rule.
- Is it a *specialist you consult?* → Agent.
- Is it a *one-word shortcut for a task?* → Command.
- Is it a *detailed recipe that needs steps?* → Skill.

Often two fit. For instance, "review my Compose code" is both an agent (`@compose-reviewer`) and a command (`/compose-review`). Having both is fine — they serve slightly different modes (conversational vs. one-shot).

---

## 14. Troubleshooting

### Claude doesn't seem to know the rules

Verify the files are where Claude looks:

```bash
ls ~/.claude/rules/
```

Should list all eight rule files. If not, the copy step didn't work.

Then verify Claude is reading them. Ask:

> What's in ~/.claude/rules/02-android-architecture.md?

If Claude says "I don't have access to that file," your Claude Code setup isn't configured to auto-load `~/.claude/` contents. Check your Claude Code settings.

### A command "doesn't exist"

```bash
ls ~/.claude/commands/
```

Should list the five `.md` files. Commands are resolved by filename (minus the `.md`).

Some Claude Code versions need a restart after adding commands. Try restarting the CLI.

### An agent gives the wrong kind of answer

The agent's system prompt might not match what you needed. Either:

- Use a different agent (`@android-architect` when you meant `@compose-reviewer`).
- Reframe your question.
- Edit the agent file to handle this case better.

Don't fight an agent by arguing in-conversation. If it's consistently off, its prompt is wrong; fix the file.

### A skill doesn't activate when it should

Two causes:

1. The skill's `description` in its frontmatter doesn't match the shape of your prompt. Edit it to mention the keywords you actually use.
2. Claude Code didn't pick up the skill. Verify `ls ~/.claude/skills/<skill-name>/SKILL.md` returns the file.

Force-activate a skill by referencing its name in the prompt:

> Use the feature-vertical-slice skill to add a profile screen.

### Rules conflict with a project's CLAUDE.md

By design, the project's `CLAUDE.md` wins. If Claude is following a global rule instead of your project override, the override is probably ambiguously worded. Be explicit:

```markdown
## DI (overrides ~/.claude/rules/02-android-architecture.md)
This project uses Hilt. Do not apply AppContainer guidance here.
```

The "overrides" parenthetical helps Claude know you intentionally diverged.

### The scaffolder overwrites my files

It shouldn't, but if it does: the command definitions say "do not overwrite existing files without explicit confirmation." If Claude skips that check, file the issue by editing the command file to make the no-overwrite rule more emphatic.

Before running any scaffolder, commit what you have. `git` is the real safety net.

### Claude suggests Hilt or Koin anyway

The Manual DI rule is in `02-android-architecture.md`. Check that file is present. If it is and Claude still suggests Hilt, the context window might be dropping rules (common with very long conversations). Start a fresh conversation and try again.

---

## 15. FAQ

**Why no Hilt or Koin?**

Because compile-time DI without annotation processing is simpler, faster to build, and makes the dependency graph explicit. You can read `AppContainer.kt` and understand the whole app in five minutes. With Hilt, you're chasing `@Inject` annotations and hoping the graph resolves. AppContainer is also trivially testable — constructor injection everywhere, no `@HiltAndroidApp` setup in tests, no `BindValue` boilerplate.

Manual DI has a ceiling. A 300-feature app with dynamic features might legitimately need Hilt's feature-scoped components. You're not there yet. When you are, it'll be a known migration.

**When should I graduate from this kit?**

When you have enough convention-drift across your projects that one starter can't serve them all. That's usually when you work at a company long enough to inherit their conventions, or when you spin up multiple projects with different teams who each want their own slant.

Until then, this kit is a force multiplier. After that, it'll become a constraint.

**Can I share this with my team?**

Yes — it's just markdown. Fork it, rename it, adjust to the team's preferences. Commit it to a shared repo, onboard new engineers by having them symlink or clone into their `~/.claude/`.

One caution: the opinionations here are *yours*. What works when you're the solo architect won't automatically work in a team where four people have five opinions. The kit is best used as a starting point for team discussion, not a declaration.

**Does this work with other AI coding tools (Cursor, Windsurf, etc.)?**

Partially.

- **Rules** — most tools that read markdown context files can use them. Cursor's `.cursorrules` and Windsurf's rules files have similar semantics. You can paste the rules directly or point the tool at them.
- **Agents** — Claude Code-specific. Other tools have their own agent systems; you'd port the system prompts manually.
- **Commands / Skills** — Claude Code-specific. Port the logic to the equivalent in whatever tool you're using.

If you split your time across tools, keep the rule files authoritative and sync them everywhere.

**What about Android Studio's built-in AI features?**

Studio's Gemini assistant doesn't read `~/.claude/`. You'd need to paste relevant rules into its context manually. For architectural work, it's weaker than Claude Code. For in-IDE code completion, it's fine.

**My project is already years old with its own conventions. Is the kit useful?**

Yes, in two ways:

1. Its rules won't override your project's CLAUDE.md, so you're safe to install without affecting existing work.
2. The agents are independently useful — `@gradle-resolver` doesn't care about your DI choice, it just fixes builds. Same for `@compose-reviewer` (works on any Compose codebase).

You might never use `/new-feature` in a legacy project, but `/gradle-fix` will earn its keep.

**How often should I update the kit?**

Edit whenever you notice a drift between the kit's assumptions and your current practice. Formal "version bump" of the kit is unnecessary unless you're sharing it. Version-controlled edits are enough.

**What's missing that I should add first?**

Most likely additions, in order of impact:

1. **Per-project `CLAUDE.md`** for each active project (Maidan, MoviePick, TamaamPaisa). Even a 50-line one beats nothing.
2. **Hooks** for session-start/session-end memory persistence (pattern from the affaan-m everything-claude-code repo). Useful when you switch between projects often.
3. **MCP configs** for GitHub, Supabase, Firebase. If Claude Code can talk to those services directly, a lot of tasks become one-step.
4. **Firebase patterns** and **Supabase patterns** as separate skills, once you've got enough project experience to write them authoritatively.
5. A **security-reviewer** agent specifically for Android/mobile concerns (permissions, exported components, manifest hardening).

Ask for any of them when you're ready.

---

## Appendix A — Quick reference card

Pin this somewhere:

```
/new-android <name>                          Bootstrap Android project
/new-kmm <n>                                 Bootstrap KMP project
/new-feature <n>                             Add vertical slice
/compose-review <file|folder>                Review UI code
/gradle-fix [cmd|log|paste]                  Fix build failure
/ui-from-image [input]                       Generate UI from a visual reference
/audit-kit                                   Audit docs vs kit inventory

@android-architect                   Architecture decisions
@compose-reviewer                    UI code review
@gradle-resolver                     Build fixes
@kmp-migration-planner               commonMain/platform restructuring

~/.claude/rules/                     Global rules
~/.claude/agents/                    Agents
~/.claude/commands/                  Slash commands
~/.claude/skills/                    Workflows
<project>/CLAUDE.md                  Project-specific overrides
```

## Appendix B — Rule override cheatsheet

Paste into any project's `CLAUDE.md` when the default doesn't fit:

```markdown
## DI override
This project uses Hilt (inherited from team standard).
AppContainer guidance does not apply. Follow Hilt conventions.

## Compose override
This project has an inherited XML layout for <specific screens>.
Migrate to Compose opportunistically but not as part of feature work.

## Testing override
Coverage targets relaxed for prototype phase.
Focus on integration tests over unit coverage percentage.

## KMP override
Room is allowed in androidMain for storage-heavy Android-only features.
SQLDelight remains the default for commonMain storage.

## Min SDK override
minSdk = 21 (required for <specific SDK>).
Accept the Compose Preview + some library constraints that come with 21.
```

Start with the template, keep what applies, delete the rest.

## Appendix C — Health check script

A simple way to verify the kit is installed and loaded.

```bash
#!/usr/bin/env bash
# ~/.claude/doctor.sh

set -e

check() {
    if [ -e "$1" ]; then
        echo "✓ $1"
    else
        echo "✗ $1  (missing)"
    fi
}

echo "Rules:"
for f in 01-kotlin-style.md 02-android-architecture.md 03-compose-patterns.md 04-kmm-layering.md 05-testing.md 06-security.md 07-git-workflow.md 08-productivity-anti-duplication.md; do
    check "$HOME/.claude/rules/$f"
done

echo
echo "Agents:"
for f in android-architect.md compose-reviewer.md gradle-resolver.md kmp-migration-planner.md; do
    check "$HOME/.claude/agents/$f"
done

echo
echo "Commands:"
for f in new-android.md new-kmm.md new-feature.md compose-review.md gradle-fix.md ui-from-image.md audit-kit.md; do
    check "$HOME/.claude/commands/$f"
done

echo
echo "Skills:"
for d in new-project-android new-project-kmm feature-vertical-slice gradle-troubleshooting ui-from-image; do
    check "$HOME/.claude/skills/$d/SKILL.md"
done

echo
echo "Done."
```

Run it whenever things feel off:

```bash
bash ~/.claude/doctor.sh
```

---

That's the whole guide. If something in here is unclear or missing, that's a signal to improve the guide — edit this file, commit, move on. It's meant to grow with you.
