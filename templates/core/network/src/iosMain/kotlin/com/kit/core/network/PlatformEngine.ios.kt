package com.kit.core.network

import io.ktor.client.engine.HttpClientEngine
import io.ktor.client.engine.darwin.Darwin

actual fun createPlatformHttpClientEngine(): HttpClientEngine {
    return Darwin.create {
        configureRequest {
            setAllowsCellularAccess(true)
        }
    }
}
