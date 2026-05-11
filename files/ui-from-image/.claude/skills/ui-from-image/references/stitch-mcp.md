# Stitch MCP

Stitch is Google's AI-powered UI design tool. When the user references a Stitch project, the Stitch MCP gives you access to designs and exported assets.

## Tools available (when Stitch MCP is connected)

The Stitch MCP typically exposes:

- A way to list projects / screens (look up the exact tool name when the MCP loads)
- A way to fetch a specific screen's design data given a project ID and screen ID
- A way to export assets

## Usage

1. **Confirm the MCP is connected.** If not, ask the user to either connect it (Settings → Connectors → Stitch) or share a screenshot of the design instead.

2. **Get the project ID.** Hash already has at least one Stitch project configured (e.g., TamaamPaisa: `8170696845459830910`). If the user doesn't specify which project, list available projects and ask.

3. **Get the screen ID or name.** Stitch organizes designs into screens; you need to know which screen the user wants built.

4. **Pull the design.** The MCP will give you a structured representation — typically HTML/CSS or a JSON tree. Treat it the same way you'd treat Figma `get_code`: a structural hint, not Compose code.

5. **Pull a rendered preview if available.** Use it as ground truth during self-verify.

## Stitch quirks

- Stitch designs tend to be web-flavored (Tailwind classes, web-first sizing). Be aggressive about reinterpreting web idioms into mobile Compose:
  - `max-w-xl` web → `widthIn(max = ...dp)` or just `fillMaxWidth()` on mobile
  - `grid grid-cols-3` → `LazyVerticalGrid(GridCells.Fixed(3))` or a manual `Row`
  - `hover:` states → ignore for mobile; map to `clickable` if functional
  - Web-style fonts (Inter, system-ui) → pick a close mobile equivalent (Inter is widely available)

- Stitch frequently uses **system fonts** by default. Verify what font name the design uses and add it to the project (download from Google Fonts, drop into `res/font/` for Android or `composeResources/font/` for CMP).

- Stitch outputs assume **light mode by default**. Always also build a dark-mode variant during the theming step.

## When the project is TamaamPaisa specifically

Hash has Stitch configured for TamaamPaisa with project ID `8170696845459830910`. If working in that repo and a Stitch reference is implied, default to that project ID and confirm the screen.

## Fallback

If the Stitch MCP isn't connected, ask the user to share the design as an exported image (Stitch supports PNG export) and proceed via `references/screenshot-analysis.md`.
