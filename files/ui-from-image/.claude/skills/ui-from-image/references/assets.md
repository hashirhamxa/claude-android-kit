# Asset Handling (Icons, Images, Fonts)

Every real design needs assets — icons, illustrations, logos, fonts, photos. The skill's job is to handle them *correctly* so generated code compiles and renders on first run, not after the user manually fixes broken `R.drawable.foo` references.

## The asset elicitation step

**Always run this step after Phase 5 (composable tree planning) and before Phase 6 (code generation).** You now know exactly which assets the screen needs — list them and ask the user how to handle each.

### 1. Build the asset manifest

From the planned composable tree, list every asset reference needed. Group by type:

```
Icons (vector / SVG):
- ic_arrow_back        (top bar)
- ic_eye               (password field trailing)
- ic_eye_off           (password field trailing, alt state)
- ic_google            (social login)
- ic_apple             (social login)

Images (raster / illustration):
- img_brand_logo       (hero header)
- img_empty_state      (empty list)

Fonts:
- Inter (Regular, Medium, SemiBold, Bold)
```

### 2. Ask the user — one structured question

Present the manifest and offer four routes per asset (or for the whole batch). Don't make them answer per-asset if the answer is the same for all:

> I'll need these assets for this screen:
>
> **Icons:** ic_arrow_back, ic_eye, ic_eye_off, ic_google, ic_apple
> **Images:** img_brand_logo, img_empty_state
> **Fonts:** Inter (4 weights)
>
> How should I handle them?
>
> 1. **I'll provide files** — paste the paths or drop them into `composeResources/drawable/` (CMP) or `app/src/main/res/drawable/` (Android) and tell me the names
> 2. **Pull from Figma/Stitch MCP** — I'll export from the design (only if MCP is connected and assets are present in the source)
> 3. **Use Material Icons / system fonts** — substitute with `Icons.Default.ArrowBack`, `Icons.Outlined.Visibility`, etc., and `FontFamily.Default`
> 4. **Generate compile-safe placeholders** — colored `Box` stand-ins with TODO comments; you swap real assets in later
>
> A mix is fine: e.g. "Material icons for icons 1-3, files for the brand logo, system font for now."

### 3. Apply the user's answer

Per route:

#### Route 1 — User provides files

The user will either:
- **Paste paths** like `/Users/hash/Downloads/ic_google.svg`. Copy them into the project at the right location.
- **List names** they've already placed. Verify they exist before referencing.

```bash
# For Android-only projects:
ls -la app/src/main/res/drawable/

# For CMP projects:
ls -la composeApp/src/commonMain/composeResources/drawable/
ls -la composeApp/src/commonMain/composeResources/font/
```

Naming rules to enforce (gently — if the user provided `Eye Icon.svg`, fix it without making it a hassle):
- `snake_case` for drawables: `ic_eye.svg`, `img_brand_logo.png`
- Icon prefix `ic_` for icons; `img_` for illustrations/photos; `bg_` for backgrounds
- Font files keep their PostScript name: `Inter_Regular.ttf`, `Inter_SemiBold.ttf`

If the user pastes an SVG, prefer that over PNG for icons. Compose handles SVGs via `androidx.compose.ui.graphics.vector` (auto-converted at build time on Android; native SVG support in CMP via `painterResource`).

#### Route 2 — Pull from Figma/Stitch MCP

Only viable if:
- The MCP is connected
- The asset exists in the design file (icons in Figma are often Components — exportable; sometimes they're just rendered text or shapes — not exportable)

For Figma:
```
Use get_image with the icon's node ID, export at @1x SVG if available, otherwise PNG @ 2x or 3x.
```

For Stitch: export functionality varies by version — check what the MCP exposes.

Save exports to:
- Android: `app/src/main/res/drawable/` (with `.svg` → auto-converted, or `.xml` for vector drawables)
- CMP: `composeApp/src/commonMain/composeResources/drawable/`

If the MCP returns base64 or a URL, save the file first, then reference it. Don't inline-embed.

#### Route 3 — Material Icons / system fonts substitution

This is the fastest path for most icons. Material Icons are already available in any Compose project.

**Icon mapping table** — common requests → Material equivalents:

| User asks for | Material 3 Icon |
|---|---|
| arrow_back, back arrow | `Icons.AutoMirrored.Filled.ArrowBack` |
| close, X, dismiss | `Icons.Default.Close` |
| menu, hamburger | `Icons.Default.Menu` |
| search | `Icons.Default.Search` |
| settings, gear | `Icons.Default.Settings` |
| home | `Icons.Default.Home` |
| person, profile, account | `Icons.Default.Person` |
| eye / show password | `Icons.Outlined.Visibility` |
| eye-off / hide password | `Icons.Outlined.VisibilityOff` |
| heart, favorite | `Icons.Default.Favorite` / `Icons.Outlined.FavoriteBorder` |
| more, ellipsis vertical | `Icons.Default.MoreVert` |
| more, ellipsis horizontal | `Icons.Default.MoreHoriz` |
| edit, pencil | `Icons.Default.Edit` |
| delete, trash | `Icons.Default.Delete` |
| share | `Icons.Default.Share` |
| check, tick | `Icons.Default.Check` |
| add, plus | `Icons.Default.Add` |
| chevron-right | `Icons.AutoMirrored.Filled.KeyboardArrowRight` |
| chevron-left | `Icons.AutoMirrored.Filled.KeyboardArrowLeft` |
| notifications, bell | `Icons.Default.Notifications` |
| email, envelope | `Icons.Default.Email` |
| lock | `Icons.Default.Lock` |
| calendar | `Icons.Default.CalendarToday` |
| location, pin | `Icons.Default.LocationOn` |
| star, rating | `Icons.Default.Star` |

For icons not in the Material set, check `androidx.compose.material.icons.outlined.*` and `androidx.compose.material.icons.rounded.*` — there are several hundred. If still no match, fall back to Route 4 (placeholder) and flag for the user.

**For brand-specific icons** (Google, Apple, GitHub, etc.) — Material Icons doesn't include these for trademark reasons. Always either:
- Ask the user to provide the SVG (Route 1)
- Use a community icon set like Simple Icons (`com.github.skydoves:simple-icons` or similar, if added)

Don't fake brand logos with Material Icons — `Icons.Default.Email` is not a Gmail icon.

**For fonts**: `FontFamily.Default` is fine as a placeholder. The output will look generic but render correctly. Flag clearly: "Used system default font — for brand fidelity, drop Inter into `composeResources/font/` and update `AppFontFamily` in `Type.kt`."

#### Route 4 — Compile-safe placeholders

When the user doesn't have assets yet and doesn't want Material substitutes, generate placeholders that:

- **Compile cleanly** (no missing-resource errors)
- **Hold the correct dimensions** (so layout matches even before real assets land)
- **Are visually obvious as placeholders** (so they don't accidentally ship)
- **Have a clear TODO comment** with the expected filename

Pattern for icon placeholders:

```kotlin
// TODO(assets): replace with painterResource(Res.drawable.ic_google)
Box(
    modifier = Modifier
        .size(24.dp)
        .background(Color.Magenta.copy(alpha = 0.3f), CircleShape),
    contentAlignment = Alignment.Center,
) {
    Text("G", style = MaterialTheme.typography.labelSmall)
}
```

Pattern for image placeholders:

```kotlin
// TODO(assets): replace with painterResource(Res.drawable.img_brand_logo)
Box(
    modifier = Modifier
        .size(width = 120.dp, height = 40.dp)
        .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(8.dp)),
    contentAlignment = Alignment.Center,
) {
    Text("LOGO", style = MaterialTheme.typography.labelMedium)
}
```

Extract a single `AssetPlaceholder` composable if you're using more than 2-3:

```kotlin
/**
 * Visual placeholder for assets not yet provided.
 * TODO(assets): replace all callsites with real painterResource(...).
 */
@Composable
fun AssetPlaceholder(
    label: String,
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(8.dp),
) {
    Box(
        modifier = modifier.background(Color.Magenta.copy(alpha = 0.15f), shape)
            .border(1.dp, Color.Magenta.copy(alpha = 0.5f), shape),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = Color.Magenta)
    }
}
```

Use the bright magenta intentionally — it's ugly enough that nobody will ship it by accident.

## When the user pastes file paths

If the user responds with paths like:

> Here are the icons:
> /Users/hash/Downloads/icons/ic_google.svg
> /Users/hash/Downloads/icons/ic_apple.svg
> /Users/hash/Downloads/logo.png

Do this:

1. **Verify each path exists** (`ls /Users/hash/Downloads/icons/ic_google.svg`)
2. **Copy to the project's resource folder** with corrected names if needed
3. **Confirm the copy worked** before referencing in code
4. **Don't move/delete the originals** — just copy

```bash
# CMP:
cp /Users/hash/Downloads/icons/ic_google.svg composeApp/src/commonMain/composeResources/drawable/ic_google.xml
# (rename .svg → .xml if you ran it through a vector drawable converter first; otherwise keep as-is and let CMP handle SVG natively)

# Android-only:
cp /Users/hash/Downloads/icons/ic_google.svg app/src/main/res/drawable/ic_google.svg
# Android Studio's vector asset import is more reliable than CLI for SVG → vector drawable conversion.
# For tricky SVGs, tell the user: "Import via Android Studio: right-click res → New → Vector Asset → select file."
```

If the user's filenames don't follow conventions (`Google Logo.svg`, `IMG_4823.png`), rename during copy and tell them what you renamed:

> Copied `Google Logo.svg` → `composeResources/drawable/ic_google.xml` (renamed for convention).

## When assets are referenced via URL

If the user pastes URLs (e.g., a Figma export link, a CDN URL):

- For **dev-time exports** (Figma `?format=png&scale=2` links): fetch and save into resources during the task. Tell the user where you put them.
- For **runtime images** (CDN, API responses): don't bundle. Use Coil/Coil-CMP:

```kotlin
// CMP with Coil 3 (multiplatform):
AsyncImage(
    model = "https://cdn.example.com/avatar.jpg",
    contentDescription = null,
    modifier = Modifier.size(48.dp).clip(CircleShape),
)
```

Verify Coil is already in the project (`grep -r "coil" gradle/libs.versions.toml`). If not, flag it as a dependency to add — don't add it silently.

## Fonts — special handling

Fonts deserve a dedicated check because they're the most common source of "looks wrong" complaints.

1. **Identify the font from the design** (Phase 3). If the design names a font (Inter, Plus Jakarta Sans, Poppins, DM Sans, etc.), use it. If not named but clearly distinctive, ask the user.

2. **Check if the font is in the project**:
```bash
# CMP
ls composeApp/src/commonMain/composeResources/font/ 2>/dev/null

# Android-only
ls app/src/main/res/font/ 2>/dev/null
```

3. **Offer paths**:
   - User drops `.ttf` files into the font folder → wire them in `Type.kt`
   - User wants Google Fonts → for Android, use the downloadable fonts API (`GoogleFont`); for CMP, download `.ttf` files and bundle (Google Fonts API doesn't work on iOS)
   - Use system default → fast, ugly, works

4. **For Google Fonts via downloadable fonts (Android only)**:

```kotlin
// Android only — uses Google Fonts provider, no bundled files
import androidx.compose.ui.text.googlefonts.GoogleFont
import androidx.compose.ui.text.googlefonts.Font as GoogleFontFont

val provider = GoogleFont.Provider(
    providerAuthority = "com.google.android.gms.fonts",
    providerPackage = "com.google.android.gms",
    certificates = R.array.com_google_android_gms_fonts_certs,
)

val Inter = GoogleFont("Inter")
val InterFamily = FontFamily(
    GoogleFontFont(googleFont = Inter, fontProvider = provider, weight = FontWeight.Normal),
    GoogleFontFont(googleFont = Inter, fontProvider = provider, weight = FontWeight.Medium),
    GoogleFontFont(googleFont = Inter, fontProvider = provider, weight = FontWeight.SemiBold),
    GoogleFontFont(googleFont = Inter, fontProvider = provider, weight = FontWeight.Bold),
)
```

For CMP, this doesn't work cross-platform — just bundle the `.ttf` files in `composeResources/font/`.

## Final output to user

At the end of code generation, the asset summary should list:

```
Assets used:
  ✓ Material Icons (substituted): ic_eye → Icons.Outlined.Visibility, ic_close → Icons.Default.Close
  ✓ Provided files (copied to composeResources/drawable/): ic_google.xml, img_brand_logo.png
  ✓ Font (bundled): Inter (4 weights) in composeResources/font/
  ⚠ Placeholders (TODO): ic_apple — provide the SVG and replace AssetPlaceholder("apple") in LoginScreen.kt:84
```

The ⚠ lines are the ones the user needs to action. Be explicit about line numbers so they can find them fast.
