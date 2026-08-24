plugins {
    id("kit.kmp.library")
    alias(libs.plugins.androidx.room)
}

room {
    schemaDirectory("$projectDir/schemas")
}

kotlin {
    sourceSets {
        commonMain.dependencies {
            implementation(libs.bundles.room.kmp)
        }
    }
}
