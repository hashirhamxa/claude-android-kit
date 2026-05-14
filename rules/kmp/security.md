<!-- Derived from rules/06-security.md during Phase 1 split.
     Extends rules/common/security.md — install common/ alongside this file -->
# Security

## iOS (for KMP projects)

- `NSAppTransportSecurity` — no exceptions for ATS in release.
- Keychain for sensitive storage (`KeychainAccess` or direct `Security` framework).
- Entitlements reviewed before each release — no stale ones.
