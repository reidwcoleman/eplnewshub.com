/**
 * FPL Advanced Caching Service
 * Multi-layer caching with memory, IndexedDB, and localStorage fallback
 */

class FPLCacheService {
    constructor() {
        this.memoryCache = new Map();
        this.cacheVersion = 'v1.0.0';
        this.dbName = 'FPLAnalyzerCache';
        this.db = null;
        this.config = {
            maxMemoryItems: 100,
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            maxStorageSize: 50 * 1024 * 1024, // 50MB
            compressionEnabled: true
        };
        this.cacheStats = {
            hits: 0,
            misses: 0,
            writes: 0,
            evictions: 0
        };
        
        this.init();
    }

    /**
     * Initialize cache service
     */
    async init() {
        // Initialize IndexedDB
        await this.initIndexedDB();
        
        // Clean up old cache periodically
        this.startCacheCleanup();
        
        // Monitor storage quota
        this.monitorStorageQuota();
        
        // Set up cache warming
        this.warmCache();
    }

    /**
     * Initialize IndexedDB with proper error handling
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                this.fallbackToLocalStorage = true;
                resolve();
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create cache store
                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                    cacheStore.createIndex('category', 'category', { unique: false });
                    cacheStore.createIndex('size', 'size', { unique: false });
                }
                
                // Create metadata store
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Multi-layer cache get
     */
    async get(key, options = {}) {
        const startTime = performance.now();
        
        // 1. Check memory cache first (fastest)
        const memoryResult = this.getFromMemory(key);
        if (memoryResult !== null) {
            this.cacheStats.hits++;
            this.logPerformance('memory-hit', performance.now() - startTime);
            return memoryResult;
        }
        
        // 2. Check IndexedDB (persistent)
        const dbResult = await this.getFromIndexedDB(key);
        if (dbResult !== null) {
            // Promote to memory cache
            this.setInMemory(key, dbResult);
            this.cacheStats.hits++;
            this.logPerformance('db-hit', performance.now() - startTime);
            return dbResult;
        }
        
        // 3. Check localStorage fallback
        if (this.fallbackToLocalStorage) {
            const localResult = this.getFromLocalStorage(key);
            if (localResult !== null) {
                this.cacheStats.hits++;
                this.logPerformance('localStorage-hit', performance.now() - startTime);
                return localResult;
            }
        }
        
        this.cacheStats.misses++;
        this.logPerformance('cache-miss', performance.now() - startTime);
        return null;
    }

    /**
     * Multi-layer cache set
     */
    async set(key, value, options = {}) {
        const startTime = performance.now();
        const ttl = options.ttl || this.config.defaultTTL;
        const category = options.category || 'general';
        const priority = options.priority || 0;
        
        // Prepare cache entry
        const entry = {
            key,
            value,
            timestamp: Date.now(),
            expires: Date.now() + ttl,
            category,
            priority,
            size: this.getSize(value),
            compressed: false
        };
        
        // Compress if enabled and data is large
        if (this.config.compressionEnabled && entry.size > 1024) {
            entry.value = await this.compress(value);
            entry.compressed = true;
        }
        
        // 1. Set in memory cache
        this.setInMemory(key, entry);
        
        // 2. Set in IndexedDB asynchronously
        this.setInIndexedDB(entry).catch(error => {
            console.error('IndexedDB write error:', error);
            
            // 3. Fallback to localStorage for critical data
            if (options.critical) {
                this.setInLocalStorage(key, entry);
            }
        });
        
        this.cacheStats.writes++;
        this.logPerformance('cache-write', performance.now() - startTime);
    }

    /**
     * Get from memory cache
     */
    getFromMemory(key) {
        const entry = this.memoryCache.get(key);
        
        if (!entry) return null;
        
        // Check expiration
        if (entry.expires < Date.now()) {
            this.memoryCache.delete(key);
            return null;
        }
        
        // Update access time for LRU
        entry.lastAccess = Date.now();
        
        return entry.compressed ? this.decompress(entry.value) : entry.value;
    }

    /**
     * Set in memory cache with LRU eviction
     */
    setInMemory(key, entry) {
        // Check memory limit
        if (this.memoryCache.size >= this.config.maxMemoryItems) {
            this.evictFromMemory();
        }
        
        this.memoryCache.set(key, {
            ...entry,
            lastAccess: Date.now()
        });
    }

    /**
     * Evict least recently used items from memory
     */
    evictFromMemory() {
        const entries = Array.from(this.memoryCache.entries());
        
        // Sort by last access time and priority
        entries.sort((a, b) => {
            if (a[1].priority !== b[1].priority) {
                return a[1].priority - b[1].priority; // Lower priority evicted first
            }
            return a[1].lastAccess - b[1].lastAccess; // LRU
        });
        
        // Evict 20% of cache
        const evictCount = Math.ceil(this.config.maxMemoryItems * 0.2);
        
        for (let i = 0; i < evictCount; i++) {
            if (entries[i]) {
                this.memoryCache.delete(entries[i][0]);
                this.cacheStats.evictions++;
            }
        }
    }

    /**
     * Get from IndexedDB
     */
    async getFromIndexedDB(key) {
        if (!this.db) return null;
        
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['cache'], 'readonly');
                const store = transaction.objectStore('cache');
                const request = store.get(key);
                
                request.onsuccess = () => {
                    const entry = request.result;
                    
                    if (!entry) {
                        resolve(null);
                        return;
                    }
                    
                    // Check expiration
                    if (entry.expires < Date.now()) {
                        this.deleteFromIndexedDB(key);
                        resolve(null);
                        return;
                    }
                    
                    resolve(entry.compressed ? this.decompress(entry.value) : entry.value);
                };
                
                request.onerror = () => {
                    console.error('IndexedDB read error:', request.error);
                    resolve(null);
                };
            } catch (error) {
                console.error('IndexedDB transaction error:', error);
                resolve(null);
            }
        });
    }

    /**
     * Set in IndexedDB
     */
    async setInIndexedDB(entry) {
        if (!this.db) return;
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['cache'], 'readwrite');
                const store = transaction.objectStore('cache');
                const request = store.put(entry);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Delete from IndexedDB
     */
    async deleteFromIndexedDB(key) {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.delete(key);
    }

    /**
     * Get from localStorage fallback
     */
    getFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(`fpl_cache_${key}`);
            if (!item) return null;
            
            const entry = JSON.parse(item);
            
            // Check expiration
            if (entry.expires < Date.now()) {
                localStorage.removeItem(`fpl_cache_${key}`);
                return null;
            }
            
            return entry.value;
        } catch (error) {
            console.error('localStorage read error:', error);
            return null;
        }
    }

    /**
     * Set in localStorage fallback
     */
    setInLocalStorage(key, entry) {
        try {
            // Limit localStorage usage
            const simplified = {
                value: entry.value,
                expires: entry.expires
            };
            
            localStorage.setItem(`fpl_cache_${key}`, JSON.stringify(simplified));
        } catch (error) {
            console.error('localStorage write error:', error);
            
            // Clear old entries if quota exceeded
            if (error.name === 'QuotaExceededError') {
                this.clearLocalStorage();
            }
        }
    }

    /**
     * Clear localStorage cache
     */
    clearLocalStorage() {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(k => k.startsWith('fpl_cache_'));
        
        // Remove oldest half of cache entries
        const toRemove = cacheKeys.slice(0, Math.ceil(cacheKeys.length / 2));
        toRemove.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Batch get multiple keys
     */
    async getMany(keys) {
        const results = await Promise.all(
            keys.map(key => this.get(key))
        );
        
        return keys.reduce((acc, key, index) => {
            acc[key] = results[index];
            return acc;
        }, {});
    }

    /**
     * Batch set multiple key-value pairs
     */
    async setMany(entries, options = {}) {
        await Promise.all(
            Object.entries(entries).map(([key, value]) => 
                this.set(key, value, options)
            )
        );
    }

    /**
     * Clear all cache layers
     */
    async clear(category = null) {
        // Clear memory cache
        if (category) {
            for (const [key, entry] of this.memoryCache.entries()) {
                if (entry.category === category) {
                    this.memoryCache.delete(key);
                }
            }
        } else {
            this.memoryCache.clear();
        }
        
        // Clear IndexedDB
        if (this.db) {
            await this.clearIndexedDB(category);
        }
        
        // Clear localStorage
        this.clearLocalStorage();
        
        console.log(`Cache cleared${category ? ` for category: ${category}` : ''}`);
    }

    /**
     * Clear IndexedDB cache
     */
    async clearIndexedDB(category = null) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            
            if (category) {
                const index = store.index('category');
                const request = index.openCursor(IDBKeyRange.only(category));
                
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        store.delete(cursor.primaryKey);
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
            } else {
                store.clear();
                resolve();
            }
        });
    }

    /**
     * Warm cache with critical data
     */
    async warmCache() {
        const criticalKeys = [
            'bootstrap-static',
            'current-gameweek',
            'top-players'
        ];
        
        // Pre-fetch critical data
        for (const key of criticalKeys) {
            const cached = await this.get(key);
            if (!cached) {
                // Fetch and cache if not present
                console.log(`Warming cache: ${key}`);
            }
        }
    }

    /**
     * Start periodic cache cleanup
     */
    startCacheCleanup() {
        // Run cleanup every 5 minutes
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000);
        
        // Initial cleanup
        this.cleanupExpiredEntries();
    }

    /**
     * Clean up expired entries
     */
    async cleanupExpiredEntries() {
        const now = Date.now();
        let cleaned = 0;
        
        // Clean memory cache
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.expires < now) {
                this.memoryCache.delete(key);
                cleaned++;
            }
        }
        
        // Clean IndexedDB
        if (this.db) {
            await this.cleanupIndexedDB();
        }
        
        if (cleaned > 0) {
            console.log(`Cleaned ${cleaned} expired cache entries`);
        }
    }

    /**
     * Clean up expired IndexedDB entries
     */
    async cleanupIndexedDB() {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const index = store.index('timestamp');
            const now = Date.now();
            
            const request = index.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.expires < now) {
                        store.delete(cursor.primaryKey);
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };
        });
    }

    /**
     * Monitor storage quota
     */
    async monitorStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const percentUsed = (estimate.usage / estimate.quota) * 100;
            
            console.log(`Storage used: ${(estimate.usage / 1024 / 1024).toFixed(2)}MB of ${(estimate.quota / 1024 / 1024).toFixed(2)}MB (${percentUsed.toFixed(2)}%)`);
            
            // Warn if storage is getting full
            if (percentUsed > 80) {
                console.warn('Storage quota above 80% - consider clearing cache');
                this.reduceCache();
            }
        }
    }

    /**
     * Reduce cache size when storage is full
     */
    async reduceCache() {
        // Clear non-critical categories first
        const nonCriticalCategories = ['images', 'temporary'];
        
        for (const category of nonCriticalCategories) {
            await this.clear(category);
        }
        
        // If still full, clear oldest 25% of all entries
        if (this.db) {
            await this.clearOldestEntries(0.25);
        }
    }

    /**
     * Clear oldest percentage of entries
     */
    async clearOldestEntries(percentage) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const index = store.index('timestamp');
            
            const entries = [];
            const request = index.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    entries.push(cursor.primaryKey);
                    cursor.continue();
                } else {
                    // Delete oldest entries
                    const deleteCount = Math.ceil(entries.length * percentage);
                    for (let i = 0; i < deleteCount; i++) {
                        store.delete(entries[i]);
                    }
                    resolve();
                }
            };
        });
    }

    /**
     * Compress data for storage
     */
    async compress(data) {
        // Simple compression using JSON string and base64
        const jsonString = JSON.stringify(data);
        
        // For larger data, you could use a compression library
        if (jsonString.length > 10000) {
            // Implement actual compression here
            return btoa(jsonString);
        }
        
        return jsonString;
    }

    /**
     * Decompress data from storage
     */
    decompress(data) {
        try {
            // Try parsing as JSON first
            return JSON.parse(data);
        } catch {
            // Try base64 decode
            try {
                return JSON.parse(atob(data));
            } catch {
                return data;
            }
        }
    }

    /**
     * Get size of data in bytes
     */
    getSize(data) {
        const str = JSON.stringify(data);
        return new Blob([str]).size;
    }

    /**
     * Log performance metrics
     */
    logPerformance(operation, duration) {
        if (duration > 100) {
            console.warn(`Slow cache operation: ${operation} took ${duration.toFixed(2)}ms`);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100;
        
        return {
            ...this.cacheStats,
            hitRate: hitRate.toFixed(2) + '%',
            memorySize: this.memoryCache.size,
            performance: {
                averageReadTime: this.averageReadTime || 0,
                averageWriteTime: this.averageWriteTime || 0
            }
        };
    }

    /**
     * Export cache for debugging
     */
    async exportCache() {
        const data = {
            version: this.cacheVersion,
            timestamp: Date.now(),
            memory: Array.from(this.memoryCache.entries()),
            stats: this.getStats()
        };
        
        // Add IndexedDB data if available
        if (this.db) {
            data.persistent = await this.exportIndexedDB();
        }
        
        return data;
    }

    /**
     * Export IndexedDB data
     */
    async exportIndexedDB() {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve([]);
        });
    }

    /**
     * Import cache data
     */
    async importCache(data) {
        if (data.version !== this.cacheVersion) {
            console.warn('Cache version mismatch');
        }
        
        // Import memory cache
        if (data.memory) {
            this.memoryCache.clear();
            data.memory.forEach(([key, value]) => {
                this.memoryCache.set(key, value);
            });
        }
        
        // Import persistent cache
        if (data.persistent && this.db) {
            await this.importIndexedDB(data.persistent);
        }
        
        console.log('Cache imported successfully');
    }

    /**
     * Import IndexedDB data
     */
    async importIndexedDB(data) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        
        for (const entry of data) {
            store.put(entry);
        }
    }
}

// Create singleton instance
const fplCache = new FPLCacheService();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPLCacheService;
}