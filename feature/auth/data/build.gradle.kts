plugins {
    id("kit.kmp.library")
}

kotlin {
    sourceSets {
        commonMain.dependencies {
            implementation(project(":feature:auth:domain"))
            implementation(project(":core:network"))
            implementation(project(":core:database"))
        }
    }
}
