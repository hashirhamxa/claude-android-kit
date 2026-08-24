plugins {
    `kotlin-dsl`
}

dependencies {
    compileOnly(libs.android.gradlePlugin)
    compileOnly(libs.kotlin.gradlePlugin)
    compileOnly(libs.compose.gradlePlugin)
}

gradlePlugin {
    plugins {
        register("kmpLibrary") {
            id = "kit.kmp.library"
            implementationClass = "KmpLibraryConventionPlugin"
        }
        register("kmpFeature") {
            id = "kit.kmp.feature"
            implementationClass = "KmpFeatureConventionPlugin"
        }
        register("androidApplication") {
            id = "kit.android.application"
            implementationClass = "AndroidApplicationConventionPlugin"
        }
    }
}
