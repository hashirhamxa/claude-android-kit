<!-- Derived from rules/05-testing.md during Phase 1 split.
     Extends rules/common/testing.md — install common/ alongside this file -->
# Testing

## Test doubles

- **Mockative for KMP** if you really need mocks in commonTest.

## Repository tests

- Test against a `TestDriver` in SQLDelight.
- Test every DAO query — these silently break on schema migrations.
- Test every migration explicitly if you have more than one.

## Structure

In KMP:

```
shared/src/commonTest/     # Multiplatform unit tests
shared/src/androidTest/    # Android-only unit tests
shared/src/iosTest/        # iOS-only unit tests
```
