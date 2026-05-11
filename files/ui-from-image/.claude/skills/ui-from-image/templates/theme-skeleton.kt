// templates/theme-skeleton.kt
// Drop-in starting point for a fresh theme.
// Replace tokens with values extracted from the design.
// Place these files in:
//   - Android-only: app/src/main/kotlin/<pkg>/ui/theme/
//   - CMP:          composeApp/src/commonMain/kotlin/<pkg>/ui/theme/

// =====================================================================
// Color.kt
// =====================================================================
package <pkg>.ui.theme

import androidx.compose.ui.graphics.Color

// --- Light palette ---
val Primary = Color(0xFF000000)            // TODO: replace
val OnPrimary = Color(0xFFFFFFFF)
val PrimaryContainer = Color(0xFF000000)   // TODO
val OnPrimaryContainer = Color(0xFFFFFFFF)

val Secondary = Color(0xFF000000)          // TODO
val OnSecondary = Color(0xFFFFFFFF)
val SecondaryContainer = Color(0xFF000000) // TODO
val OnSecondaryContainer = Color(0xFFFFFFFF)

val Background = Color(0xFFFFFFFF)
val OnBackground = Color(0xFF111111)
val Surface = Color(0xFFFFFFFF)
val OnSurface = Color(0xFF111111)
val SurfaceVariant = Color(0xFFF5F5F5)
val OnSurfaceVariant = Color(0xFF555555)

val Outline = Color(0xFFE5E5E5)
val OutlineVariant = Color(0xFFEFEFEF)

val ErrorColor = Color(0xFFB3261E)
val OnError = Color(0xFFFFFFFF)

// --- Dark palette (TODO: tune per design) ---
val PrimaryDark = Primary
val OnPrimaryDark = OnPrimary
val PrimaryContainerDark = PrimaryContainer
val OnPrimaryContainerDark = OnPrimaryContainer

val SecondaryDark = Secondary
val OnSecondaryDark = OnSecondary

val BackgroundDark = Color(0xFF0A0A0A)
val OnBackgroundDark = Color(0xFFEFEFEF)
val SurfaceDark = Color(0xFF121212)
val OnSurfaceDark = Color(0xFFEFEFEF)
val SurfaceVariantDark = Color(0xFF1F1F1F)
val OnSurfaceVariantDark = Color(0xFFBDBDBD)

val OutlineDark = Color(0xFF2A2A2A)

// Custom extended colors (not in M3 default scheme)
object ExtendedColors {
    val success = Color(0xFF22C55E)
    val warning = Color(0xFFF59E0B)
    val info = Color(0xFF3B82F6)
}


// =====================================================================
// Type.kt
// =====================================================================
package <pkg>.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Replace with project's brand font.
// Android: declare via Font(R.font.your_font, ...)
// CMP:     declare via Font(Res.font.your_font, ...)
val AppFontFamily: FontFamily = FontFamily.Default

val AppTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = (-0.5).sp,
    ),
    headlineLarge = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 24.sp,
        lineHeight = 32.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 28.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
    ),
)


// =====================================================================
// Dimens.kt
// =====================================================================
package <pkg>.ui.theme

import androidx.compose.ui.unit.dp

object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
    val xxl = 48.dp
}

object Radius {
    val sm = 4.dp
    val md = 8.dp
    val lg = 12.dp
    val xl = 16.dp
    val xxl = 24.dp
    val full = 999.dp
}


// =====================================================================
// Theme.kt
// =====================================================================
package <pkg>.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = Primary,
    onPrimary = OnPrimary,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = OnPrimaryContainer,
    secondary = Secondary,
    onSecondary = OnSecondary,
    secondaryContainer = SecondaryContainer,
    onSecondaryContainer = OnSecondaryContainer,
    background = Background,
    onBackground = OnBackground,
    surface = Surface,
    onSurface = OnSurface,
    surfaceVariant = SurfaceVariant,
    onSurfaceVariant = OnSurfaceVariant,
    outline = Outline,
    outlineVariant = OutlineVariant,
    error = ErrorColor,
    onError = OnError,
)

private val DarkColors = darkColorScheme(
    primary = PrimaryDark,
    onPrimary = OnPrimaryDark,
    primaryContainer = PrimaryContainerDark,
    onPrimaryContainer = OnPrimaryContainerDark,
    secondary = SecondaryDark,
    onSecondary = OnSecondaryDark,
    background = BackgroundDark,
    onBackground = OnBackgroundDark,
    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = OnSurfaceVariantDark,
    outline = OutlineDark,
    error = ErrorColor,
    onError = OnError,
)

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = AppTypography,
        content = content,
    )
}
