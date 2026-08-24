package com.kit.auth.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kit.auth.domain.repository.AuthRepository
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AuthViewModel(
    private val repository: AuthRepository
) : ViewModel() {

    private val _effects = Channel<AuthUiEffect>(Channel.BUFFERED)
    val effects: Flow<AuthUiEffect> = _effects.receiveAsFlow()

    val uiState: StateFlow<AuthUiState> = repository.getItems()
        .map<AuthItem, AuthUiState> { AuthUiState.Success(listOf(it)) }
        .catch { emit(AuthUiState.Error(it.message ?: "Unexpected error")) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = AuthUiState.Loading
        )

    fun onIntent(intent: AuthUiIntent) {
        when (intent) {
            is AuthUiIntent.Refresh -> {
                viewModelScope.launch { repository.refresh() }
            }
            is AuthUiIntent.OnItemClicked -> {
                viewModelScope.launch {
                    _effects.send(AuthUiEffect.NavigateToDetails(intent.id))
                }
            }
        }
    }
}
