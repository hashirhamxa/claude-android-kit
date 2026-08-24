package com.kit.core.cache

import androidx.collection.LruCache
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Thread-safe, coroutine-aware in-memory LRU cache wrapper for Bitmaps, Drawables, and heavy UI assets.
 * Uses Mutex to prevent duplicate parallel decoding/fetches for the same key.
 */
class MemoryAssetCache<K : Any, V : Any>(
    maxSize: Int = 100
) {
    private val lruCache = LruCache<K, V>(maxSize)
    private val mutex = Mutex()

    fun get(key: K): V? {
        return lruCache.get(key)
    }

    fun put(key: K, value: V) {
        lruCache.put(key, value)
    }

    /**
     * Retrieves the cached value or computes it atomically off the main thread if absent.
     */
    suspend fun getOrPut(key: K, producer: suspend () -> V?): V? {
        // Fast path: cached value exists
        lruCache.get(key)?.let { return it }

        return mutex.withLock {
            // Double check inside lock
            lruCache.get(key)?.let { return it }

            val computed = producer()
            if (computed != null) {
                lruCache.put(key, computed)
            }
            computed
        }
    }

    fun remove(key: K): V? {
        return lruCache.remove(key)
    }

    fun clear() {
        lruCache.evictAll()
    }
}
