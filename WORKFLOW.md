# How I Use Claude Code

My actual workflow. From "I had an idea" to "it's shipping." With a real example project (**Kitabi** — a reading tracker) running throughout.

This guide is a companion to the starter kit. The kit tells you *what* is configured. This guide tells you *how* to actually get work done with it.

---

## Table of contents

1. [The big picture](#1-the-big-picture)
2. [Phase 1 — Design on claude.ai](#2-phase-1--design-on-claudeai)
3. [Phase 2 — Lock the decisions](#3-phase-2--lock-the-decisions)
4. [Phase 3 — Bootstrap with Claude Code](#4-phase-3--bootstrap-with-claude-code)
5. [Phase 4 — Build the first feature](#5-phase-4--build-the-first-feature)
6. [Phase 5 — Iterate, review, ship](#6-phase-5--iterate-review-ship)
7. [When to go back to claude.ai](#7-when-to-go-back-to-claudeai)
8. [Prompt templates that actually work](#8-prompt-templates-that-actually-work)
9. [Common pitfalls](#9-common-pitfalls)
10. [Tool selection — which tool when](#10-tool-selection--which-tool-when)

---

## 1. The big picture

Two tools, two modes of thinking:

```
┌───────────────────────────┐        ┌──────────────────────────────┐
│  claude.ai (chat)         │        │  Claude Code (CLI / IDE)     │
│  ───────────────────      │        │  ──────────────────────      │
│  • Explore                │        │  • Execute                   │
│  • Decide                 │        │  • Write files               │
│  • Design documents        │   →    │  • Run commands              │
│  • Generate CLAUDE.md     │        │  • Git-aware                 │
│  • Stress-test ideas      │        │  • Uses the starter kit      │
│  • No file writes          │        │  • Scoped to one repo        │
│                            │        │                               │
│  "Thinking partner."      │        │  "Implementation agent."     │
└───────────────────────────┘        └──────────────────────────────┘
```

**The rule:** claude.ai does the thinking, Claude Code does the doing.

Mixing them up is the #1 source of wasted time. Don't ask claude.ai to write a whole feature — the file output is awkward and there's no repo context. Don't design architecture inside Claude Code — you'll burn tokens scrolling through code when you should be staring at a whiteboard.

Use each for what it's built for.

### The five phases

1. **Design on claude.ai** — one long conversation, produces a decision doc and a `CLAUDE.md`.
2. **Lock the decisions** — commit `CLAUDE.md` and any design docs into the empty repo.
3. **Bootstrap with Claude Code** — run `/new-kmm` (or `/new-android`), the kit produces a building scaffold.
4. **Build features** — `/new-feature`, review with `/compose-review`, iterate.
5. **Hard problem surfaces** — go back to claude.ai for a fresh architecture pass, then return to Claude Code.

The rest of this guide walks through each phase with **Kitabi** as the running example.

---

### What is Kitabi?

A personal reading tracker. Cross-platform (Android + iOS). Features I'll design in the walkthrough:

- Add books you're reading (ISBN scan or manual entry).
- Log reading sessions (pages read, time spent).
- Track progress per book.
- See streak (consecutive days you've read).
- Stats dashboard (books/month, pages/week, avg session length).
- Sync across devices (so your phone and iPad agree).
- Offline-first — logging a session without signal should just work.

That's it. Not a social app. No friends, no sharing, no gamification beyond streaks. Personal use, zero audience pressure. Good scope for a walkthrough — small enough to finish in the guide, big enough to show real decisions.

---

## 2. Phase 1 — Design on claude.ai

Open a new chat at claude.ai. This is where you think out loud.

### Opening prompt

Brain-dump the idea, then ask for decisions. Don't ask "what should I build" — you already know. Ask *how*.

> I want to build **Kitabi** — a personal reading tracker for Android and iOS.
>
> **Core features:**
> - Add books (manual or ISBN scan)
> - Log reading sessions: pages read + minutes
> - Track progress per book (current page / total pages)
> - Streak counter (consecutive days with at least one session)
> - Stats dashboard
> - Offline-first: every action works without network
> - Sync across devices for the same user
>
> **My stack preferences (from `~/.claude/rules/cak/`):**
> - Kotlin Multiplatform, Compose Multiplatform UI
> - Manual DI (no Hilt/Koin), AppContainer expect/actual
> - Ktor, SQLDelight, Napier
> - Supabase for backend (Postgres + Auth + Storage)
> - Clean Architecture + MVVM
>
> Walk me through the architectural decisions that aren't already answered by the stack. Specifically:
>
> 1. How should sync work given offline-first? (Last-write-wins? CRDT? Operational log?)
> 2. What's the data model? What lives in `commonMain`?
> 3. ISBN lookup — which API, how cached, fallback when offline?
> 4. Streak calculation — derived from sessions, or stored separately?
> 5. Auth flow for a single-user app — is email/password enough, or OTP?
>
> Go decision-first. I want trade-offs, not tutorials.

The prompt shape matters:

- **State your stack** so Claude doesn't waste tokens re-proposing one.
- **List decisions you want made**, not vague "what do you think."
- **Demand decision format** — trade-offs, not tutorials.

Claude.ai will come back with opinions. Push back on any you disagree with.

### Back-and-forth

You don't accept the first answer. Stress-test:

> On sync — you suggested last-write-wins per row. What happens when I log a session on my phone offline, then log a different session on my iPad while still offline, and then both come online? Do I lose one?

This forces Claude to confront the edge case. Maybe the answer is "sessions are append-only, so both land" and "book progress is derived from the max page across all sessions." That's a better design than you started with.

Do this for every decision. Each edge case you surface now is a bug you don't ship.

### Producing artifacts

Once the architecture feels settled, ask for concrete deliverables:

> Summarize the locked decisions as a design doc I can check into the repo. Format: Decision → Rationale → Consequences, one section per decision.
>
> Then generate the project's `CLAUDE.md`, using the kmm template from my starter kit. Fill in real values for Kitabi. Replace placeholders with decisions from this conversation.

Claude.ai returns two artifacts:

1. `docs/ARCHITECTURE.md` — the design doc.
2. `CLAUDE.md` — filled from your template.

Copy both into an empty `Kitabi/` directory on disk.

### What the design doc actually contains

A real one for Kitabi, abbreviated:

```markdown
# Kitabi — Architecture

## 1. Sync strategy
**Decision:** Event-sourced sessions + derived state.
- `ReadingSession` is append-only. Every log action creates a new session row.
  Sessions sync one-way: device → server. Never updated, never deleted (soft-deleted only).
- `Book.currentPage` is derived from `max(session.endPage)` across all sessions for that book.
- `Streak` is derived from distinct dates with any session.
**Rationale:** Avoids conflict resolution. Two devices can log independently; merging is just set-union.
**Consequences:**
- Storage grows linearly with sessions. Acceptable — personal app, ≤ 1000 sessions/year.
- No "edit a session" feature in V1 without breaking the append-only invariant. Adding one requires soft-delete + re-insert.

## 2. Data model
(Entities: Book, ReadingSession, User. Relationships. What's in commonMain vs. platform.)

## 3. ISBN lookup
**Decision:** Open Library API (free, no key). Cached aggressively.
- On scan, hit Open Library. Cache the response locally keyed by ISBN for 1 year.
- Offline ISBN scan: add as "Untitled book" with ISBN, resolve metadata on next sync.
**Alternatives considered:** Google Books API (requires key, better metadata), ISBNdb (paid).
**Consequences:**
- Open Library metadata is sometimes incomplete — cover image missing, no synopsis. Acceptable.

## 4. Streak calculation
**Decision:** Computed on read, not stored.
- SQL query: `SELECT DATE(loggedAt) FROM sessions GROUP BY DATE(loggedAt) ORDER BY DATE DESC`.
  Walk the list, count consecutive days.
**Rationale:** Storing a streak counter invites bugs — when does it reset? What about timezone changes?
Derivation makes it correct by construction.
**Consequences:**
- Cached with `derivedStateOf` in the view model so it's not recomputed on every recomposition.

## 5. Auth
**Decision:** Supabase Auth with email/password + magic link.
**Rationale:** Magic link is easier UX than OTP. Supabase has both; magic link is one less screen.
**Consequences:**
- iOS universal links + Android app links need configuration. Do this during bootstrap, not after.
```

Small, sharp document. Every decision has a rationale and a consequence. The consequences section is what future-you reads when you're tempted to change something.

---

## 3. Phase 2 — Lock the decisions

Before touching code:

```bash
mkdir Kitabi
cd Kitabi
git init

mkdir docs
# Paste the architecture doc
pbpaste > docs/ARCHITECTURE.md   # macOS. On Linux: xclip -selection clipboard -o > docs/ARCHITECTURE.md

# Paste CLAUDE.md
pbpaste > CLAUDE.md

git add .
git commit -m "chore: initial architecture and claude.md before scaffold"
```

You now have a repo with *zero code* and all the thinking. Read through `CLAUDE.md` one more time. Does it match what you decided? If something feels off, fix it now — much cheaper than fixing after scaffolding generates code based on it.

This is also the right time to set up local secrets scaffolding:

```bash
cat > local.properties.example <<EOF
sdk.dir=/Users/you/Library/Android/sdk
supabase.url=https://your-project.supabase.co
supabase.anonKey=your-anon-key
openlibrary.userAgent=Kitabi/0.1 (your-email@example.com)
EOF

cp local.properties.example local.properties
# Fill in real values in local.properties — it's gitignored.
```

---

## 4. Phase 3 — Bootstrap with Claude Code

Open Claude Code in the `Kitabi/` directory:

```bash
cd Kitabi
claude
```

Now you're in *implementation mode*. The first prompt is short:

```
/new-kmm Kitabi com.hash.kitabi
```

The command fires. Because `CLAUDE.md` and `docs/ARCHITECTURE.md` already exist, Claude Code reads them first and adapts the scaffold to match. When it asks clarifying questions, they're narrower:

> **Claude Code:** Targets are Android + iOS based on your CLAUDE.md. Compose Multiplatform for UI. Supabase backend with email + magic link auth. Any additional targets (desktop, web)?
>
> **You:** No, just Android and iOS.

> **Claude Code:** SQLDelight schema — I see entities Book, ReadingSession, User in your architecture doc. Should I pre-create the `.sq` schema based on those, or leave commented TODOs?
>
> **You:** Pre-create based on the architecture doc. Use the model exactly as specified there.

Claude Code generates:

- `shared/` with `commonMain`/`androidMain`/`iosMain` source sets.
- `shared/src/commonMain/sqldelight/` with `Book.sq`, `ReadingSession.sq`, `User.sq` based on your architecture.
- `composeApp/` with Android entry + iOS bridge.
- `iosApp/` Xcode project.
- `libs.versions.toml` with current-stable versions.
- Empty but wired `AppContainer` with Supabase client factory, SQLDelight driver, Ktor.
- A basic "Hello Kitabi" screen that proves end-to-end wiring works.

Then it prints the verification commands. Run them:

```bash
./gradlew :composeApp:assembleDebug
# expect: BUILD SUCCESSFUL

./gradlew :shared:linkDebugFrameworkIosSimulatorArm64
# expect: BUILD SUCCESSFUL (takes a few minutes first time)

open iosApp/iosApp.xcodeproj
# Cmd+R in Xcode, app launches on simulator with "Hello Kitabi"
```

If all three work, commit:

```bash
git add .
git commit -m "chore: initial KMP scaffold"
```

If any of them fail, you already know what to do:

```
/gradle-fix
```

Let `@gradle-resolver` handle it.

### What makes this fast

You didn't design the architecture in Claude Code. You designed it in claude.ai, wrote it down, and Claude Code executed on it. The bootstrap took one command and three clarifying questions — not an hour of tool-calling and back-and-forth. That's the efficiency gain of the split.

---

## 5. Phase 4 — Build the first feature

Pick a feature. For Kitabi, start with **"Add a book manually."** It's the smallest piece that proves the whole stack works end-to-end: UI → view model → repository → SQLDelight → back to UI via Flow.

ISBN scanning depends on a camera library; don't wire that first. Do the boring version. Shipping scanner V2 next week is trivial once V1 exists.

### The command

Inside Claude Code:

```
/new-feature add-book
```

Claude asks the two standard questions:

> **Claude Code:** What does "add book" do in one sentence?
>
> **You:** Form screen to add a book with title, author, total pages, and optional ISBN; saves locally and syncs in background.

> **Claude Code:** Is the screen primarily list, detail, or form?
>
> **You:** Form.

Claude Code delegates briefly to `@android-architect` for a shape check. The architect notes: "This is the first write path — ensure the repository writes to local DB first, fires a sync enqueue, returns immediately. UI must not block on network." Good catch; shapes the repository correctly.

Scaffolder produces:

```
shared/src/commonMain/.../domain/
    model/Book.kt                    # data class Book(id, title, author, totalPages, isbn?, addedAt)
    repository/BookRepository.kt     # interface with observeAll, get, add, remove

shared/src/commonMain/.../data/
    repository/DefaultBookRepository.kt     # SQLDelight-backed, enqueues sync via SyncScheduler
    sync/SyncScheduler.kt                    # Common interface
    sync/AddBookSyncTask.kt                  # Represents a pending sync

shared/src/androidMain/.../sync/
    AndroidSyncScheduler.kt                  # WorkManager-backed

shared/src/iosMain/.../sync/
    IosSyncScheduler.kt                      # BGAppRefreshTask-backed

composeApp/src/commonMain/.../ui/addbook/
    AddBookUiState.kt
    AddBookViewModel.kt
    AddBookRoute.kt
    AddBookScreen.kt

shared/src/commonTest/.../
    BookRepositoryTest.kt
    AddBookViewModelTest.kt
```

Tests pass on first run (they use a `FakeBookRepository` and an in-memory SQLDelight DB).

### What you verify

Before committing:

```bash
./gradlew :shared:allTests                              # All tests pass
./gradlew :composeApp:assembleDebug                    # Android builds
./gradlew :shared:linkDebugFrameworkIosSimulatorArm64  # iOS builds
```

Then a UI sanity check — run the Android app, tap "Add Book," fill the form, submit. See the book appear on the home list (which came from the scaffold). Good.

iOS check — open in Xcode, run on simulator. Same flow.

### What you tweak

The scaffold is a starting point, not the final feature. You'll have opinions on:

- The form validation style (error-under-field vs. error-summary).
- Whether the "Save" button is disabled or shows an error on submit.
- What happens when the user hits back mid-form.

These are UI decisions Claude Code made with reasonable defaults. Change them by asking:

> The save button should stay enabled. On submit with invalid input, show an inline error summary at the top of the form. Remove the per-field error text underneath the inputs.

Claude Code edits the screen. You review the diff. Accept or iterate.

### Commit granularly

```bash
git add shared/src/commonMain/kotlin/com/hash/kitabi/domain/
git commit -m "feat(add-book): domain model and repository interface"

git add shared/src/commonMain/kotlin/com/hash/kitabi/data/
git add shared/src/androidMain/ shared/src/iosMain/
git commit -m "feat(add-book): data layer with local-first sync scheduling"

git add composeApp/src/commonMain/kotlin/com/hash/kitabi/ui/addbook/
git commit -m "feat(add-book): form screen with viewmodel"

git add shared/src/commonTest/ 
git commit -m "test(add-book): viewmodel and repository tests"
```

Four small commits tell the story clearly. "Huge PR with everything" is unreadable.

---

## 6. Phase 5 — Iterate, review, ship

### Reviewing before PR

Before you push:

```
/compose-review composeApp/src/commonMain/kotlin/com/hash/kitabi/ui/addbook/
```

`@compose-reviewer` returns a review. Example (real-ish):

> **Blocking (1):**
> - `AddBookScreen.kt:42` — `var title by remember { mutableStateOf("") }` inside the screen. Form state belongs in the view model so rotation/process-death doesn't drop it.
>
> **Non-blocking (2):**
> - nit: `Modifier.fillMaxWidth().padding(16.dp)` — padding before `fillMaxWidth` would give cleaner edges. Intent-preserving either way.
> - nit: the "Save" button icon doesn't have a `contentDescription`. Low-impact since the button has text, but semantically better.
>
> **Good:**
> - Route/Screen split is clean, Screen is fully previewable.
> - Three preview variants for empty/error/filled states.

Apply the blocking fix:

```
Apply the blocking fix: move form state into AddBookViewModel, expose it as part of UiState. Keep the existing event callbacks.
```

Claude Code refactors. Re-run tests. Re-run the review — should come back clean.

### When Claude Code gets stuck

It happens. Usually one of:

- **Infinite tool-calling loop.** The agent keeps reading files without producing output. Interrupt it with Ctrl+C and re-prompt with more specificity.
- **Suggests something that conflicts with your rules.** The rules didn't load for some reason. Check `ls ~/.claude/rules/cak/` and restart Claude Code.
- **Can't figure out a subtle bug.** Usually means the task is too large or too vague. Break it down and ask for one sub-task at a time.

When it gets stuck on something nuanced, move *back* to claude.ai. Paste the context, describe the symptom, let the thinking partner help. Then bring the answer back.

### Shipping

Before releasing:

1. **Run `/gradle-fix`** if there are lingering warnings you've been ignoring.
2. **Full test run:** `./gradlew test`.
3. **Release build:** `./gradlew :composeApp:assembleRelease` — checks R8/ProGuard doesn't strip something needed.
4. **Pre-release checklist** from `~/.claude/rules/cak/common/security.md` — no debug logging, no hardcoded keys, Supabase RLS policies deployed, Firebase/Supabase rules locked.
5. **Tag, push, release.**

---

## 7. When to go back to claude.ai

Claude Code is optimized for execution inside one repo. Sometimes you need a bigger conversation. Go back to claude.ai when:

### You're about to add a new subsystem

For Kitabi, when you add **ISBN scanning**, that's not a feature — it's a subsystem that touches:

- Camera permission (platform-specific).
- ML Kit on Android, Vision on iOS.
- Fallback behavior (manual entry when scan fails).
- Offline-first: scan works offline, metadata resolves later.

Design this in claude.ai. Update `ARCHITECTURE.md` and `CLAUDE.md`. Only then come back to Claude Code for `/new-feature isbn-scan`.

### You're pivoting

Three months into Kitabi, you decide you hate Supabase and want to switch to Firebase. That's a pivot. Don't ask Claude Code to migrate — that's a code transformation, not a design decision. Design the migration in claude.ai:

- What are the data compatibility issues?
- What's the cutover plan? Can we run both during migration?
- What does the user see during the switch?
- Do we migrate historical data or start fresh?

Produce a migration doc. *Then* Claude Code executes the migration step by step, guided by the doc.

### You need a fresh perspective

Sometimes you're too close to the code. A claude.ai conversation starting from "I've been working on X for two weeks and something feels off" — paste the key code — can surface issues Claude Code couldn't see because it was too deep in the weeds.

### Product thinking

Claude Code is an engineer. It won't second-guess a product decision unless asked. For questions like "should we even add this feature?" — that's claude.ai territory. Ask for a product framing, trade-offs, user flows.

### Writing docs

Release notes, READMEs, blog posts. Claude.ai has a cleaner canvas for prose. Claude Code is fine for short inline docs but awkward for anything long-form that isn't code.

---

## 8. Prompt templates that actually work

Copy-paste starting points. Adapt each to the moment.

### Architecture session opener (claude.ai)

```
I'm designing **{{PROJECT_NAME}}** — {{ONE_LINE_SUMMARY}}.

**Core features:**
- {{FEATURE_1}}
- {{FEATURE_2}}
- ...

**Stack (fixed, don't re-propose):**
- {{STACK_SUMMARY_FROM_YOUR_GLOBAL_RULES}}

**Decisions I need:**
1. {{DECISION_1}}
2. {{DECISION_2}}
3. ...

Go decision-first. I want trade-offs, not tutorials.
Defend each choice with at least one concrete consequence.
```

### Stress-test prompt (claude.ai, mid-design)

```
Your answer on {{DECISION}} — walk through this scenario:
{{SPECIFIC_EDGE_CASE_IN_PLAIN_LANGUAGE}}

What happens step by step? Where does the design handle it cleanly, and where does it require a workaround?
```

### Output-locking prompt (claude.ai, end of design)

```
Summarize the locked decisions as ARCHITECTURE.md.
Format per decision:
  ## N. <Decision name>
  **Decision:** <the choice in one sentence>
  **Rationale:** <bullet points>
  **Consequences:** <what this commits us to>
  **Alternatives considered:** <brief>

Then generate CLAUDE.md from my kmm template with all placeholders replaced from this conversation.
```

### Bootstrap prompt (Claude Code)

```
/new-{{android|kmm}} {{AppName}} {{package.name}}
```

That's it. The command + your existing `CLAUDE.md` + `ARCHITECTURE.md` do the work.

### Feature prompt (Claude Code)

```
/new-feature {{feature-name}}
```

Answer the two questions. Let it scaffold.

### Targeted-edit prompt (Claude Code)

```
In {{FILE_PATH}}, change {{SPECIFIC_THING}} to {{NEW_BEHAVIOR}}.
Keep the existing tests passing. If any test needs to change, explain why before editing.
```

The "explain why before editing" clause protects against Claude quietly modifying tests to make them pass.

### Debug-a-bug prompt (Claude Code)

```
Symptom: {{WHAT_YOU_OBSERVED}}
Expected: {{WHAT_SHOULD_HAPPEN}}
Last thing I changed: {{RECENT_EDIT}}

Read {{RELEVANT_FILES}} and propose the root cause before suggesting a fix.
Don't edit anything yet — I want to see the diagnosis first.
```

Claude will diagnose. Then you say "fix it" and it edits. This separation prevents premature patching.

### Review prompt (Claude Code)

```
/compose-review {{feature-folder-or-file}}
```

Or for non-UI review:

```
Review {{FILE_OR_FOLDER}} as if you were doing a PR review. 
Flag blocking issues (correctness, security, wrong layering) separately from style nits.
Don't rewrite anything — just the review.
```

### Back-to-design prompt (claude.ai)

```
I'm working on {{PROJECT}}. I've hit a design problem that Claude Code can't resolve because it's architectural, not code-level.

Here's the context:
{{RELEVANT_FILES_OR_CODE}}

Here's the symptom or question:
{{THE_PROBLEM}}

Before proposing a fix, walk me through the forces at play and at least two possible shapes. I'll pick one, then we'll produce a migration plan.
```

---

## 9. Common pitfalls

Things that have cost me time. Avoid them.

### Over-specifying

Bad:

> Create a Kotlin data class called `Book` with fields id (String), title (String), author (String), totalPages (Int), isbn (String nullable), addedAt (kotlinx.datetime.Instant). Put it at `shared/src/commonMain/kotlin/com/hash/kitabi/domain/model/Book.kt`. Mark it @Serializable.

You're writing the code in the prompt. At that point just write the code. The whole point of Claude Code is that a higher-level prompt works:

> /new-feature books — one-sentence: track a user's personal library of books. Form-based.

Trust the rules and the scaffolder to produce something correct. Edit afterward.

### Under-specifying

Bad:

> Make the add book thing better.

Claude has no idea what "better" means. Be concrete about the behavior you want:

> In the add-book form, move the ISBN field to the end of the form and make it collapsible under "Optional details" — by default hidden. When expanded, add a "Scan" button next to the ISBN text field (no functionality yet, just the button).

Concrete changes with rationale if needed. Claude can do this in one shot.

### Designing in Claude Code

If you're asking Claude Code "what's a good way to handle sync conflicts?" — stop. You're in the wrong tool. Open claude.ai, paste the relevant repo files, have the design conversation there. Bring the decision back.

Claude Code will give you an answer, but it's pulling from limited context. Claude.ai lets you zoom out.

### Letting Claude Code spin

If it's been thinking for three minutes and tool-calling without producing, interrupt. Re-prompt with tighter scope:

> Stop. Focus only on AddBookViewModel.kt. Show me the current state, then propose the one change we discussed.

Better to lose 10 seconds restarting than 3 minutes spinning.

### Not reading the diff

Claude Code edits files. Read every diff before accepting. Especially:

- Test files. If Claude modified a test to make it pass, that's a signal — either the test was wrong or the implementation is wrong. Decide before accepting.
- Imports. Stray imports pile up and bloat the file.
- Comments. Claude sometimes leaves "// TODO: handle the case where..." comments that are really "I didn't implement this" in disguise. Hunt them.

### Forgetting to commit

Claude Code doesn't auto-commit. If you rip through three features without committing, rolling back a bad idea requires `git reset --hard` which loses the other two. Commit after every feature. Branch for risky ones.

### Ignoring the rules

If Claude suggests something that violates a rule — say, "let me add Hilt for this module" — don't just shrug and accept. Either the rule is wrong (update it) or Claude didn't load it (restart). Don't silently allow rule drift; that's how the kit stops being useful.

### Asking claude.ai to write project-specific code

Bad idea:

> claude.ai: Write the full AddBookViewModel.kt for Kitabi.

Claude.ai doesn't have your project context. The view model it writes will use conventions that might not match yours. It will import from packages that don't exist. It won't pass your tests.

Exception: for a new subsystem you haven't scaffolded yet, claude.ai can produce a *skeleton* that you then paste into Claude Code with "adapt this to the project conventions." But the finished code should be written inside Claude Code.

---

## 10. Tool selection — which tool when

A cheat sheet for "which AI tool should I reach for."

| Task | Tool | Why |
|---|---|---|
| Designing a new project's architecture | claude.ai | Long context, no code pressure |
| Stress-testing a design decision | claude.ai | Back-and-forth, exploratory |
| Writing ARCHITECTURE.md, CLAUDE.md, ADRs | claude.ai | Prose output, easy to copy |
| Deciding between libraries | claude.ai | Comparison is a conversation |
| Bootstrapping a new repo | Claude Code | File creation, git-aware |
| Adding a feature to an existing project | Claude Code | Repo context, test runs |
| Fixing a Gradle build | Claude Code | Needs to run commands |
| Reviewing Compose code | Claude Code | Needs file access |
| Debugging a runtime issue | Claude Code first, escalate to claude.ai if architectural |
| Refactoring across many files | Claude Code | Editor actions, not a conversation |
| Writing release notes | claude.ai | Better prose canvas |
| Writing a blog post about the project | claude.ai | Long-form writing |
| Exploring a new area (e.g. "how does KMP sync typically work") | claude.ai | Open-ended learning |
| Editing one specific line of code | Android Studio / your IDE directly | Faster than asking |
| Inline autocomplete while typing | Android Studio's AI or Cursor | What they're built for |

### When tools overlap

Some tasks could go either way:

**"Summarize what this function does."** Either works. Use whichever is already open.

**"Explain a stack trace."** Claude Code if you want it to also fix the bug. Claude.ai if you just want to understand.

**"What's the idiomatic way to do X in Kotlin?"** Claude.ai for a clean explanation. Claude Code if you want the answer applied to your actual code.

### Cursor, Windsurf, and other IDE-embedded agents

If you also use a Cursor-like tool, the split is:

- **Cursor / Windsurf:** fast inline edits, tight-loop code generation inside the editor. Good for "refactor this block" and "rename these across the file."
- **Claude Code:** broader reasoning, multi-file changes, running commands, git operations.
- **claude.ai:** design and documents.

They don't compete. They complement. The kit's `~/.claude/rules/cak/` files can often be pointed at by Cursor too (via `.cursorrules` referencing them), so the same opinions follow you across tools.

### What stays out of every AI tool

A few things are faster by hand:

- Running tests. Just run them.
- Git operations after you know what you want. `git add -p` is faster than asking.
- Renaming a file. IDE refactor. Instant.
- Looking at a diff. `git diff` or your IDE's diff viewer.

AI is for thinking and multi-step execution. Mechanical edits are faster manually.

---

## Closing

The workflow, compressed:

1. **Think on claude.ai** until the decisions are sharp.
2. **Write them down** — `ARCHITECTURE.md`, `CLAUDE.md`.
3. **Execute in Claude Code** — bootstrap, features, reviews.
4. **Escalate back to claude.ai** when the problem is architectural again.
5. **Edit the kit** whenever your preferences shift.

The starter kit, the guide, and this workflow are tools for one engineer shipping real apps fast. They're opinionated because you're opinionated. Keep them that way; revise them as you change.

Now go build something.
