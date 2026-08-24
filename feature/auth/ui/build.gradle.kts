plugins {
    id("kit.kmp.feature")
}

kotlin {
    sourceSets {
        commonMain.dependencies {
            implementation(project(":feature:auth:domain"))
            implementation(project(":core:designsystem"))
        }
    }
}
