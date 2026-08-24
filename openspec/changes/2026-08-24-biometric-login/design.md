# Technical Design: Biometric Login Integration

## 1. Module Impact
- Affected Modules: `:feature:auth:domain`, `:feature:auth:data`, `:feature:auth:ui`

## 2. Contracts & State Models

### UI State Updates (`:feature:auth:ui`)
```kotlin
sealed interface AuthUiState {
    data object Loading : AuthUiState
    data class Success(val items: List<AuthItem>) : AuthUiState
    data class BiometricPrompt(val title: String) : AuthUiState
    data class Error(val message: String) : AuthUiState
}
```

### UI Intents (`:feature:auth:ui`)
```kotlin
sealed interface AuthUiIntent {
    data object Refresh : AuthUiIntent
    data object AuthenticateBiometric : AuthUiIntent
    data class OnItemClicked(val id: String) : AuthUiIntent
}
```

### Biometric Authenticator Contract (`:feature:auth:domain`)
```kotlin
interface BiometricAuthenticator {
    suspend fun isBiometricAvailable(): Boolean
    suspend fun authenticate(): Result<Boolean>
}
```

## 3. Platform Execution Flow
```text
Compose / SwiftUI ──▶ AuthViewModel.onIntent(AuthenticateBiometric)
                             │
                             ▼
              BiometricAuthenticator (expect/actual)
              ├── Android: BiometricPrompt / ActivityResult
              └── iOS: LAContext.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)
```
