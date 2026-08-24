#!/usr/bin/env python3
"""
Scaffolds a 3-tier KMP Feature (:domain, :data, :ui) adhering to kit conventions.
Usage: python tools/scaffold_feature.py <feature_name> [package_name]
Example: python tools/scaffold_feature.py auth com.kit
"""

import sys
import os
from pathlib import Path

# Ensure UTF-8 output across all platforms (Windows console support)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def create_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"  + Created: {path}")

def scaffold_feature(feature_raw: str, base_package: str = "com.kit"):
    feature = feature_raw.lower().replace("-", "_")
    pascal_name = "".join(word.capitalize() for word in feature.split("_"))
    pkg_path = base_package.replace(".", "/")
    
    base_dir = Path("feature") / feature
    print(f"\n🚀 Scaffolding Feature: :{feature} (Base: {base_package}.{feature})")

    # 1. Domain Module
    domain_dir = base_dir / "domain"
    create_file(domain_dir / "build.gradle.kts", """
plugins {
    id("kit.kmp.library")
}
""")
    create_file(
        domain_dir / "src/commonMain/kotlin" / pkg_path / feature / "domain/model" / f"{pascal_name}Item.kt",
        f"""package {base_package}.{feature}.domain.model

data class {pascal_name}Item(
    val id: String,
    val title: String
)
"""
    )
    create_file(
        domain_dir / "src/commonMain/kotlin" / pkg_path / feature / "domain/repository" / f"{pascal_name}Repository.kt",
        f"""package {base_package}.{feature}.domain.repository

import {base_package}.{feature}.domain.model.{pascal_name}Item
import kotlinx.coroutines.flow.Flow

interface {pascal_name}Repository {{
    fun getItems(): Flow<List<{pascal_name}Item>>
    suspend fun refresh(): Result<Unit>
}}
"""
    )

    # 2. Data Module
    data_dir = base_dir / "data"
    create_file(data_dir / "build.gradle.kts", f"""
plugins {{
    id("kit.kmp.library")
}}

kotlin {{
    sourceSets {{
        commonMain.dependencies {{
            implementation(project(":feature:{feature}:domain"))
            implementation(project(":core:network"))
            implementation(project(":core:database"))
        }}
    }}
}}
""")
    create_file(
        data_dir / "src/commonMain/kotlin" / pkg_path / feature / "data/repository" / f"{pascal_name}RepositoryImpl.kt",
        f"""package {base_package}.{feature}.data.repository

import {base_package}.{feature}.domain.model.{pascal_name}Item
import {base_package}.{feature}.domain.repository.{pascal_name}Repository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf

class {pascal_name}RepositoryImpl : {pascal_name}Repository {{
    override fun getItems(): Flow<List<{pascal_name}Item>> = flowOf(
        listOf({pascal_name}Item(id = "1", title = "Sample {pascal_name}"))
    )

    override suspend fun refresh(): Result<Unit> = Result.success(Unit)
}}
"""
    )

    # 3. UI Module (UDF + Compose Multiplatform)
    ui_dir = base_dir / "ui"
    create_file(ui_dir / "build.gradle.kts", f"""
plugins {{
    id("kit.kmp.feature")
}}

kotlin {{
    sourceSets {{
        commonMain.dependencies {{
            implementation(project(":feature:{feature}:domain"))
            implementation(project(":core:designsystem"))
        }}
    }}
}}
""")
    # Contract (UiState, UiIntent, UiEffect)
    create_file(
        ui_dir / "src/commonMain/kotlin" / pkg_path / feature / "ui" / f"{pascal_name}Contract.kt",
        f"""package {base_package}.{feature}.ui

import {base_package}.{feature}.domain.model.{pascal_name}Item
import kotlinx.serialization.Serializable

// Type-Safe Navigation Route
@Serializable
data object {pascal_name}Route

sealed interface {pascal_name}UiState {{
    data object Loading : {pascal_name}UiState
    data class Success(val items: List<{pascal_name}Item>) : {pascal_name}UiState
    data class Error(val message: String) : {pascal_name}UiState
}}

sealed interface {pascal_name}UiIntent {{
    data object Refresh : {pascal_name}UiIntent
    data class OnItemClicked(val id: String) : {pascal_name}UiIntent
}}

sealed interface {pascal_name}UiEffect {{
    data class NavigateToDetails(val id: String) : {pascal_name}UiEffect
    data class ShowToast(val message: String) : {pascal_name}UiEffect
}}
"""
    )
    # ViewModel
    create_file(
        ui_dir / "src/commonMain/kotlin" / pkg_path / feature / "ui" / f"{pascal_name}ViewModel.kt",
        f"""package {base_package}.{feature}.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import {base_package}.{feature}.domain.repository.{pascal_name}Repository
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class {pascal_name}ViewModel(
    private val repository: {pascal_name}Repository
) : ViewModel() {{

    private val _effects = Channel<{pascal_name}UiEffect>(Channel.BUFFERED)
    val effects: Flow<{pascal_name}UiEffect> = _effects.receiveAsFlow()

    val uiState: StateFlow<{pascal_name}UiState> = repository.getItems()
        .map<{pascal_name}Item, {pascal_name}UiState> {{ {pascal_name}UiState.Success(listOf(it)) }}
        .catch {{ emit({pascal_name}UiState.Error(it.message ?: "Unexpected error")) }}
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = {pascal_name}UiState.Loading
        )

    fun onIntent(intent: {pascal_name}UiIntent) {{
        when (intent) {{
            is {pascal_name}UiIntent.Refresh -> {{
                viewModelScope.launch {{ repository.refresh() }}
            }}
            is {pascal_name}UiIntent.OnItemClicked -> {{
                viewModelScope.launch {{
                    _effects.send({pascal_name}UiEffect.NavigateToDetails(intent.id))
                }}
            }}
        }}
    }}
}}
"""
    )
    # Screen Composable
    create_file(
        ui_dir / "src/commonMain/kotlin" / pkg_path / feature / "ui" / f"{pascal_name}Screen.kt",
        f"""package {base_package}.{feature}.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun {pascal_name}Screen(
    viewModel: {pascal_name}ViewModel,
    modifier: Modifier = Modifier
) {{
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Box(
        modifier = modifier
            .fillMaxSize()
            .safeDrawingPadding(),
        contentAlignment = Alignment.Center
    ) {{
        when (val s = state) {{
            is {pascal_name}UiState.Loading -> CircularProgressIndicator()
            is {pascal_name}UiState.Success -> Text(text = "Loaded: ${{s.items.size}} items")
            is {pascal_name}UiState.Error -> Text(text = "Error: ${{s.message}}")
        }}
    }}
}}
"""
    )
    print(f"\n✅ Feature :{feature} scaffolded. Add to settings.gradle.kts:")
    print(f'   include(":feature:{feature}:domain")')
    print(f'   include(":feature:{feature}:data")')
    print(f'   include(":feature:{feature}:ui")\n')

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tools/scaffold_feature.py <feature_name> [package_name]")
        sys.exit(1)
    feature_arg = sys.argv[1]
    pkg_arg = sys.argv[2] if len(sys.argv) > 2 else "com.kit"
    scaffold_feature(feature_arg, pkg_arg)
