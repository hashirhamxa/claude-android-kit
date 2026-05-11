# ui-from-image

A Claude Code skill + slash command for converting **Figma designs, Stitch designs, and UI screenshots** into pixel-faithful **Jetpack Compose** or **Compose Multiplatform** code.

Built for the `claude-android-kit` ecosystem. Auto-detects target platform from the project layout and follows Manual DI + Clean Architecture + MVVM conventions out of the box.

## What's in this folder

```
.claude/
├── commands/
│   └── ui-from-image.md              ← /ui-from-image slash command
└── skills/
    └── ui-from-image/
        ├── SKILL.md                  ← main entry, 8-phase workflow
        ├── references/               ← loaded on-demand
        │   ├── project-conventions.md   ← respecting CLAUDE.md, themes, components
        │   ├── figma-mcp.md
        │   ├── stitch-mcp.md
        │   ├── screenshot-analysis.md
        │   ├── cmp-specifics.md
        │   ├── design-tokens.md
        │   ├── assets.md
        │   └── visual-effects.md
        └── templates/                ← drop-in starting points
            ├── theme-skeleton.kt
            └── screen-skeleton.kt
```

## Install

Copy the `.claude/` folder into your Android or KMM project root. That's it — Claude Code picks up the skill and command automatically.

If you already have a `.claude/` folder, merge the `commands/` and `skills/` subdirectories.

## Use

### Via slash command

```
/ui-from-image
```

Then attach a screenshot, paste a Figma URL, or reference a Stitch project. Combine if you want — e.g. a Figma frame URL plus a reference screenshot for ground-truth verification.

### Via natural language

The skill description is tuned to trigger on any of these patterns even without the slash command:

- "Build this UI" + image attached
- "Convert this Figma to Compose"
- "Recreate this screen"
- "Make this from a screenshot"
- "Match this mockup"

## Workflow (what it actually does)

Eight phases, in order:

1. **Detect inputs** — figure out the source type (Figma / Stitch / screenshot)
2. **Detect target** — Jetpack Compose vs CMP, based on `composeApp/`, `shared/`, etc.
3. **Extract the design** — call MCP tools or do vision analysis
4. **Inventory the design system** — check for existing theme; decide extend vs create
5. **Plan the composable tree** — write the hierarchy before any code
6. **Resolve assets** — list every icon/image/font; ask user how to handle (provided files, MCP export, Material Icons substitution, or compile-safe placeholders)
7. **Generate code** — match the project's feature/folder layout and conventions
8. **Self-verify** — run the fidelity checklist against the source

## Conventions enforced

**The skill respects your project's existing conventions first.** It scans for `CLAUDE.md`, `THEME.md`, `DESIGN.md`, existing theme files (`Color.kt`, `Type.kt`, `Dimens.kt`, `Theme.kt`), and existing components in `core/ui/components/` before deciding what to do. It will *never silently override* an existing token — if the design's colors conflict with your theme, it asks before changing `Color.kt`.

When no project conventions exist, it falls back to these defaults:

- Manual DI via `AppContainer` (no Hilt, no Koin)
- Clean Architecture + MVVM
- `Screen + ViewModel + State + Event` quartet for every screen
- `MaterialTheme` tokens for everything that repeats
- `@Preview` on every screen and major component
- For CMP: `Res.*` resources, JetBrains preview annotation, expect/actual when needed

## Priority order (when in doubt)

1. **User instructions in the conversation** — always win
2. **`CLAUDE.md` / `THEME.md` / convention docs** — the project's written law
3. **Existing theme files and components** — adapt the design to them
4. **Skill defaults** — only when nothing higher exists

## Inputs supported

| Input | Path |
|---|---|
| Figma frame URL | Figma MCP (`get_code`, `get_image`, `get_variable_defs`) |
| Stitch project | Stitch MCP |
| Screenshot / PNG / JPG | Vision analysis with measurement heuristics |
| Multiple of the above | Figma/Stitch as source of truth, screenshot as ground truth |

If an MCP isn't connected, the skill falls back to screenshot analysis and tells you what was missed.

## Targets supported

- **Jetpack Compose (Android-only)** — detected by `com.android.application` plugin + no `kotlin("multiplatform")`
- **Compose Multiplatform (KMM)** — detected by `composeApp/` or `shared/` module, `kotlin("multiplatform")` plugin
- **Auto-detect** by inspecting `settings.gradle.kts` and module layout

## License

MIT — same as `claude-android-kit`.
