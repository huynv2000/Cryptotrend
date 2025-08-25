/**
 * Incremental Cache Handler for Next.js
 * Optimized for Financial Dashboard Performance
 * 
 * This handler provides advanced caching strategies for financial data,
 * ensuring high-performance data retrieval and minimal latency.
 */

class IncrementalCacheHandler {
  constructor() {
    this.cache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };
  }

  /**
   * Get cached data with financial data optimization
   */
  async get(key) {
    this.cacheStats.totalRequests++;
    
    try {
      const cached = this.cache.get(key);
      
      if (cached) {
        // Check if cache is still valid
        if (Date.now() < cached.expiresAt) {
          this.cacheStats.hits++;
          return {
            value: cached.data,
            lastModified: cached.lastModified
          };
        } else {
          // Cache expired, evict it
          this.cache.delete(key);
          this.cacheStats.evictions++;
        }
      }
      
      this.cacheStats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Set cached data with TTL optimization for financial data
   */
  async set(key, data, options = {}) {
    try {
      const {
        ttl = 300000, // 5 minutes default
        tags = [],
        revalidate = false
      } = options;
      
      const cacheEntry = {
        data,
        expiresAt: Date.now() + ttl,
        lastModified: Date.now(),
        tags,
        revalidate
      };
      
      this.cache.set(key, cacheEntry);
      
      // Clean up old entries if cache is too large
      this.cleanupCache();
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Revalidate cached data
   */
  async revalidateTag(tag) {
    try {
      const keysToDelete = [];
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.tags && entry.tags.includes(tag)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.cacheStats.evictions++;
      });
      
      return true;
    } catch (error) {
      console.error('Cache revalidation error:', error);
      return false;
    }
  }

  /**
   * Clean up expired and old cache entries
   */
  cleanupCache() {
    const MAX_CACHE_SIZE = 1000; // Maximum number of entries
    const CLEANUP_THRESHOLD = 0.8; // Clean when 80% full
    
    if (this.cache.size > MAX_CACHE_SIZE * CLEANUP_THRESHOLD) {
      const now = Date.now();
      const entriesToDelete = [];
      
      // First, remove expired entries
      for (const [key, entry] of this.cache.entries()) {
        if (now >= entry.expiresAt) {
          entriesToDelete.push(key);
        }
      }
      
      // If still too many entries, remove oldest
      if (this.cache.size - entriesToDelete.length > MAX_CACHE_SIZE) {
        const entries = Array.from(this.cache.entries())
          .sort((a, b) => a[1].lastModified - b[1].lastModified);
        
        const remainingToDelete = MAX_CACHE_SIZE - (this.cache.size - entriesToDelete.length);
        for (let i = 0; i < remainingToDelete; i++) {
          entriesToDelete.push(entries[i][0]);
        }
      }
      
      // Delete marked entries
      entriesToDelete.forEach(key => {
        this.cache.delete(key);
        this.cacheStats.evictions++;
      });
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats() {
    const hitRate = this.cacheStats.totalRequests > 0 
      ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100 
      : 0;
    
    return {
      ...this.cacheStats,
      hitRate: hitRate.toFixed(2),
      cacheSize: this.cache.size,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  /**
   * Clear all cache entries
   */
  async reset() {
    this.cache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };
    return true;
  }
}

// Export singleton instance
const incrementalCacheHandler = new IncrementalCacheHandler();

module.exports = {
  async get(...args) {
    return await incrementalCacheHandler.get(...args);
  },
  
  async set(...args) {
    return await incrementalCacheHandler.set(...args);
  },
  
  async revalidateTag(...args) {
    return await incrementalCacheHandler.revalidateTag(...args);
  },
  
  async reset(...args) {
    return await incrementalCacheHandler.reset(...args);
  },
  
  getStats() {
    return incrementalCacheHandler.getStats();
  }
};