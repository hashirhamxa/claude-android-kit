# Security

Mandatory. Applies to every project regardless of stage.

## Secrets never land in source

- API keys, Firebase config, Supabase anon key (even though "public"), third-party SDK keys, OAuth client secrets — none of these in `git`.
- `local.properties` for local dev secrets. It's already in `.gitignore`.
- Expose via `BuildConfig`:

```kotlin
// app/build.gradle.kts
val props = Properties().apply {
    rootProject.file("local.properties").inputStream().use { load(it) }
}
buildConfigField("String", "SUPABASE_URL", "\"${props["supabase.url"]}\"")
buildConfigField("String", "SUPABASE_ANON_KEY", "\"${props["supabase.anonKey"]}\"")
```

- CI secrets via encrypted env vars. Never echoed in logs.
- Before every commit: `git diff --cached | grep -iE "(api[_-]?key|secret|token|password|bearer)"` — add this to a pre-commit hook.

## Supabase / PostgREST

- **Row Level Security on every table, no exceptions.** Default-deny, then explicit policies.
- Anon key can only do what RLS allows. Verify this by trying to read a table you shouldn't from the anon context.
- Service role key **never** ships to clients. Server-side only.
- Storage buckets have RLS policies too. Public buckets are a deliberate decision, not a default.

## Firebase

- Firestore security rules locked down by default. Write rules before writing the first client read.
- Storage rules locked down by default.
- `google-services.json` is public-ish but still not committed if the project is closed-source — prevents accidental config leaks between environments.
- Separate Firebase projects for dev / staging / prod. Never share a project across environments.
- App Check on production builds. Play Integrity on Android, DeviceCheck/AppAttest on iOS.

## Network

- Ktor client with `Logging` plugin at `LogLevel.HEADERS` in debug, **`LogLevel.NONE` in release**. Never log request bodies in release.
- Certificate pinning for backend calls in production builds.
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

## Android manifest hardening

- `android:allowBackup="false"` unless you have a reason and have audited what's in the backup.
- `android:usesCleartextTraffic="false"`.
- `android:exported` explicit on every activity, service, receiver, provider. Missing attribute = build failure on modern AGP anyway.
- Intent filters scoped tightly — don't export receivers that don't need external access.

## iOS (for KMP projects)

- `NSAppTransportSecurity` — no exceptions for ATS in release.
- Keychain for sensitive storage (`KeychainAccess` or direct `Security` framework).
- Entitlements reviewed before each release — no stale ones.

## Dependency hygiene

- `./gradlew dependencyUpdates` monthly. CVE-affected libs bumped immediately.
- `gradle-versions-plugin` + `dependency-check-gradle` in CI.
- Review new dependencies: who publishes, how active, what permissions they need.

## Permissions

- Request the minimum.
- Runtime permissions requested in context ("grant camera to scan receipt"), never on app launch.
- SMS/notification permissions require a clear explanation on why — Play Store will reject otherwise.

## Pre-release checklist

Before any production release:

- [ ] No `println`, `Log.d`, or debug `Timber.d` in hot paths.
- [ ] No hardcoded test credentials.
- [ ] ProGuard/R8 enabled and tested.
- [ ] Certificate pins match production backend.
- [ ] Firebase / Supabase rules audited.
- [ ] Crashlytics / Sentry receiving test crashes.
- [ ] App Check enforced.
- [ ] Secrets rotated if any were ever exposed.
