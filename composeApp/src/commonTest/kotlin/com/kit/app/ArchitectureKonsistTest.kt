package com.kit.app

import com.lemonappdev.konsist.api.Konsist
import com.lemonappdev.konsist.api.ext.list.withAnnotationOf
import com.lemonappdev.konsist.api.ext.list.withNameEndingWith
import com.lemonappdev.konsist.api.ext.list.withoutName
import com.lemonappdev.konsist.api.verify.assertFalse
import com.lemonappdev.konsist.api.verify.assertTrue
import kotlin.test.Test

class ArchitectureKonsistTest {

    @Test
    fun `commonMain source set must have zero android SDK imports`() {
        Konsist
            .scopeFromProduction()
            .files
            .filter { it.path.contains("commonMain") }
            .imports
            .assertFalse(
                additionalMessage = "Domain & commonMain code must be 100% pure Kotlin with zero Android SDK dependencies."
            ) {
                it.name.startsWith("android.") ||
                it.name == "androidx.compose.ui.platform.LocalContext"
            }
    }

    @Test
    fun `composable functions must not import heavy IPC or IO classes`() {
        Konsist
            .scopeFromProduction()
            .files
            .filter { it.hasFunction { func -> func.hasAnnotation { anno -> anno.name == "Composable" } } }
            .imports
            .assertFalse(
                additionalMessage = "Heavy I/O & IPC (PackageManager, BitmapFactory) are banned in Compose UI files. Offload to Repository/Cache."
            ) {
                it.name.startsWith("android.content.pm.PackageManager") ||
                it.name.startsWith("android.graphics.BitmapFactory")
            }
    }

    @Test
    fun `ui state models must be immutable data class or sealed interface`() {
        Konsist
            .scopeFromProduction()
            .classes
            .withNameEndingWith("UiState")
            .properties()
            .assertFalse(
                additionalMessage = "UiState fields must be strictly read-only (val). Mutable var properties are prohibited."
            ) {
                it.hasVarModifier
            }
    }

    @Test
    fun `viewmodels must not directly reference DAOs or network HTTP clients`() {
        Konsist
            .scopeFromProduction()
            .classes
            .withNameEndingWith("ViewModel")
            .imports
            .assertFalse(
                additionalMessage = "ViewModels must only depend on Domain UseCases or Repositories. Direct DAO and HttpClient references are banned."
            ) {
                it.name.endsWith("Dao") ||
                it.name.endsWith("HttpClient") ||
                it.name.contains(".data.source.")
            }
    }

    @Test
    fun `viewmodels must not expose public mutable StateFlow or SharedFlow`() {
        Konsist
            .scopeFromProduction()
            .classes
            .withNameEndingWith("ViewModel")
            .properties()
            .assertFalse(
                additionalMessage = "ViewModels must only expose read-only StateFlow or Flow. Never expose MutableStateFlow."
            ) {
                it.type?.name?.contains("MutableStateFlow") == true ||
                it.type?.name?.contains("MutableSharedFlow") == true
            }
    }

    @Test
    fun `domain layer must not depend on data layer`() {
        Konsist
            .scopeFromProduction()
            .files
            .filter { it.path.contains("domain") }
            .imports
            .assertFalse(
                additionalMessage = "Clean Architecture Boundary: Domain layer must never import or reference Data layer classes."
            ) {
                it.name.contains(".data.")
            }
    }

    @Test
    fun `repository interfaces must reside inside domain package`() {
        Konsist
            .scopeFromProduction()
            .interfaces
            .withNameEndingWith("Repository")
            .assertTrue(
                additionalMessage = "Repository interfaces must be declared inside the domain.repository package."
            ) {
                it.resideInPackage("..domain.repository..")
            }
    }

    @Test
    fun `repository implementations must reside inside data package`() {
        Konsist
            .scopeFromProduction()
            .classes
            .withNameEndingWith("RepositoryImpl")
            .assertTrue(
                additionalMessage = "Repository implementations must be declared inside the data.repository package."
            ) {
                it.resideInPackage("..data.repository..")
            }
    }
}
