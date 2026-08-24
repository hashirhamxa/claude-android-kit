package com.kit.core.database

import android.content.Context
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.driver.bundled.BundledSQLiteDriver

class AndroidDatabaseBuilderFactory(private val context: Context) : DatabaseBuilderFactory {
    override fun createBuilder(): RoomDatabase.Builder<AppDatabase> {
        val appContext = context.applicationContext
        val dbFile = appContext.getDatabasePath("app_database.db")
        return Room.databaseBuilder<AppDatabase>(
            context = appContext,
            name = dbFile.absolutePath
        ).setDriver(BundledSQLiteDriver())
    }
}
