# Screenshot Analysis

When the input is a plain image (PNG, JPG) with no design-file backing, you're doing visual analysis. This is less precise than Figma/Stitch MCP but it works.

## Read the image carefully — twice

First pass: get the overall structure.

- What kind of screen is this? (login, list, detail, settings, dashboard)
- What's the device width context? (phone portrait, tablet, fullscreen, sheet/dialog)
- How many distinct sections are there top-to-bottom?
- Is there a top bar? Bottom bar? FAB? Drawer hint?

Second pass: extract the design system.

- What colors are used? Look for: primary (the loudest brand color), surface/background, on-surface (text on background), accent, error, success states
- What's the type hierarchy? Identify at least: display/headline, title, body, label/caption sizes
- What's the spacing rhythm? Most designs have a base unit (4, 6, or 8). Identify which.
- What corner radii are used? Usually 1-3 distinct values in a design.

## Measurement heuristics

You can't measure pixels exactly from an image, but you can estimate well:

1. **Find a known reference.** A status bar is 24dp tall on Android. A FAB is 56dp. A standard button is 48dp tall. A TopAppBar is 64dp. Use these to calibrate.

2. **Find the device frame width.** If the image was exported at a known size (3x mockup of a 390pt iPhone, or 1080px Android phone at xxxhdpi → 360dp baseline), you can compute the dp scale.

3. **Snap to the grid.** Once you have a guess, snap to the nearest sensible value:
   - Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
   - Font sizes: 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48
   - Corner radii: 4, 8, 12, 16, 20, 24, full (CircleShape)

4. **When unsure, prefer 8pt grid values.** Material Design defaults to it, and most designs follow it whether they realize or not.

## Color extraction

For each distinct color in the image:

1. Identify its semantic role (background, surface, primary, text-primary, text-secondary, divider, etc.)
2. Estimate the hex value. If you can sample pixels (in code), do so. Otherwise be honest about the estimate and flag it.
3. Group near-duplicates. Designs often have small color variations that should collapse to a single token.

Common mistakes:
- Treating off-whites as pure white (`#FFFFFF`) when they're `#FAFAFA` or `#F5F5F5` — these matter
- Treating off-blacks as pure black — almost no design uses `#000000`; usually `#1A1A1A` or `#0F172A` or similar
- Missing the alpha on overlays / disabled states

## Typography extraction

Identify:

- **Font family**. If unknown, default to:
  - System default (Roboto on Android, SF Pro on iOS) for system-feeling apps
  - **Inter** for modern flat designs
  - **Plus Jakarta Sans, DM Sans, Geist** for trendy startup feel
  - **Manrope, Sora** for crypto/web3-feeling
  - Ask the user if it's a brand-critical app

- **Sizes**. Map to a scale:
  - Hero: 28-36sp
  - Title: 20-24sp
  - Subtitle: 16-18sp
  - Body: 14-16sp
  - Caption: 11-12sp

- **Weights**. Identify Regular (400), Medium (500), SemiBold (600), Bold (700). The difference between Medium and SemiBold is small but very visible — be careful.

- **Letter spacing & line height**. Default to Compose defaults unless the design clearly deviates. Tight letter-spacing (-0.5sp) is common in modern designs for headlines.

## When in doubt, ask one targeted question

If a critical piece of information is ambiguous from the image alone, ask **one** specific question rather than guess and ship something wrong:

- "I can't tell if this is Inter or DM Sans — which is it?"
- "The primary color reads as deep blue but could be navy or indigo — do you have the hex?"
- "Is this a phone or tablet design?"

Don't ask a barrage of questions. One clarifying question is fine; three is annoying.

## Build, then compare side-by-side

After generating code:

1. Take a screenshot of the rendered preview (if running in an IDE/emulator)
2. Place it next to the source image mentally (or actually, if reviewing with the user)
3. Run the self-verify checklist from the main SKILL.md

The most common drift sources, in order:
1. Spacing (gaps off by 4-8dp)
2. Font weight (Medium vs SemiBold)
3. Color (off-white vs pure white)
4. Corner radius (12dp vs 16dp)
5. Icon size (24dp vs 20dp)
