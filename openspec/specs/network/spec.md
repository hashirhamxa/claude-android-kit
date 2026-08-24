# Spec: Core Network Client

## 1. Scope & Domain
Maps to `:core:network` module across Android and iOS.

## 2. Requirements

### Requirement: Engine Isolation
The network client MUST isolate platform engines (`OkHttp` for Android, `Darwin` for iOS) behind `HttpClientFactory.create()`.

#### Scenario: Android HTTP Request
- **GIVEN** an HTTP request initiated from Android
- **WHEN** the request is dispatched
- **THEN** the request MUST execute through `io.ktor.client.engine.okhttp.OkHttp` with 15-second connect/read/write timeouts.

#### Scenario: iOS HTTP Request
- **GIVEN** an HTTP request initiated from iOS
- **WHEN** the request is dispatched
- **THEN** the request MUST execute through `io.ktor.client.engine.darwin.Darwin` with cellular access enabled.

### Requirement: Typed Serialization
All network payloads MUST be serialized and deserialized using `kotlinx.serialization` with `ignoreUnknownKeys = true` and `isLenient = true`.
