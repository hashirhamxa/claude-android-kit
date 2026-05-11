---
description: Convert a Figma link, Stitch link, or UI screenshot into pixel-faithful Jetpack Compose or Compose Multiplatform code.
argument-hint: [figma URL | stitch URL | image path | description]
---

# /ui-from-image

Build a Compose / Compose Multiplatform screen that visually matches a provided design source.

## Input

The user may provide any of these (or a combination):

- A Figma frame URL
- A Stitch project link
- A screenshot or mockup image (attached or referenced by path)
- A description naming a previously-shown design ("the login from earlier")

Arguments passed: `$ARGUMENTS`

## What to do

Load the `ui-from-image` skill and follow its workflow strictly:

1. **Phase 1 — Detect inputs.** Identify which source type(s) you have. If unclear, ask one targeted question.
2. **Phase 2 — Detect target & discover conventions.** Inspect the project to determine Jetpack Compose (Android) vs Compose Multiplatform. **Scan for and read `CLAUDE.md`, `THEME.md`, `DESIGN.md`, and any other convention docs.** Read `references/project-conventions.md` to know how to respect them.
3. **Phase 3 — Extract the design.** Use the matching reference (Figma MCP, Stitch MCP, or screenshot analysis).
4. **Phase 4 — Inventory the design system & respect what exists.** Find existing theme files and components. Apply the strict priority order (user > convention docs > existing theme > skill defaults). **Never silently override an existing token.** When the design conflicts with the project's theme, ask before changing anything.
5. **Phase 5 — Plan the composable tree.** Write out the hierarchy before writing code. Reuse existing components from `core/ui/components/` (or equivalent) before creating new ones.
6. **Phase 6 — Resolve assets.** Build the manifest of icons, images, and fonts needed. Ask the user how to handle each (provided files, MCP export, Material substitution, or placeholders). Read `references/assets.md`.
7. **Phase 7 — Generate code.** Follow the project's existing structure (feature folders, MVVM, Manual DI, no Hilt/Koin). Use only existing theme tokens unless conventions explicitly permit otherwise.
8. **Phase 8 — Self-verify.** Run the full checklist from the skill against the source, including the "no token overrides" check.

## Conventions to enforce

**Project conventions always win.** If the project has a `CLAUDE.md`, `THEME.md`, or any other convention doc, those rules override the defaults below. If the project has an existing theme, use its tokens — don't introduce new ones unless the design requires it (and then *add*, don't replace).

When no project conventions exist, fall back to these defaults:

- **Manual DI only** — never introduce Hilt or Koin
- **Clean Architecture + MVVM** — Screen + ViewModel + State + Event quartet
- **Compose / CMP idioms** — `Arrangement.spacedBy`, `MaterialTheme.colorScheme.X`, proper `Modifier` chain order
- **Tokens over literals** — values that repeat go into `Color.kt` / `Type.kt` / `Dimens.kt`
- **Previews** — every screen and major component gets a `@Preview`
- **No invented assets** — if a drawable/font isn't in the project, use a Material substitute or explicit `AssetPlaceholder`
- **No silent token overrides** — if the design's colors/sizes conflict with the existing theme, ask before changing

## Output

When done, give the user:

1. A short summary (1-3 lines) of what was built and where
2. **Asset summary** — what was provided, what was substituted with Material Icons, what's a placeholder (with file + line refs)
3. Any other assumptions made (font fallback, color guesses)
4. A TODO list of follow-ups (real strings, ViewModel logic, asset replacements)

Keep the summary short. The code is the point.
