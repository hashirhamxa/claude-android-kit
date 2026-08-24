package com.kit.core.network

import io.ktor.client.engine.HttpClientEngine
import io.ktor.client.engine.okhttp.OkHttp
import java.util.concurrent.TimeUnit

actual fun createPlatformHttpClientEngine(): HttpClientEngine {
    return OkHttp.create {
        config {
            connectTimeout(15, TimeUnit.SECONDS)
            readTimeout(15, TimeUnit.SECONDS)
            writeTimeout(15, TimeUnit.SECONDS)
            retryOnConnectionFailure(true)
        }
    }
}
