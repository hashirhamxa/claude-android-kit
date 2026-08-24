<!-- Derived from rules/06-security.md during Phase 1 split.
     Extends rules/common/security.md — install common/ alongside this file -->
# Security

## Secrets in Android builds

- Expose via `BuildConfig`:

```kotlin
// app/build.gradle.kts
val props = Properties().apply {
    rootProject.file("local.properties").inputStream().use { load(it) }
}
buildConfigField("String", "SUPABASE_URL", "\"${props["supabase.url"]}\"")
buildConfigField("String", "SUPABASE_ANON_KEY", "\"${props["supabase.anonKey"]}\"")
```

- `google-services.json` is public-ish but still not committed if the project is closed-source — prevents accidental config leaks between environments.

## Network

- No plaintext HTTP in the `networkSecurityConfig`. `cleartextTrafficPermitted="false"`.

## Sensitive data at rest

- `EncryptedSharedPreferences` (AndroidX Security) for tokens, user IDs, anything tied to identity.
- Room tables with sensitive data: use SQLCipher via `SupportFactory` if the data warrants it (PII, financial, health).
- Never log the content of notifications or SMS in TamaamPaisa-style parsing apps. Log metadata only (source, timestamp, type).

## Auth tokens

- Access tokens in memory only when possible; encrypted storage when persistence is needed.
- Refresh tokens always encrypted at rest.
- Biometric prompt (`androidx.biometric`) gates sensitive actions, not just app entry.
- Token rotation on privilege-sensitive operations.

## Logging

- `Timber` on Android with `DebugTree()` only in debug builds.
- Release builds: empty `Tree` that forwards errors to Crashlytics but logs nothing else.
- Never log PII, tokens, or raw SMS/notification content.
- Never log entire API responses.

```kotlin
if (BuildConfig.DEBUG) Timber.plant(Timber.DebugTree())
else Timber.plant(CrashReportingTree())
```

## Android manifest & component hardening

- `android:allowBackup="false"` unless you have a reason and have audited what's in the backup.
- `android:usesCleartextTraffic="false"` (enforced in production).
- `android:exported` explicit on every activity, service, receiver, provider. Missing attribute = build failure on modern AGP anyway.
- Dynamic `BroadcastReceiver` registration on Android 14+ (API 34+) MUST specify export flags:
  ```kotlin
  ContextCompat.registerReceiver(
      context,
      receiver,
      filter,
      ContextCompat.RECEIVER_NOT_EXPORTED // Or RECEIVER_EXPORTED if intended for OS/external apps
  )
  ```
- All `PendingIntent` instances MUST specify `PendingIntent.FLAG_IMMUTABLE` (unless mutable behavior is strictly required, in which case specify `PendingIntent.FLAG_MUTABLE` with explicit target package intent).
- Intent filters scoped tightly — don't export receivers that don't need external access.

## WebView hardening

If WebViews are required:
- `setAllowFileAccess(false)` and `setAllowContentAccess(false)`.
- Enable JavaScript (`setJavaScriptEnabled(true)`) ONLY for strictly verified, HTTPS-only domains.
- Never inject Javascript interfaces (`addJavascriptInterface`) pointing to privileged objects.

## Native libraries & 16 KB page size (Android 15+)

- Any native C/C++ libraries (`.so` dependencies, NDK binaries, third-party SDKs) must be built with 16 KB memory page alignment (`-Wl,-z,max-page-size=16384`).
- Required for Google Play target SDK 35+ and Android 15 devices.

## Permissions

- Request the minimum.
- Runtime permissions requested in context ("grant camera to scan receipt"), never on app launch.
- SMS/notification permissions require a clear explanation on why — Play Store will reject otherwise.
