# Compose Performance & I/O Isolation Rules

## 1. Zero Direct IPC & Heavy I/O in UI Layer
- **Strict Ban in `@Composable`:** Direct Android IPC calls, package queries (`packageManager.getApplicationIcon()`, `packageManager.getInstalledApplications()`, `packageManager.getPackageInfo()`), bitmap decoding (`BitmapFactory.decode*`), and file system / network operations inside `@Composable` functions or `remember` blocks are **strictly forbidden**.
- **Offload to `Dispatchers.IO`:** All package scanning, asset loading, and icon extractions must live in a dedicated `Repository` or `MemoryAssetCache` executing off `Dispatchers.IO`.

```kotlin
// ❌ BANNED: Heavy IPC/I/O in Composable
@Composable
fun AppItem(packageName: String) {
    val context = LocalContext.current
    // BAD: Janks UI thread with IPC calls during scrolling
    val icon = remember(packageName) { context.packageManager.getApplicationIcon(packageName) }
}

// ✅ REQUIRED: Pre-loaded via Repository / Cache off main thread
@Composable
fun AppItem(appUiModel: AppUiModel) {
    // AppUiModel already contains pre-resolved icon bitmap or cache key
    Image(bitmap = appUiModel.iconBitmap, contentDescription = appUiModel.appName)
}
```

## 2. Compose Stability & Immutability
- **Immutable State Models:** All UI state models (`*UiState`, `*UiModel`) must be `data class` with read-only (`val`) properties.
- **Annotate External & Collection Models:** Use `@Immutable` or `@Stable` on models originating from external libraries or multiplatform modules to allow strong skipping optimization.

```kotlin
@Immutable
data class TrackedAppUiModel(
    val id: String,
    val packageName: String,
    val appName: String,
    val isPublished: Boolean,
    val iconBitmap: ImageBitmap? = null
)
```
