package com.kit.auth.data.repository

import com.kit.auth.domain.model.AuthItem
import com.kit.auth.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf

class AuthRepositoryImpl : AuthRepository {
    override fun getItems(): Flow<List<AuthItem>> = flowOf(
        listOf(AuthItem(id = "1", title = "Sample Auth"))
    )

    override suspend fun refresh(): Result<Unit> = Result.success(Unit)
}
