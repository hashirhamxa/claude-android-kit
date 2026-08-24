# Implementation Checklist: Biometric Login Integration

- [ ] **1. Domain Contract (`:feature:auth:domain`)**
  - [ ] Define `BiometricAuthenticator` interface in `domain.repository`
  - [ ] Add `AuthUiIntent.AuthenticateBiometric` to `AuthContract.kt`
- [ ] **2. Data Implementation (`:feature:auth:data`)**
  - [ ] Create `expect/actual` `BiometricAuthenticatorImpl`
  - [ ] Implement Android `BiometricPrompt` handler
  - [ ] Implement iOS `LAContext` evaluation
- [ ] **3. UI & ViewModel (`:feature:auth:ui`)**
  - [ ] Update `AuthViewModel` to handle `AuthenticateBiometric`
  - [ ] Update Compose screen with biometric login button
  - [ ] Update SwiftUI `AuthContentView` with Face ID prompt
- [ ] **4. Testing & Verification**
  - [ ] Add unit test in `commonTest` asserting state transition on biometric success
  - [ ] Run `python tools/verify_architecture.py`
  - [ ] Run `./gradlew testDebugUnitTest`
