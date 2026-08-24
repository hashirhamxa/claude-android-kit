package com.kit.core.database

import androidx.room.RoomDatabase

expect class DatabaseBuilderFactory {
    fun createBuilder(): RoomDatabase.Builder<AppDatabase>
}
