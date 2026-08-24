# Spec: Core Multiplatform Database

## 1. Scope & Domain
Maps to `:core:database` module across Android and iOS.

## 2. Requirements

### Requirement: Unified Relational Storage
Local relational data MUST be managed by Room 3 KMP utilizing `androidx.sqlite.driver.bundled.BundledSQLiteDriver`.

#### Scenario: Android Database Instantiation
- **GIVEN** the application starts on an Android device
- **WHEN** `DatabaseBuilderFactory.createBuilder()` is invoked
- **THEN** it MUST build the database using the Android application context database directory.

#### Scenario: iOS Database Instantiation
- **GIVEN** the application starts on an iOS device
- **WHEN** `DatabaseBuilderFactory.createBuilder()` is invoked
- **THEN** it MUST resolve the sandboxed `NSDocumentDirectory` and initialize `AppDatabaseConstructor`.
