package com.kit.auth.domain.repository

import com.kit.auth.domain.model.AuthItem
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    fun getItems(): Flow<List<AuthItem>>
    suspend fun refresh(): Result<Unit>
}
