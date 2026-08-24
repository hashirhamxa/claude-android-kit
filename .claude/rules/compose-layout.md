# Compose Layout & Responsiveness Rules

## 1. Multi-Button Stacking & Row Constraints
- **Ban Unconstrained Multi-Button Rows:** Placing 3 or more action buttons side-by-side in an unconstrained `Row` without `Modifier.weight(1f)` causes text squishing and truncation on smaller screens.
- **Vertical Stacking for Empty States & Dialogs:** For action-heavy empty states, error cards, and dialogs, use vertical `Column` layouts with `Modifier.fillMaxWidth()` buttons.
- **Horizontal Rows with Weights:** If buttons must be horizontal, explicitly apply `Modifier.weight(1f)` to each child button to ensure proportional distribution.

```kotlin
// ❌ BANNED: Squished unconstrained buttons in a Row
Row {
    Button(onClick = {}) { Text("Notification Center") }
    Button(onClick = {}) { Text("Server Link Details") }
    Button(onClick = {}) { Text("App Status Tracker") }
}

// ✅ REQUIRED: Explicit weights or responsive wrapping
Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
    Button(onClick = {}, modifier = Modifier.weight(1f)) { Text("Notifications", maxLines = 1) }
    Button(onClick = {}, modifier = Modifier.weight(1f)) { Text("Server Link", maxLines = 1) }
    Button(onClick = {}, modifier = Modifier.weight(1f)) { Text("App Status", maxLines = 1) }
}
```

## 2. Text Truncation & Header Constraints
- **TopAppBar & List Headers:** All `TopAppBar` titles, subtitle counters, and list item titles must explicitly declare `maxLines` (1 or 2) and `overflow = TextOverflow.Ellipsis`.

```kotlin
Text(
    text = app.appName,
    style = MaterialTheme.typography.titleMedium,
    maxLines = 1,
    overflow = TextOverflow.Ellipsis
)
```
