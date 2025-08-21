export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  hitRate: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  expiredEntries: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0
  };
  private cleanupInterval: NodeJS.Timeout;
  private maxEntries: number = 1000; // Maximum number of cache entries
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default TTL

  static getInstance(options?: {
    maxEntries?: number;
    defaultTTL?: number;
  }): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(options);
    }
    return CacheService.instance;
  }

  constructor(options?: {
    maxEntries?: number;
    defaultTTL?: number;
  }) {
    if (options?.maxEntries) {
      this.maxEntries = options.maxEntries;
    }
    if (options?.defaultTTL) {
      this.defaultTTL = options.defaultTTL;
    }

    // Clean up expired cache entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);

    console.log(`CacheService initialized with maxEntries: ${this.maxEntries}, defaultTTL: ${this.defaultTTL}ms`);
  }

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    // Check if we need to evict entries
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      timestamp: now,
      ttl,
      hits: 0,
      lastAccessed: now
    });

    console.log(`Cache set: ${key}, TTL: ${ttl}ms, Total entries: ${this.cache.size}`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry is expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.value as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    console.log(`Cache cleared: ${size} entries removed`);
  }

  // Get multiple keys at once
  getMany<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    
    for (const key of keys) {
      result[key] = this.get<T>(key);
    }
    
    return result;
  }

  // Set multiple keys at once
  setMany<T>(entries: Record<string, { value: T; ttl?: number }>): void {
    for (const [key, entry] of Object.entries(entries)) {
      this.set(key, entry.value, entry.ttl);
    }
  }

  // Get or set pattern - useful for memoization
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  // Get cache statistics
  getStats(): CacheStats {
    const now = Date.now();
    let memoryUsage = 0;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache.entries()) {
      // Calculate memory usage (rough estimate)
      memoryUsage += JSON.stringify(entry).length + key.length;

      // Track oldest and newest entries
      if (oldestEntry === null || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      if (newestEntry === null || entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }

      // Count expired entries
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      }
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      memoryUsage,
      hitRate,
      oldestEntry,
      newestEntry,
      expiredEntries
    };
  }

  // Get entries by pattern (useful for cache invalidation)
  getKeysByPattern(pattern: RegExp): string[] {
    const keys: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  // Delete entries by pattern
  deleteByPattern(pattern: RegExp): number {
    const keysToDelete = this.getKeysByPattern(pattern);
    let deletedCount = 0;
    
    for (const key of keysToDelete) {
      if (this.delete(key)) {
        deletedCount++;
      }
    }
    
    console.log(`Deleted ${deletedCount} entries matching pattern: ${pattern}`);
    return deletedCount;
  }

  // Evict least recently used entries
  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Find the least recently used entry
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
      console.log(`LRU eviction: removed ${lruKey}`);
    }
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  // Get entry information for debugging
  getEntryInfo(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;
    const timeToLive = Math.max(0, entry.ttl - (now - entry.timestamp));

    return {
      ...entry,
      // Add computed properties
      isExpired,
      timeToLive,
      age: now - entry.timestamp
    } as any;
  }

  // Reset statistics
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    console.log('Cache statistics reset');
  }

  // Destroy the cache service
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    console.log('CacheService destroyed');
  }

  // Utility: Create a namespaced cache
  namespace(namespace: string): {
    get: <T>(key: string) => T | null;
    set: <T>(key: string, value: T, ttl?: number) => void;
    has: (key: string) => boolean;
    delete: (key: string) => boolean;
    clear: () => void;
  } {
    const namespacedKey = (key: string) => `${namespace}:${key}`;

    return {
      get: <T>(key: string) => this.get<T>(namespacedKey(key)),
      set: <T>(key: string, value: T, ttl?: number) => this.set(namespacedKey(key), value, ttl),
      has: (key: string) => this.has(namespacedKey(key)),
      delete: (key: string) => this.delete(namespacedKey(key)),
      clear: () => this.deleteByPattern(new RegExp(`^${namespace}:`))
    };
  }
}

// Export a singleton instance for easy use
export const cacheService = CacheService.getInstance();