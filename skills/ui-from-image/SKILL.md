---
name: ui-from-image
description: Convert a Figma design, Stitch design, or UI screenshot into pixel-faithful Jetpack Compose or Compose Multiplatform code that respects the project's existing theme, conventions, and CLAUDE.md / THEME.md instructions. Use this skill whenever the user provides a Figma link, a Stitch link, a UI screenshot, a mockup image, or asks to "build this UI", "recreate this screen", "convert this design to Compose", "make this from a screenshot", or "match this mockup". Auto-detects whether the project is Android-only (Jetpack Compose) or KMM (Compose Multiplatform), discovers existing theme files and convention docs, and emits code that slots into the project's existing patterns without silently overriding anything. Trigger this skill aggressively — any time a visual reference is provided alongside intent to build UI, this is the right tool.
---

# UI From Image — Figma / Stitch / Screenshot → Compose

A skill for turning visual references into production-grade Compose code that matches Hash's architectural conventions (Compose / Compose Multiplatform, Manual DI via AppContainer, Clean Architecture + MVVM, no Hilt/Koin).

The core promise: **the rendered UI should be visually indistinguishable from the source.** Not "inspired by." Not "close enough." A side-by-side comparison should be hard to tell apart at first glance.

---

## When to use this skill

Trigger on any of these:

- User pastes a Figma link, Stitch link, or attaches a UI screenshot
- User says "build this", "recreate this", "match this design", "convert this to Compose"
- User asks for a screen, component, or layout with a visual reference attached
- User references a previously-shown design

Do **not** trigger for:
- Generic "build me a login screen" with no visual reference (just write Compose normally)
- Code review of existing Compose UI
- Logic-only changes to existing screens

---

## The workflow (top-level)

Follow these phases in order. Do not skip phases — each one prevents a class of mistake that's common when going from image to code.

1. **Detect inputs** — figure out what kind of source you're working with
2. **Detect target** — Jetpack Compose or Compose Multiplatform
3. **Extract the design** — get the design data (Figma MCP / vision analysis / Stitch MCP)
4. **Inventory the design system** — colors, typography, spacing, components
5. **Plan the composable tree** — break the screen into a hierarchy before writing code
6. **Resolve assets** — list every icon/image/font needed; ask the user how to handle each
7. **Generate code** — match the project's existing patterns
8. **Self-verify** — checklist against the source image

The references in `references/` are loaded as needed. **Read them when their condition fires, not preemptively.**

---

## Phase 1 — Detect inputs

Look at what the user provided:

| Input type | What to do |
|---|---|
| Figma file/frame URL | Try Figma MCP first (`get_code`, `get_image`, `get_variable_defs`). Read `references/figma-mcp.md`. |
| Stitch project ID or link | Use Stitch MCP. Read `references/stitch-mcp.md`. |
| Image attached (PNG/JPG of UI) | Use vision analysis. Read `references/screenshot-analysis.md`. |
| Multiple screens / a flow | Repeat the per-screen workflow; share a single design-system extraction across all screens. |
| Mixed (Figma + reference screenshot) | Treat Figma as source of truth for structure/tokens; screenshot as visual ground truth for self-verification. |

If the input type is unclear, ask the user **one** question. Don't ask multiple.

---

## Phase 2 — Detect target & discover project conventions

Inspect the project before writing any code. You're answering two questions in this phase: **which platform** and **which conventions to follow**.

### 2a. Platform detection

```bash
# Is this an Android-only project or KMM?
ls -la                                    # Look for: shared/, composeApp/, androidApp/, iosApp/
cat settings.gradle.kts 2>/dev/null       # Look for: include(":shared"), include(":composeApp")
find . -name "build.gradle.kts" -maxdepth 3 | head -5
```

Decision rule:

- `composeApp/` or `shared/` module with `commonMain` source set, **or** `kotlin("multiplatform")` plugin → **Compose Multiplatform**
- Only `app/` module with `com.android.application` → **Jetpack Compose (Android)**

The two are 95% identical from a UI code perspective. The differences are:

- **Resources**: Android uses `R.drawable.foo` / `stringResource(R.string.foo)`. CMP uses `Res.drawable.foo` / `stringResource(Res.string.foo)` from `compose.components.resources`.
- **Fonts**: Android uses `Font(R.font.foo)`. CMP uses `Font(Res.font.foo)`.
- **Painters**: Android uses `painterResource(R.drawable.foo)`. CMP uses `painterResource(Res.drawable.foo)`.
- **Platform-specific bits** (haptics, system UI controllers): wrap in `expect`/`actual` for CMP.

For CMP-specific patterns (resources, expect/actual, navigation), read `references/cmp-specifics.md`.

### 2b. Convention discovery — read what the project tells you

The project may have written conventions that override anything in this skill. **Read them and respect them.** Look in this order:

```bash
# Project root convention files (highest priority)
for f in CLAUDE.md THEME.md DESIGN.md DESIGN_SYSTEM.md UI.md UI_GUIDELINES.md STYLE.md STYLE_GUIDE.md CONTRIBUTING.md AGENTS.md; do
  [ -f "$f" ] && echo "=== $f ===" && cat "$f"
done

# Per-feature or per-module convention files
find . -maxdepth 4 -name "CLAUDE.md" -o -name "THEME.md" -o -name "DESIGN.md" 2>/dev/null

# Anything in a docs/ folder
[ -d docs ] && ls docs/ && find docs -name "*.md" 2>/dev/null | head -10
```

For the rules on how to merge what you find with the skill's defaults — including the strict priority order and when to ask vs when to follow silently — **read `references/project-conventions.md`**.

### 2c. Build a working convention summary

Before moving to Phase 3, write a short summary (for yourself) of what the project mandates:

```
Platform:        Compose Multiplatform (composeApp/ + kotlin("multiplatform"))
Theme location:  composeApp/src/commonMain/kotlin/.../ui/theme/  (existing)
Font:            Inter (specified in CLAUDE.md, bundled in composeResources/font/)
Colors:          Defined in Color.kt — DO NOT modify, only reference
Spacing scale:   Spacing.xs/sm/md/lg/xl/xxl (Dimens.kt)
Structure:       feature/<name>/presentation/ — Screen + ViewModel + State + Event
DI:              Manual via AppContainer (no Hilt/Koin)
Notes from CLAUDE.md: "Use existing components from core/ui/components/ before creating new ones"
```

This summary becomes the constraint set for the rest of the workflow. Every later decision (Phase 4 tokens, Phase 5 component extraction, Phase 7 file placement) must respect it.

---

## Phase 3 — Extract the design

Per the input type detected in Phase 1, follow the matching reference:

- **Figma URL** → `references/figma-mcp.md`
- **Stitch link** → `references/stitch-mcp.md`
- **Screenshot/image** → `references/screenshot-analysis.md`

Whatever the input, the output of this phase is a **structured design spec** in your head (or scratch notes) with:

1. Frame dimensions and assumed device width (usually 360dp or 390dp baseline)
2. Color palette (hex values, with semantic names if inferrable)
3. Typography (font family, sizes, weights, line heights)
4. Spacing scale (the recurring gap values: 4, 8, 12, 16, 24, 32 etc.)
5. Corner radii used
6. Icons and image assets needed
7. Component inventory (buttons, cards, chips, etc.)
8. Layout hierarchy

If you don't have all eight, go back and look again. Do not start coding with gaps.

---

## Phase 4 — Inventory the design system & respect what exists

This phase has one job: **figure out what to reuse and what to add, without ever silently overriding what the project already has.**

### 4a. Scan exhaustively

```bash
# Theme files
find . -path "*/ui/theme/*" -name "*.kt" 2>/dev/null
find . -name "Color.kt" -o -name "Type.kt" -o -name "Theme.kt" -o -name "Dimens.kt" -o -name "Spacing.kt" -o -name "Shape.kt" 2>/dev/null

# Existing components — reuse before recreate
find . -path "*/components/*" -name "*.kt" 2>/dev/null | head -20
find . -path "*/ui/*" -name "*.kt" | xargs grep -l "@Composable" 2>/dev/null | head -10
```

Open every theme file and read it. Don't skim — read the actual color values, font definitions, dimension scales. You need them in your head before deciding what to do.

### 4b. The priority order (strict — do not deviate)

When the design's tokens conflict with what's already in the project, follow this priority **top-down**. The first match wins; you don't fall through:

1. **Explicit instructions from the user in this conversation** — if they said "use the existing theme even though the design doesn't match", do that. Their word is final.
2. **Convention docs** (`CLAUDE.md`, `THEME.md`, `DESIGN.md`, etc. from Phase 2b) — these are the project's written law. If `CLAUDE.md` says "all colors come from `Color.kt`; never hardcode hex", you follow that even if it means the rendered UI doesn't perfectly match the design.
3. **Existing theme files** (`Color.kt`, `Type.kt`, `Dimens.kt`, `Theme.kt`) — if they exist, they are the source of truth for tokens. The design adapts to them, not the other way around.
4. **The skill's defaults** (`templates/theme-skeleton.kt`, `references/design-tokens.md`) — only when nothing higher in the order exists.

### 4c. Decision tree

After scanning, you fall into exactly one of these cases:

**Case A — Existing theme present + matches the design** *(easiest)*
→ Use it as-is. Reference `MaterialTheme.colorScheme.primary`, `MaterialTheme.typography.titleLarge`, `Spacing.md`, etc. in your code. Don't touch theme files.

**Case B — Existing theme present + design needs tokens that don't exist** *(common)*
→ Extend, don't replace. Add new colors/sizes to the existing files following the existing naming convention. Examples:
  - Design needs a "success green" not in the theme → add `val Success = Color(0xFF22C55E)` to `Color.kt` (or to `ExtendedColors` if the project uses that pattern). Re-export through the scheme/extended object as the project does.
  - Design has a font size not in `Type.kt` → if it's a one-off, use the literal `fontSize = 13.sp` inline. If it appears 3+ times, add a new `TextStyle` to `AppTypography`.
  - Design needs a new corner radius → add to `Radius` object.

**Case C — Existing theme present + design's tokens *directly conflict* with theme's** *(stop and ask)*
→ This is the dangerous case. The design says primary is `#FF0000`, the theme says primary is `#0066FF`. Do NOT silently change `Color.kt`. Ask the user:

> The design uses `#FF0000` for the primary brand color, but `Color.kt` defines `Primary = Color(0xFF0066FF)`. Which is correct?
> 1. The theme is right — adapt the UI to use the existing primary
> 2. The design is right — update `Color.kt` (this will affect every screen using `MaterialTheme.colorScheme.primary`)
> 3. This screen needs a different color — add a new named token (e.g. `AltPrimary`) and use it only here

**Case D — No theme exists** *(greenfield)*
→ Create one. Use `templates/theme-skeleton.kt` as the starting point, fill in tokens extracted in Phase 3, follow `references/design-tokens.md`.

### 4d. Hard rules

- **Never silently modify** an existing token value. If `Primary = Color(0xFF0066FF)` in the repo and you think it should be `#FF0000`, ask first.
- **Never duplicate tokens.** If `Spacing.md = 16.dp` exists, don't introduce a `val padding16 = 16.dp` somewhere else. Use what's there.
- **Never bypass the theme** by hardcoding hex/sp/dp values that already have token equivalents. `Color(0xFF0066FF)` is wrong if `MaterialTheme.colorScheme.primary` equals that.
- **Match naming conventions.** If the project uses `colorPrimary` (lowercase camelCase), add `colorSuccess`, not `Success`. If it uses `Primary` (PascalCase top-level), match that.
- **Respect file organization.** If the project keeps colors in `Color.kt` and dimensions in `Dimens.kt`, don't dump dimensions in `Color.kt`. If the project uses a single `Theme.kt` for everything, use that.

For full token strategy, naming, and when to extend vs replace, read `references/design-tokens.md`.

---

## Phase 5 — Plan the composable tree

Before writing a single line of code, write out the composable hierarchy. This is the single most important step for fidelity.

Example (Login screen):

```
LoginScreen
└── Scaffold
    ├── topBar = TopAppBar { title, back button }
    └── content = Column (verticalArrangement = spacedBy(24.dp), padding = 24.dp)
        ├── BrandHeader (logo + tagline)          // Spacer(48.dp) above
        ├── EmailField (OutlinedTextField)
        ├── PasswordField (OutlinedTextField + trailing eye icon)
        ├── ForgotPasswordLink (TextButton, alignEnd)
        ├── Spacer(16.dp)
        ├── PrimaryButton(label = "Log in", fillMaxWidth, height = 56.dp)
        ├── OrDivider (HorizontalDivider with centered "OR" text)
        ├── SocialRow (Row with Google + Apple buttons, spacedBy = 12.dp)
        └── SignupRow (Row at bottom: "New here? Sign up")
```

Rules for the tree:

- Each leaf should map to one Compose primitive or one extracted composable
- Anything that appears more than once → extract as a composable
- Anything with internal state (text field, toggle) → consider whether state lives in the composable or hoists up to a `ScreenState`
- Note exact paddings, gaps, and sizes next to each node

If the screen has more than ~5 distinct sections, split into multiple files: `LoginScreen.kt`, `LoginHeader.kt`, `LoginForm.kt`, `LoginFooter.kt`.

---

## Phase 6 — Resolve assets

You now know exactly which icons, images, and fonts the screen needs. **Stop and resolve them before writing code** — this prevents broken `R.drawable.foo` references and lazy magenta-everywhere output.

### Build the asset manifest

From the composable tree, list every asset by type:

```
Icons:    ic_arrow_back, ic_eye, ic_eye_off, ic_google, ic_apple
Images:   img_brand_logo, img_empty_state
Fonts:    Inter (Regular, Medium, SemiBold, Bold)
```

### Ask the user — one structured question

Present the manifest and offer four routes. The user can mix-and-match per asset or per type:

1. **They'll provide files** — paste paths to copy, or drop into the resource folder and name them
2. **Pull from MCP** — export from Figma/Stitch (requires MCP + assets in source)
3. **Material Icons / system fonts substitution** — fastest, works immediately
4. **Compile-safe placeholders** — visible TODO markers with correct dimensions; swap real assets in later

For routing rules, the Material Icons mapping table, font handling (Google Fonts vs bundled), and the `AssetPlaceholder` composable pattern, **read `references/assets.md`**.

### Hard rules

- **Never invent drawable names** that don't exist. If `Res.drawable.ic_google` isn't in the project and the user hasn't provided it, you must use Route 3 (Material substitution) or Route 4 (placeholder) — never write the reference and hope.
- **Brand logos** (Google, Apple, etc.) are never faked with Material Icons. Always ask for the file or use a placeholder.
- **Verify file existence** before referencing in code. Run `ls` on the expected resource path.
- **Document substitutions** in the final summary so the user knows what's a stand-in.

---

## Phase 7 — Generate code

Match the project's existing structure and conventions. Inspect first:

```bash
# How does this project structure its features?
find . -path "*/presentation/*" -name "*Screen.kt" | head -5
find . -path "*/ui/*" -name "*Screen.kt" | head -5
find . -name "*ViewModel.kt" | head -3
```

Typical layout for Hash's projects (Clean Architecture + MVVM):

```
feature/auth/
├── presentation/
│   ├── LoginScreen.kt           (the @Composable)
│   ├── LoginViewModel.kt        (state holder)
│   ├── LoginState.kt            (data class for UI state)
│   └── LoginEvent.kt            (sealed interface for user intents)
└── components/                  (reusable bits scoped to this feature)
    ├── BrandHeader.kt
    └── SocialRow.kt
```

For shared/global components, place in `core/ui/components/` (Android) or `commonMain/.../core/ui/components/` (CMP).

### Coding rules for fidelity

1. **Use exact values from the design**, not approximations. If the gap is 14dp, write 14.dp — not 16.dp because "it's on the 8pt grid".
2. **Set explicit sizes** when the design has fixed dimensions. Don't rely on intrinsic sizing if the design specifies width/height.
3. **Use `Modifier` chains in the canonical order**: layout (size, padding) → background → border → clickable → semantics. Mis-ordering changes the visual.
4. **Prefer `Spacer` over `padding` when the gap is between siblings.** Use padding when the gap is between content and its container.
5. **Use `Arrangement.spacedBy(n.dp)`** on `Row` and `Column` for uniform gaps. Don't add `Spacer`s between every child.
6. **Use `MaterialTheme` tokens** for everything that's a token (colors, typography). Use literal values only for one-offs that don't repeat.
7. **Wrap text in the right style**: `Text(..., style = MaterialTheme.typography.titleLarge)`. Don't hardcode `fontSize` unless it's an intentional override.
8. **All assets must be resolved per Phase 6.** Never write `R.drawable.foo` or `Res.drawable.foo` without verifying the file exists or that the user accepted a placeholder. Material Icons substitutions and `AssetPlaceholder` calls are both fine — broken references are not.

For complex visual effects (gradients, blurs, custom shapes), read `references/visual-effects.md`.

### Previews

Always include a `@Preview` for every screen and major component. For CMP, use `@Preview` from `org.jetbrains.compose.ui.tooling.preview` in `commonMain`. For Android, use `androidx.compose.ui.tooling.preview.Preview`.

Provide:
- A default preview
- A dark-theme preview (`uiMode = UI_MODE_NIGHT_YES` for Android, themed wrapper for CMP)
- Preview with empty/loading/error states if the screen has them

---

## Phase 8 — Self-verify

Before declaring done, run through this checklist against the source image:

- [ ] **Layout structure** — every section in the source is present in the same order
- [ ] **Colors** — every color in the rendered output matches the source (use the exact hex; eyeballing is the #1 source of drift)
- [ ] **Typography** — font weights and sizes match. Subtle differences (Regular vs Medium) are very visible.
- [ ] **Spacing** — gaps between elements match. This is what makes screens look "off" the most often.
- [ ] **Corner radii** — buttons, cards, inputs all have the right radii
- [ ] **Icons** — correct icons in the correct positions, correct sizes, correct tints
- [ ] **Touch targets** — interactive elements are at least 48dp tall
- [ ] **Edge cases** — long text doesn't break the layout; small screens still render correctly
- [ ] **Theme correctness** — dark mode preview looks reasonable (even if not explicitly in the design)
- [ ] **Conventions respected** — every `CLAUDE.md`/`THEME.md` rule that applied was followed. No silent overrides of existing tokens. No introduced patterns (Hilt, LiveData, etc.) that the project bans.
- [ ] **Existing components reused** — if `PrimaryButton`, `AppTextField`, etc. exist in `core/ui/components/`, they're used instead of recreated.
- [ ] **Assets resolved** — every drawable/font reference points to a real file, a Material Icon, or an explicit `AssetPlaceholder` with TODO. No broken `R.drawable.X` / `Res.drawable.X`.

If anything fails, fix it and re-check. Don't ship with known mismatches.

---

## Output to the user

When done, present:

1. A brief summary of what was built and where files live
2. **An asset summary** (per `references/assets.md`) — what was provided, what was substituted with Material Icons, what's a placeholder. Be explicit about file names and line numbers for placeholders so the user can find them fast.
3. Any other assumptions made (font choice if exact font wasn't named, color guesses, etc.)
4. The TODO list of follow-ups: assets to add, real strings to wire up, ViewModel logic to implement
5. A note if any part of the design couldn't be faithfully reproduced and why

Keep the summary short. The user wants the code, not a essay.

---

## Reference files

Read these on-demand as the workflow phases call for them:

- `references/project-conventions.md` — How to find and respect `CLAUDE.md`, `THEME.md`, existing themes, existing components. **Most important reference for projects with established conventions.**
- `references/figma-mcp.md` — Figma MCP tools, fallback if MCP not connected, extracting tokens from Figma
- `references/stitch-mcp.md` — Stitch MCP usage, project ID handling
- `references/screenshot-analysis.md` — Vision analysis for screenshot-only inputs, color extraction, measurement heuristics
- `references/cmp-specifics.md` — Compose Multiplatform: resources, expect/actual, gotchas vs Android Compose
- `references/design-tokens.md` — Token extraction strategy, theme file structure, when to create vs extend
- `references/assets.md` — Icon / image / font resolution: user-provided files, MCP export, Material Icons substitution, placeholders
- `references/visual-effects.md` — Gradients, shadows, blurs, custom shapes, complex backgrounds

Templates in `templates/`:
- `theme-skeleton.kt` — Starting point for a fresh `Color.kt` + `Type.kt` + `Theme.kt`
- `screen-skeleton.kt` — Starting point for a `Screen + ViewModel + State + Event` quartet
