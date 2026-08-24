package com.kit.core.testing

import com.lemonappdev.konsist.api.Konsist
import com.lemonappdev.konsist.api.ext.list.withNameEndingWith
import com.lemonappdev.konsist.api.verify.assertFalse
import com.lemonappdev.konsist.api.verify.assertTrue
import kotlin.test.Test

/**
 * Reusable Core Architecture Verification Suite using Konsist.
 */
class ArchitectureTest {

    @Test
    fun `commonMain must be pure Kotlin without Android SDK imports`() {
        Konsist.scopeFromProduction().files
            .filter { it.path.contains("commonMain") }
            .imports
            .assertFalse("Domain & commonMain code must be 100% pure Kotlin.") {
                it.name.startsWith("android.") || it.name.contains("LocalContext")
            }
    }

    @Test
    fun `composables must not import heavy IPC or IO classes`() {
        Konsist.scopeFromProduction().files
            .filter { it.hasFunction { func -> func.hasAnnotation { a -> a.name == "Composable" } } }
            .imports
            .assertFalse("Heavy IPC/I/O banned in Compose. Offload to Repository.") {
                it.name.startsWith("android.content.pm.PackageManager") ||
                it.name.startsWith("android.graphics.BitmapFactory")
            }
    }

    @Test
    fun `viewmodels cannot reference DAOs or network clients directly`() {
        Konsist.scopeFromProduction().classes
            .withNameEndingWith("ViewModel")
            .imports
            .assertFalse("ViewModels must only depend on Domain repositories/usecases.") {
                it.name.endsWith("Dao") || it.name.endsWith("HttpClient")
            }
    }
}
