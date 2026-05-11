# Project Conventions

Most of Hash's projects (and any project using `claude-android-kit`) ship with written conventions in markdown files. The skill must find them, read them, and respect them. This file explains how.

## What to look for

In priority order (highest first):

| File | What it usually contains | How to treat it |
|---|---|---|
| `CLAUDE.md` (root) | Project-wide instructions for AI agents — DI rules, file structure, what to avoid, what to prefer | **Authoritative.** Treat as direct instructions. |
| `CLAUDE.md` (per-module / per-feature) | Scoped rules for that module (e.g. `feature/auth/CLAUDE.md`) | **Authoritative for that scope.** Overrides root for files inside that scope. |
| `THEME.md` / `DESIGN.md` / `DESIGN_SYSTEM.md` | Tokens, colors, typography rules, component inventory | **Authoritative for theming.** |
| `STYLE.md` / `STYLE_GUIDE.md` | Code style, naming, formatting | Follow it. |
| `UI.md` / `UI_GUIDELINES.md` | UI patterns, do's and don'ts | Follow it. |
| `CONTRIBUTING.md` | Often has structural conventions | Read the relevant sections (file org, naming). |
| `AGENTS.md` | Some projects use this instead of `CLAUDE.md` | **Authoritative** (same as `CLAUDE.md`). |
| `docs/*.md` | Architecture docs, ADRs | Read if relevant to UI work. |

## Scan command

Run this in Phase 2b:

```bash
# Root-level convention files
for f in CLAUDE.md AGENTS.md THEME.md DESIGN.md DESIGN_SYSTEM.md UI.md UI_GUIDELINES.md STYLE.md STYLE_GUIDE.md CONTRIBUTING.md; do
  if [ -f "$f" ]; then
    echo "=== $f ==="
    cat "$f"
    echo ""
  fi
done

# Per-module/feature convention files
find . -maxdepth 5 -name "CLAUDE.md" -not -path "./CLAUDE.md" 2>/dev/null
find . -maxdepth 5 -name "AGENTS.md" -not -path "./AGENTS.md" 2>/dev/null

# Docs folder
[ -d docs ] && find docs -name "*.md" -maxdepth 2 2>/dev/null
```

Read every match. Don't skim. The whole point of this phase is to absorb the constraints.

## What to extract from convention files

As you read, build a mental (or scratch) checklist of constraints. Common categories:

### Theming constraints
- "All colors come from `Color.kt` — never hardcode hex" → **never** inline `Color(0xFF...)` in screen code
- "Use `MaterialTheme.colorScheme.X`, not direct color references" → wire everything through M3
- "Spacing must use `Spacing.X` tokens — no literal `.dp` for margins" → use the token even for one-offs
- "Brand font is Inter — bundled in `composeResources/font/`" → use it, don't substitute
- "Dark mode is mandatory for every screen" → produce both color schemes + a dark preview

### Structural constraints
- "Screens live in `feature/<name>/presentation/`" → respect the path
- "Every screen has a Screen + ViewModel + State + Event quartet" → produce all four
- "Reusable components go in `core/ui/components/`" → put shared bits there, not duplicated per feature
- "One composable per file" → don't pile multiple top-level composables into one Kotlin file (private helpers inside a file are fine)

### DI constraints
- "Manual DI via `AppContainer` — no Hilt, no Koin" → never `@Inject`, never `viewModel { ... }` Koin syntax
- "ViewModels are wired in `AppContainer` and passed to `Route` composables" → follow that wiring pattern

### Naming constraints
- "Composables: PascalCase, screens end in `Screen`" → `LoginScreen`, not `loginScreen` or `LoginView`
- "State classes end in `State`, events in `Event`" → `LoginState`, `LoginEvent`
- "Drawables: `ic_` prefix for icons, `img_` for images, `bg_` for backgrounds, snake_case" → enforce when copying assets

### Reuse constraints
- "Check `core/ui/components/` before creating new components" → list existing components first; reuse if a match exists
- "Use existing `PrimaryButton`, `SecondaryButton`, `AppTextField` — don't recreate" → respect the project's button/input library

### Anti-patterns called out
- "No `LiveData` — Flow only" → don't introduce LiveData
- "No `remember { mutableStateOf() }` for screen state — use ViewModel" → respect the state-hoisting pattern
- "No direct navigation calls inside composables — emit events" → events bubble up

## How to apply what you find

### When conventions and the design conflict

This is the critical case. Examples and what to do:

**Example 1.** `CLAUDE.md` says "All colors come from `Color.kt`." The design has a one-off accent color not in `Color.kt`.

→ Add the new color to `Color.kt` (or `ExtendedColors`) following the existing pattern. Don't inline the hex.

**Example 2.** `THEME.md` says "Primary brand color is `#0066FF`." The design's primary clearly reads as `#FF0000`.

→ Stop. Ask the user. Don't change `Color.kt`. Don't override the theme silently. The user's call decides.

**Example 3.** `CLAUDE.md` says "Use `PrimaryButton` from `core/ui/components/`." The design shows a button with different styling than `PrimaryButton`.

→ Look at `PrimaryButton`. If it has parameters for the variation (e.g. `style = ButtonStyle.Outlined`), use that. If it doesn't, ask:

> The design's button differs from `PrimaryButton` in `core/ui/components/`. Should I:
> 1. Add a variant parameter to `PrimaryButton` to support this style
> 2. Create a new button component (e.g. `GhostButton`) in `core/ui/components/`
> 3. Override the styling inline just for this screen (not recommended per CLAUDE.md)

**Example 4.** `STYLE.md` says "No more than 3 levels of `Column`/`Row` nesting." The design is deeply nested.

→ Refactor with extracted composables. Each composable can have its own nesting depth; the rule applies per file/function.

### When conventions are silent

The skill defaults from `references/design-tokens.md` and `templates/` apply. But check the project's existing code for *implicit* conventions before falling back:

- Look at one or two existing screens. How are they structured? What patterns do they use?
- Look at the existing theme. Does it use `MaterialTheme` directly or a custom wrapper?
- Look at one existing component. Does it take a `Modifier`? Pass it where? Does it use slots?

Implicit conventions matter as much as written ones. If every existing screen uses `Scaffold`, don't be the one that doesn't.

### When you can't tell what the convention is

Ask. One short question is fine. Examples:

> I see you have `core/ui/components/PrimaryButton.kt` and `feature/auth/components/AuthButton.kt`. Which should I use for the login button on this screen?

> The convention docs don't mention error states. Should error UI use the existing `AppErrorBanner` component, or a Snackbar from the Scaffold?

Don't ask 5 questions. One precise question is welcome; a barrage isn't.

## Special handling for `claude-android-kit` projects

If the project uses `claude-android-kit`, expect to find:

- A root `CLAUDE.md` with the kit's conventions baked in (Manual DI via `AppContainer`, Compose-only, Clean Architecture + MVVM with vertical feature slices, Flow over LiveData, Room/SQLDelight depending on platform, Ktor, Conventional Commits)
- `GUIDE.md` and `WORKFLOW.md` at the kit level — these describe how to *use* the kit, not the project's own conventions; they're context, not constraints
- Per-feature `CLAUDE.md` files added as the project grows
- A `.claude/rules/` directory with finer-grained rules (read these too)

The kit's defaults already align with this skill's defaults. So in a kit-based project, the convention scan usually confirms what you'd do anyway. The exception is theming — projects that use the kit still write their own `Color.kt` / `Type.kt`, and that file is the source of truth.

## When the user has spoken in the conversation

User instructions in the current conversation are the **highest priority** — above written convention docs. Examples:

- User says: "Skip the theme — just use my existing one as-is and don't add to it." → don't extend, even if the design needs colors you don't have. Substitute with the closest existing token and flag what was lost.
- User says: "This is a new app — feel free to set up the theme from scratch." → ignore inherited theme assumptions, use the skeleton template.
- User says: "I know `CLAUDE.md` says no inline hex, but for this prototype I just want speed." → follow the user, but call it out: "Inlining hex per your request; flagging because CLAUDE.md says otherwise — easy to lift into tokens later."

## A quick sanity check before Phase 5

Before moving past Phase 4, ask yourself:

- Did I find a `CLAUDE.md` / convention doc? (If yes, did I actually read it?)
- Did I find an existing theme? (If yes, do I know its tokens by heart enough to reference them?)
- Did I find existing components I could reuse? (If yes, did I list them?)
- Do I have a clear answer to: "If the design and the project disagree, who wins?"

If any answer is no or fuzzy, fix it before generating code.
