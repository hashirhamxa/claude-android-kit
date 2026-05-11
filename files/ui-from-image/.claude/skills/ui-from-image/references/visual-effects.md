# Visual Effects

The fidelity-killers: gradients, shadows, blurs, custom shapes, glassmorphism. Designs that look "premium" usually rely on these, and they're where naive Compose implementations look wrong.

## Gradients

### Linear gradients

```kotlin
Box(
    modifier = Modifier
        .fillMaxWidth()
        .height(200.dp)
        .background(
            brush = Brush.linearGradient(
                colors = listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)),
                start = Offset(0f, 0f),
                end = Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY), // top-left → bottom-right
            )
        )
)
```

Match the angle from the design:
- Top → bottom: `start = Offset(0, 0)`, `end = Offset(0, POSITIVE_INFINITY)`
- Left → right: `start = Offset(0, 0)`, `end = Offset(POSITIVE_INFINITY, 0)`
- Diagonal (top-left → bottom-right): both axes
- 45° / 135° / arbitrary: use `Brush.linearGradient(..., start = Offset(x1, y1), end = Offset(x2, y2))` with calculated offsets

### Radial gradients

```kotlin
.background(
    brush = Brush.radialGradient(
        colors = listOf(Color(0xFFFCD34D), Color.Transparent),
        center = Offset.Unspecified, // defaults to center
        radius = 400f,
    )
)
```

### Multi-stop gradients

```kotlin
brush = Brush.linearGradient(
    colorStops = arrayOf(
        0.0f to Color(0xFF000000),
        0.5f to Color(0xFF1F2937),
        1.0f to Color(0xFF374151),
    ),
)
```

### Gradient over a non-rectangular shape

Apply `.clip(shape)` *before* `.background(brush)`:

```kotlin
Modifier
    .clip(RoundedCornerShape(16.dp))
    .background(Brush.linearGradient(...))
```

## Shadows

### Standard elevation shadow

```kotlin
Modifier.shadow(
    elevation = 8.dp,
    shape = RoundedCornerShape(12.dp),
    spotColor = Color.Black.copy(alpha = 0.15f),
    ambientColor = Color.Black.copy(alpha = 0.1f),
)
```

Important: `Modifier.shadow()` requires a `shape` if the composable is rounded. Without it, the shadow is rectangular even if the visible component is rounded.

### Soft / diffused shadows (designer-style)

Compose's default shadow is sharp. Designer mockups often show diffused, soft shadows. Approaches:

1. **Layer multiple lower-elevation shadows** (cheap, looks ok)
2. **Draw via `Modifier.drawBehind`** with a `Paint` configured with a `MaskFilter` (Android only) or blur (Compose 1.6+)
3. **Use a custom shadow library** like `compose-shadow` if pixel-perfect soft shadows matter

For most cases, `Modifier.shadow(elevation = ..., spotColor = ..., ambientColor = ...)` with tuned alphas is enough.

### Colored shadows

```kotlin
Modifier.shadow(
    elevation = 16.dp,
    shape = RoundedCornerShape(20.dp),
    spotColor = Color(0xFF6366F1).copy(alpha = 0.3f),  // purple glow
)
```

Note: colored shadows only render on Android 9+ (API 28+). On older devices, fall back gracefully.

## Blurs

`Modifier.blur()` works on Android 12+ (API 31+). On older Android, it's a no-op. On CMP/iOS, it works in recent versions.

```kotlin
Modifier
    .blur(radius = 20.dp)
    .background(Color.White.copy(alpha = 0.2f))
```

For **glassmorphism** (frosted glass effect over content):

```kotlin
Box {
    // Background content (image, gradient, etc.)
    Image(painter = painterResource(...), contentDescription = null, modifier = Modifier.fillMaxSize())

    // Frosted overlay
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(120.dp)
            .align(Alignment.BottomCenter)
            .blur(24.dp)
            .background(Color.White.copy(alpha = 0.5f))
    )

    // Sharp content on top
    Text("Hello", modifier = Modifier.align(Alignment.BottomCenter).padding(24.dp))
}
```

On older devices where blur doesn't work, the result is just a semi-transparent overlay — usually acceptable.

## Custom shapes

If the design needs a non-standard shape (cut corners, tickets, wave-bottom card):

```kotlin
class TicketShape(private val notchRadius: Dp = 12.dp) : Shape {
    override fun createOutline(
        size: Size,
        layoutDirection: LayoutDirection,
        density: Density,
    ): Outline {
        val notchPx = with(density) { notchRadius.toPx() }
        val path = Path().apply {
            // Custom path drawing here
            // ...
            close()
        }
        return Outline.Generic(path)
    }
}

Box(
    modifier = Modifier
        .clip(TicketShape())
        .background(Color.White)
)
```

Most designs only need:
- `RoundedCornerShape(n.dp)` — uniform radius
- `RoundedCornerShape(topStart = ..., topEnd = ..., bottomStart = ..., bottomEnd = ...)` — per-corner
- `CircleShape` — for avatars, FABs, fully-rounded buttons
- `CutCornerShape(n.dp)` — angular cuts

Reach for `Outline.Generic` only when none of those fit.

## Backgrounds with patterns

If the design has a subtle pattern or noise texture:

1. **Solid color + slight noise**: use a tileable PNG with low opacity, repeat via `Brush.imageBrush` or a `Modifier.drawBehind`.
2. **Geometric patterns**: draw directly with `Canvas` or `Modifier.drawBehind`.
3. **Photographic backgrounds**: `Image(contentScale = ContentScale.Crop, modifier = Modifier.matchParentSize())` behind content.

## When effects are expensive

Blur, large shadows, and heavy layering cost frames. If the screen needs to scroll smoothly:

- Avoid blur on scrolling content; keep it on static layers
- Cache complex `drawBehind` paths if they don't change
- Use `Modifier.graphicsLayer { alpha = ... }` for fade animations instead of recomposing with new colors

For a one-off splash or hero screen, performance doesn't matter — go heavy on effects.
