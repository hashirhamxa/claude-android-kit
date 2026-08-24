package com.kit.core.database

import androidx.room.RoomDatabase

interface DatabaseBuilderFactory {
    fun createBuilder(): RoomDatabase.Builder<AppDatabase>
}
