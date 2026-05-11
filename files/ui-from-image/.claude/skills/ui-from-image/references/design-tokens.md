# Design Tokens

Tokens are the named values (colors, fonts, spacings, radii) that the design system uses. Extracting them properly is what makes UIs feel coherent — and what makes future screens take 10 minutes instead of an hour.

## What counts as a token

A value is a token if it appears **more than once** in the design (across screens or repeated within a screen). One-off values stay as literals.

Categories:

1. **Color tokens** — semantic colors that map to roles
2. **Typography tokens** — font + size + weight combinations used as a set
3. **Spacing tokens** — the recurring gaps (usually 4-6 values cover most of a design)
4. **Radius tokens** — the recurring corner radii
5. **Elevation / shadow tokens** — if the design uses multiple shadow depths
6. **Motion tokens** — durations and easings (if specified)

## Color tokens

The Material 3 color roles cover most needs. Map your extracted colors to:

```kotlin
// commonMain/.../ui/theme/Color.kt  (or app/src/main/kotlin/.../ui/theme/Color.kt for Android-only)

// Brand
val Primary = Color(0xFF...)
val OnPrimary = Color(0xFFFFFFFF)
val PrimaryContainer = Color(0xFF...)
val OnPrimaryContainer = Color(0xFF...)

val Secondary = Color(0xFF...)
val OnSecondary = Color(0xFF...)
val SecondaryContainer = Color(0xFF...)
val OnSecondaryContainer = Color(0xFF...)

// Surfaces
val Background = Color(0xFF...)
val OnBackground = Color(0xFF...)
val Surface = Color(0xFF...)
val OnSurface = Color(0xFF...)
val SurfaceVariant = Color(0xFF...)
val OnSurfaceVariant = Color(0xFF...)

// Status
val Error = Color(0xFF...)
val OnError = Color(0xFF...)
val Success = Color(0xFF...)        // not in M3 default; add as custom
val Warning = Color(0xFF...)        // not in M3 default; add as custom

// Then build dark equivalents:
val PrimaryDark = Color(0xFF...)
// ...etc
```

Use them in a `ColorScheme`:

```kotlin
private val LightColors = lightColorScheme(
    primary = Primary,
    onPrimary = OnPrimary,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = OnPrimaryContainer,
    secondary = Secondary,
    // ...
)

private val DarkColors = darkColorScheme(
    primary = PrimaryDark,
    // ...
)
```

For custom colors not in Material's scheme (success, warning, gradient stops), put them in a separate object:

```kotlin
object ExtendedColors {
    val success = Color(0xFF22C55E)
    val warning = Color(0xFFF59E0B)
    val info = Color(0xFF3B82F6)
}
```

Or use `CompositionLocalProvider` for full theme-awareness if you want them to swap in dark mode.

## Typography tokens

Material 3 ships with 15 type styles (displayLarge through labelSmall). Override the ones your design actually uses, keep defaults for the rest:

```kotlin
val AppTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = InterFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = (-0.5).sp,
    ),
    titleLarge = TextStyle(
        fontFamily = InterFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 28.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = InterFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = InterFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
    ),
    // etc...
)
```

Don't try to override all 15 if the design only uses 5. The defaults are reasonable fallbacks.

## Spacing tokens

If the design uses 4-6 recurring spacing values, name them:

```kotlin
object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
    val xxl = 48.dp
}
```

Then use `Spacing.md` in code instead of literal `16.dp`. This makes future-proofing trivial.

**Don't over-tokenize.** If you have 7+ spacing values, you have either a real design system (great, name them all) or an inconsistent design (better to flag this and ask the user to consolidate).

## Radius tokens

```kotlin
object Radius {
    val sm = 4.dp      // chips, inline pills
    val md = 8.dp      // inputs, small cards
    val lg = 12.dp     // buttons
    val xl = 16.dp     // cards, sheets
    val full = 999.dp  // fully rounded
}

// Used as:
Modifier.clip(RoundedCornerShape(Radius.lg))
```

## When to extend the existing theme vs replace

If the project already has a theme:

- **Adding a new color the design needs**: extend `Color.kt`, add to `ColorScheme` if it's a Material role, or to `ExtendedColors` if it's custom.
- **A different brand**: full replacement is justified.
- **A "different mode" (e.g., promo skin)**: create a parallel theme function (`PromoTheme {}`) rather than replacing the default.

Never silently change existing token values — other screens depend on them.

## When the design has no clear token system

Some designs (especially screenshots from non-system designers) are inconsistent: a button is `12dp` here, `14dp` there, `13dp` elsewhere. Don't preserve the inconsistency.

- Pick the most-used value as the canonical token
- Snap outliers to the nearest reasonable value
- Flag this to the user: "I noticed the corner radii in the design vary slightly (12-14dp). I standardized to 12dp — if you want them to vary per-screen, let me know."

## Token naming

- Semantic over literal. `Primary` > `Blue`. `Background` > `White`. The semantic name survives a rebrand; the literal doesn't.
- Match the project's existing conventions. If the project uses `Md3Primary` style names, do that. If it uses `colorPrimary`, do that.
