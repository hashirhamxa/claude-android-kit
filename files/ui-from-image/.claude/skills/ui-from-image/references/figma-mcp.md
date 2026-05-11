# Figma MCP

When the user gives a Figma URL, prefer the Figma MCP server. It gives you structured data — frame trees, variables, layout properties, exported assets — which is far more reliable than vision-analyzing a rendered image.

## Tools available (when Figma MCP is connected)

The Figma Dev Mode MCP exposes (names may vary slightly by version):

- `get_code` — returns code-like representation of a selected frame
- `get_image` — returns a rendered PNG of the frame (useful as ground-truth reference)
- `get_variable_defs` — returns the design tokens (colors, typography, spacing) defined as Figma variables
- `get_code_connect_map` — returns mappings if the team has set up Code Connect

## How to use

1. **Confirm the MCP is connected**. If not, fall back to `references/screenshot-analysis.md` and tell the user "Figma MCP isn't connected; I'll work from a screenshot if you can paste one, or you can connect Figma in settings".

2. **Ask for a frame URL**, not just the file URL. The frame URL includes `node-id=...` and tells the MCP exactly what to extract. If the user gave only a file URL, ask them to select the frame in Figma and copy that specific URL.

3. **Call `get_variable_defs` first**. This gives you the design system tokens — colors, font sizes, spacing — as named variables. These map directly to your `Color.kt` / `Type.kt` / `Dimens.kt`.

4. **Call `get_image`**. Save the rendered image. You'll use it as ground truth during the self-verify phase.

5. **Call `get_code`**. This gives you the structure. Note that the output is *not* directly usable Compose code — it's typically React/HTML/CSS-flavored. Use it for:
   - Layout structure (what's nested in what)
   - Exact px/dp values
   - Component grouping hints

6. **Translate, don't transpile.** The MCP gives you data, not Compose. You decide:
   - Which CSS flex properties map to `Row` vs `Column` vs `FlowRow`
   - Which absolute positions can become relative layouts
   - Which repeated structures become extracted composables

## Mapping Figma → Compose

| Figma concept | Compose equivalent |
|---|---|
| Auto Layout (horizontal) | `Row` with `Arrangement.spacedBy()` |
| Auto Layout (vertical) | `Column` with `Arrangement.spacedBy()` |
| Item spacing | `Arrangement.spacedBy(n.dp)` |
| Padding (all sides) | `Modifier.padding(n.dp)` |
| Padding (per side) | `Modifier.padding(start = ..., top = ..., ...)` |
| Fill container | `Modifier.fillMaxWidth()` / `fillMaxHeight()` / `weight(1f)` |
| Hug contents | Default (no size modifier) or `wrapContentSize()` |
| Fixed | `Modifier.size(...)` or `width(...).height(...)` |
| Corner radius | `Modifier.clip(RoundedCornerShape(n.dp))` or `Card(shape = ...)` |
| Drop shadow | `Modifier.shadow(elevation = n.dp, shape = ...)` |
| Stroke / border | `Modifier.border(width, color, shape)` |
| Effect: blur | `Modifier.blur(n.dp)` |
| Variants | Different composables or parameterized state |
| Components / instances | Extracted composables with parameters |
| Variables (colors) | `MaterialTheme.colorScheme.X` or custom palette object |
| Variables (typography) | `MaterialTheme.typography.X` or custom `TextStyle` |
| Variables (spacing) | `Dimens.X` (custom object) or just literals if not reused |

## Fallback when MCP isn't connected

If Figma MCP isn't available:

1. Ask the user to export the frame as PNG @ 2x (or 3x) and paste it
2. Ask them to share the design tokens manually if they have a token reference (often in a "Design System" page in the file)
3. Proceed via `references/screenshot-analysis.md`
4. Suggest connecting the Figma MCP for next time — better fidelity, less guessing

## Common gotchas

- **Pixel values from Figma are not always 1:1 with dp.** Figma frames designed at 360px width map to a 360dp baseline on Android. Frames at 375px (iOS default) need scaling consideration. Confirm the frame's design width and treat values as dp at that baseline.
- **Auto-layout gaps include the padding.** Don't double-pad — if the Auto Layout has `padding: 16` and `gap: 8`, write `padding(16.dp)` + `spacedBy(8.dp)`, not extra spacers.
- **Hidden layers**. Figma frames often have hidden layers (alternates, dev notes). `get_code` may or may not include them; trust the rendered image (`get_image`) as the visual ground truth.
- **Text in Figma vs Compose**. Figma's line-height is often expressed as a percentage or as a px value. Compose `lineHeight` is sp. Convert: line-height-px ÷ font-size-px × font-size-sp. Or just measure the rendered image.
