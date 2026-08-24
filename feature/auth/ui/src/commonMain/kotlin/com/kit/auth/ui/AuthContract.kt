package com.kit.auth.ui

import com.kit.auth.domain.model.AuthItem
import kotlinx.serialization.Serializable

// Type-Safe Navigation Route
@Serializable
data object AuthRoute

sealed interface AuthUiState {
    data object Loading : AuthUiState
    data class Success(val items: List<AuthItem>) : AuthUiState
    data class Error(val message: String) : AuthUiState
}

sealed interface AuthUiIntent {
    data object Refresh : AuthUiIntent
    data class OnItemClicked(val id: String) : AuthUiIntent
}

sealed interface AuthUiEffect {
    data class NavigateToDetails(val id: String) : AuthUiEffect
    data class ShowToast(val message: String) : AuthUiEffect
}
