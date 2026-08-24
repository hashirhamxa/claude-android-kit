package com.kit.core.database

import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.driver.bundled.BundledSQLiteDriver
import platform.Foundation.NSDocumentDirectory
import platform.Foundation.NSFileManager
import platform.Foundation.NSUserDomainMask

class IosDatabaseBuilderFactory : DatabaseBuilderFactory {
    override fun createBuilder(): RoomDatabase.Builder<AppDatabase> {
        val documentDirectory = NSFileManager.defaultManager.URLForDirectory(
            directory = NSDocumentDirectory,
            inDomain = NSUserDomainMask,
            appropriateForURL = null,
            create = false,
            error = null
        )
        val dbFilePath = (documentDirectory?.path ?: "") + "/app_database.db"
        return Room.databaseBuilder<AppDatabase>(
            name = dbFilePath,
            factory = { AppDatabaseConstructor.initialize() }
        ).setDriver(BundledSQLiteDriver())
    }
}
