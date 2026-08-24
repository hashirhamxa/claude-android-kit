# Kotlin Multiplatform (KMP) Guidelines

## 1. Official AndroidX Multiplatform Artifacts
Always prefer official `androidx` KMP artifacts over third-party alternatives:
- **ViewModel:** `androidx.lifecycle:lifecycle-viewmodel`
- **Database:** `androidx.room:room-runtime` & `androidx.room:room-compiler`
- **Preferences:** `androidx.datastore:datastore-preferences`
- **Paging:** `androidx.paging:paging-common`

## 2. Networking & Engines (Ktor 3.x)
Standardize all HTTP network calls on **Ktor 3.x** using platform-tailored engines:
- **`androidMain`:** `OkHttp` engine (`io.ktor:ktor-client-okhttp`).
- **`iosMain`:** `Darwin` engine (`io.ktor:ktor-client-darwin`) configured with certificate pinning and ATS (App Transport Security) compliance.

```kotlin
// commonMain
expect fun createHttpClientEngine(): HttpClientEngine

// androidMain
actual fun createHttpClientEngine(): HttpClientEngine = OkHttp.create {
    config {
        retryOnConnectionFailure(true)
    }
}

// iosMain
actual fun createHttpClientEngine(): HttpClientEngine = Darwin.create {
    configureRequest {
        setAllowsCellularAccess(true)
    }
}
```

## 3. Database: Room 3 KMP
- Standardize local relational persistence on **Room 3 KMP**.
- Instantiate Room databases using `BundledSQLiteDriver` in `commonMain` to guarantee identical SQLite engine behavior across Android and iOS.

```kotlin
fun getRoomDatabase(builder: RoomDatabase.Builder<AppDatabase>): AppDatabase {
    return builder
        .setDriver(BundledSQLiteDriver())
        .setQueryCoroutineContext(Dispatchers.IO)
        .build()
}
```

## 4. Multiplatform Boundaries & `expect` / `actual` Policy
- **Strict Limitation:** `expect`/`actual` declarations are restricted exclusively to platform-specific system APIs (file system paths, biometrics, secure enclave / KeyStore, clipboard, hardware sensors).
- **Pure Common Logic:** Business logic, validation, data transformation, and use cases must reside entirely in `commonMain` as pure Kotlin with no platform dependencies.
