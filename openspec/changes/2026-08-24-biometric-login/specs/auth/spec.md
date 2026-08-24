# Delta Spec: Authentication (Biometric Support)

## ADDED Requirements

### Requirement: Biometric Authentication Trigger
The system MUST provide a biometric authentication flow triggered via `AuthUiIntent.AuthenticateBiometric`.

#### Scenario: Biometric Hardware Available & Authenticated
- **GIVEN** the device supports biometric authentication (Fingerprint / Face ID)
- **WHEN** the user triggers `AuthUiIntent.AuthenticateBiometric` and successfully authenticates
- **THEN** the ViewModel MUST emit `AuthUiState.Success`
- **AND** clear any active error states.

#### Scenario: Biometric Authentication Cancelled / Failed
- **GIVEN** the biometric prompt is presented to the user
- **WHEN** the biometric scan fails or is dismissed
- **THEN** the ViewModel MUST emit `AuthUiState.Error("Biometric authentication failed")`.
