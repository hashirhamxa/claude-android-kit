# claude-android-kit

A Claude Code starter kit for Android & Kotlin Multiplatform. Drop it into `~/.claude/` and every new project inherits opinionated defaults — **Manual DI, Compose, Clean Architecture + MVVM, Ktor, Room/SQLDelight, Firebase, Supabase.**

Ships as:

- **8 rules** that fire every turn (Kotlin style, Android architecture, Compose patterns, KMP layering, testing, security, git workflow, productivity & anti-duplication).
- **4 agents** — `@android-architect`, `@compose-reviewer`, `@gradle-resolver`, `@kmp-migration-planner`.
- **7 slash commands** — `/new-android`, `/new-kmm`, `/new-feature`, `/compose-review`, `/gradle-fix`, `/ui-from-image`, `/audit-kit`.
- **5 skills** — full workflow recipes for bootstrapping Android/KMP projects, scaffolding vertical-slice features, diagnosing Gradle failures, and generating UI from images.
- **2 templates** — per-project `CLAUDE.md` for pure Android and KMP.

---

## Install

```bash
git clone https://github.com/hashirhamxa/claude-android-kit.git
cd claude-android-kit

mkdir -p ~/.claude/rules ~/.claude/agents ~/.claude/commands ~/.claude/skills

cp    rules/*    ~/.claude/rules/
cp    agents/*   ~/.claude/agents/
cp    commands/* ~/.claude/commands/
cp -r skills/*   ~/.claude/skills/
```

The `templates/` stay with you — copy the right one into each new project as `CLAUDE.md` and fill in placeholders.

---

## Verify

Open Claude Code in any directory and ask:

> What conventions do you apply to my Android/Kotlin work?

You should see Manual DI, Compose-only, Flow over LiveData, Clean Arch + MVVM, etc. If not, see the troubleshooting section in [`GUIDE.md`](./GUIDE.md#14-troubleshooting).

---

## First project

```
/new-android MyApp com.example.myapp
```

Or for KMP:

```
/new-kmm MyApp com.example.myapp
```

Add a feature:

```
/new-feature booking
```

---

## Folder layout

```
claude-android-kit/
├── rules/          # Global rules (~/.claude/rules/)
├── agents/         # Specialized subagents (~/.claude/agents/)
├── commands/       # Slash commands (~/.claude/commands/)
├── skills/         # Workflow definitions (~/.claude/skills/)
│   └── ui-from-image/   # Figma / Stitch / screenshot → Compose
├── templates/      # Project-level CLAUDE.md templates
├── README.md       # You are here
├── GUIDE.md        # Reference manual — what each file does, when to override, KMP deep dive
└── WORKFLOW.md     # Process manual — how to actually get work done, with a worked example
```

**Read `GUIDE.md` to understand the kit. Read `WORKFLOW.md` to see how it fits into a real workday.**

---

## Philosophy

- **Manual DI** — no Hilt, no Koin. AppContainer + constructor injection. Compile-time safety, explicit graph, trivial to mock in tests.
- **Compose everywhere** — no XML in new code.
- **Flow over LiveData** — `StateFlow`/`SharedFlow` in view models, cold `Flow` in repositories.
- **Offline-first** — local DB is source of truth, network is a sync layer.
- **Vertical slices** — feature = data + domain + ui + di in one pass, not horizontal layers.
- **Boring infra** — Ktor, Room, WorkManager, Firebase, Supabase. Save creativity for the product.

Project-level `CLAUDE.md` beats this kit when they disagree. Override at the project, don't fight the kit globally.

---

## Layering

```
~/.claude/rules/          ← global, always on (this kit)
<project>/CLAUDE.md       ← per-project, overrides globals
current conversation      ← overrides everything for one task
```

---

## Customize

These defaults reflect how I build. Yours may differ — fork it, rename it, edit what doesn't fit.

If you want to version your own evolution:

```bash
cd ~/.claude
git init   # tracks rules/, agents/, commands/, skills/
```

---

## Use as a template

If you want your own fork to start from, click **"Use this template"** at the top of the repo page (or `gh repo create <your-kit> --template hashirhamxa/claude-android-kit`).

---

## License

[MIT](./LICENSE) — use, modify, and share with attribution.

---

## Author

[Hashir Hamza](https://github.com/hashirhamxa) · Senior Android / KMP developer · [LinkedIn](https://linkedin.com/in/hashir-hamza-3130aa178/)
