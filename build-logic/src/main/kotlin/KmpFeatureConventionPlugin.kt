import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.VersionCatalogsExtension
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.getByType
import org.jetbrains.kotlin.gradle.dsl.KotlinMultiplatformExtension

class KmpFeatureConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) = with(target) {
        pluginManager.apply("kit.kmp.library")
        pluginManager.apply("org.jetbrains.compose")
        pluginManager.apply("org.jetbrains.kotlin.plugin.compose")
        pluginManager.apply("org.jetbrains.kotlin.plugin.serialization")

        val libs = extensions.getByType<VersionCatalogsExtension>().named("libs")

        extensions.configure<KotlinMultiplatformExtension> {
            sourceSets.apply {
                getByName("commonMain").dependencies {
                    implementation(libs.findBundle("lifecycle-compose").get())
                    implementation(libs.findBundle("koin-kmp").get())
                    implementation(libs.findLibrary("kotlinx-serialization-json").get())
                }
                getByName("commonTest").dependencies {
                    implementation(libs.findBundle("testing-common").get())
                }
            }
        }
    }
}
