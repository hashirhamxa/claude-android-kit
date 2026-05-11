// templates/screen-skeleton.kt
// Skeleton for a Screen + State + Event + ViewModel quartet.
// Matches Hash's Clean Architecture + MVVM + Manual DI conventions.
//
// File locations (replace <Feature> with the screen name, e.g. Login):
//   feature/<feature>/presentation/<Feature>Screen.kt
//   feature/<feature>/presentation/<Feature>ViewModel.kt
//   feature/<feature>/presentation/<Feature>State.kt
//   feature/<feature>/presentation/<Feature>Event.kt

// =====================================================================
// <Feature>State.kt
// =====================================================================
package <pkg>.feature.<feature>.presentation

import androidx.compose.runtime.Immutable

@Immutable
data class <Feature>State(
    val isLoading: Boolean = false,
    val error: String? = null,
    // TODO: add feature-specific fields
) {
    companion object {
        val Empty = <Feature>State()
    }
}


// =====================================================================
// <Feature>Event.kt
// =====================================================================
package <pkg>.feature.<feature>.presentation

sealed interface <Feature>Event {
    // TODO: add user intents
    // data class TextChanged(val text: String) : <Feature>Event
    // data object SubmitClicked : <Feature>Event
}


// =====================================================================
// <Feature>ViewModel.kt
// =====================================================================
package <pkg>.feature.<feature>.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class <Feature>ViewModel(
    // TODO: inject use-cases / repositories via AppContainer
) : ViewModel() {

    private val _state = MutableStateFlow(<Feature>State.Empty)
    val state: StateFlow<<Feature>State> = _state.asStateFlow()

    fun onEvent(event: <Feature>Event) {
        when (event) {
            // TODO: handle events
            else -> Unit
        }
    }
}


// =====================================================================
// <Feature>Screen.kt
// =====================================================================
package <pkg>.feature.<feature>.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import <pkg>.ui.theme.AppTheme
import <pkg>.ui.theme.Spacing

@Composable
fun <Feature>Route(
    viewModel: <Feature>ViewModel,
    onNavigateBack: () -> Unit,
) {
    val state by viewModel.state.collectAsState()
    <Feature>Screen(
        state = state,
        onEvent = viewModel::onEvent,
        onNavigateBack = onNavigateBack,
    )
}

@Composable
fun <Feature>Screen(
    state: <Feature>State,
    onEvent: (<Feature>Event) -> Unit,
    onNavigateBack: () -> Unit,
) {
    Scaffold { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = Spacing.lg, vertical = Spacing.md),
            verticalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            // TODO: build screen content here, matching the design tree from Phase 5
            Text("<Feature> screen — replace me")
        }
    }
}

@Preview
@Composable
private fun <Feature>ScreenPreview() {
    AppTheme {
        <Feature>Screen(
            state = <Feature>State.Empty,
            onEvent = {},
            onNavigateBack = {},
        )
    }
}
