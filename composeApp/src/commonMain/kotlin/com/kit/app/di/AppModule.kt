package com.kit.app.di

import com.kit.auth.data.repository.AuthRepositoryImpl
import com.kit.auth.domain.repository.AuthRepository
import com.kit.auth.ui.AuthViewModel
import com.kit.core.network.HttpClientFactory
import com.kit.core.network.createPlatformHttpClientEngine
import org.koin.core.context.startKoin
import org.koin.core.module.Module
import org.koin.core.module.dsl.viewModelOf
import org.koin.dsl.KoinAppDeclaration
import org.koin.dsl.module

val coreModule = module {
    single {
        HttpClientFactory.create(
            engine = createPlatformHttpClientEngine(),
            baseUrl = "https://api.example.com"
        )
    }
}

val featureAuthModule = module {
    single<AuthRepository> { AuthRepositoryImpl() }
    viewModelOf(::AuthViewModel)
}

val appModules: List<Module> = listOf(
    coreModule,
    featureAuthModule
)

fun initKoin(appDeclaration: KoinAppDeclaration = {}) {
    startKoin {
        appDeclaration()
        modules(appModules)
    }
}
