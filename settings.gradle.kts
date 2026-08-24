pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

rootProject.name = "claude-android-kit"

includeBuild("build-logic")

include(":core:network")
include(":core:database")
include(":core:designsystem")

include(":feature:auth:domain")
include(":feature:auth:data")
include(":feature:auth:ui")

include(":composeApp")
