<!-- Derived from rules/06-security.md during Phase 1 split.
     Platform-specific security rules: rules/android/security.md and rules/kmp/security.md -->
# Security

Mandatory. Applies to every project regardless of stage.

## Secrets never land in source

- API keys, Firebase config, Supabase anon key (even though "public"), third-party SDK keys, OAuth client secrets — none of these in `git`.
- `local.properties` for local dev secrets. It's already in `.gitignore`.
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
- Separate Firebase projects for dev / staging / prod. Never share a project across environments.
- App Check on production builds. Play Integrity on Android, DeviceCheck/AppAttest on iOS.

## Network

- Ktor client with `Logging` plugin at `LogLevel.HEADERS` in debug, **`LogLevel.NONE` in release**. Never log request bodies in release.
- Certificate pinning for backend calls in production builds.

## Dependency hygiene

- `./gradlew dependencyUpdates` monthly. CVE-affected libs bumped immediately.
- `gradle-versions-plugin` + `dependency-check-gradle` in CI.
- Review new dependencies: who publishes, how active, what permissions they need.

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
