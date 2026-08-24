# Spec: Authentication & Session Management

## 1. Scope & Domain
Maps to `:feature:auth:domain`, `:feature:auth:data`, and `:feature:auth:ui`.

## 2. Requirements

### Requirement: User Authentication State
The system MUST model UI state as a single sealed interface (`Loading`, `Success`, `Error`).

#### Scenario: Initial Authentication Loading
- **GIVEN** the user launches the application
- **WHEN** authentication status is being queried
- **THEN** the ViewModel MUST emit `AuthUiState.Loading`
- **AND** the Compose/SwiftUI layer MUST display a progress indicator without blocking user interactions.

#### Scenario: Authentication Success
- **GIVEN** a valid authentication token exists
- **WHEN** user credentials or tokens are verified
- **THEN** the ViewModel MUST emit `AuthUiState.Success` containing the list of authenticated items.

### Requirement: Reactive Refresh Intent
The ViewModel MUST accept `AuthUiIntent.Refresh` and invoke `AuthRepository.refresh()`.

#### Scenario: User Triggers Refresh
- **GIVEN** the user is viewing the Auth screen
- **WHEN** the user taps the refresh action
- **THEN** the repository MUST fetch fresh credentials and update upstream flows.

### Requirement: Navigation Effect Dispatch
Navigation events MUST be single-fire effects dispatched through a buffered `Channel<AuthUiEffect>` and collected as a `Flow`.
