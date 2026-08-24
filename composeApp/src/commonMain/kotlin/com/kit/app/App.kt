package com.kit.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.kit.auth.ui.AuthRoute
import com.kit.auth.ui.AuthScreen
import com.kit.auth.ui.AuthViewModel
import com.kit.core.designsystem.AppTheme
import org.koin.compose.viewmodel.koinViewModel

@Composable
fun App() {
    AppTheme {
        val navController = rememberNavController()

        NavHost(
            navController = navController,
            startDestination = AuthRoute,
            modifier = Modifier.fillMaxSize()
        ) {
            composable<AuthRoute> {
                val viewModel: AuthViewModel = koinViewModel()
                AuthScreen(
                    viewModel = viewModel,
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }
}
