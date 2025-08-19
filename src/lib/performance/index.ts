// Performance Optimization Module
// Main entry point for all performance optimization services

// Import the actual service instances
import { performanceOptimizationService } from './performance-optimization';

// Direct imports for types only
export {
  type DatabasePerformanceMetrics,
  type QueryOptimizationResult,
  type IndexOptimizationResult,
  type CleanupResult,
  type SlowQuery,
  type IndexInfo,
  type UnusedIndex,
} from './database-optimization';

export {
  type CacheOptions,
  type CacheResult,
  type CacheSetResult,
  type CacheInvalidateResult,
  type CacheLayerResult,
  type CacheStats,
  type CacheLayerStats,
  type MemoryCacheConfig,
  type RedisCacheConfig,
  type CDNCacheConfig,
} from './caching-strategy';

export {
  type CacheWarmingConfig,
  type CacheWarmingStats,
} from './cache-warming';

export {
  type SystemMetrics,
  type ApplicationMetrics,
  type DatabaseMetrics,
  type CacheMetrics,
  type PerformanceAlert,
  type PerformanceDashboard,
} from './performance-monitoring';

export {
  type LoadTestConfig,
  type LoadTestEndpoint,
  type LoadTestResult,
  type LoadTestError,
  type SystemMetrics as LoadTestSystemMetrics,
  type LoadTestProgress,
} from './load-testing';

export {
  type PerformanceOptimizationConfig,
  type PerformanceOptimizationStatus,
} from './performance-optimization';

// Direct service exports with lazy loading
async function getDatabaseOptimizationService() {
  const mod = await import('./database-optimization');
  return mod.databaseOptimizationService;
}

async function getMultiLayerCachingStrategy() {
  const mod = await import('./caching-strategy');
  return mod.multiLayerCachingStrategy;
}

async function getCacheWarmingService() {
  const mod = await import('./cache-warming');
  return mod.cacheWarmingService;
}

async function getPerformanceMonitoringService() {
  const mod = await import('./performance-monitoring');
  return mod.performanceMonitoringService;
}

async function getLoadTestingService() {
  const mod = await import('./load-testing');
  return mod.loadTestingService;
}

// Export services
export { getDatabaseOptimizationService as databaseOptimizationService };
export { getMultiLayerCachingStrategy as multiLayerCachingStrategy };
export { getCacheWarmingService as cacheWarmingService };
export { getPerformanceMonitoringService as performanceMonitoringService };
export { getLoadTestingService as loadTestingService };

// Export the main performance optimization service directly
export { performanceOptimizationService };

// Re-export commonly used types
export type {
  DatabasePerformanceMetrics as PerformanceMetrics,
  CacheStats as CacheStatistics,
  PerformanceAlert as Alert,
  PerformanceDashboard as Dashboard,
  LoadTestResult as BenchmarkResult,
  LoadTestProgress as TestProgress,
};

// Utility functions
export const PerformanceUtils = {
  /**
   * Format milliseconds to human readable format
   */
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else if (ms < 3600000) {
      return `${(ms / 60000).toFixed(1)}m`;
    } else {
      return `${(ms / 3600000).toFixed(1)}h`;
    }
  },

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Format percentage with color coding
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  },

  /**
   * Calculate performance grade
   */
  calculatePerformanceGrade(metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  }): 'A' | 'B' | 'C' | 'D' | 'F' {
    const { responseTime, errorRate, throughput } = metrics;
    
    let score = 100;
    
    // Response time penalty (0-50 points)
    if (responseTime > 1000) score -= 50;
    else if (responseTime > 500) score -= 30;
    else if (responseTime > 200) score -= 15;
    else if (responseTime > 100) score -= 5;
    
    // Error rate penalty (0-30 points)
    if (errorRate > 10) score -= 30;
    else if (errorRate > 5) score -= 15;
    else if (errorRate > 2) score -= 5;
    else if (errorRate > 1) score -= 2;
    
    // Throughput bonus (0-20 points)
    if (throughput > 1000) score += 20;
    else if (throughput > 500) score += 15;
    else if (throughput > 100) score += 10;
    else if (throughput > 50) score += 5;
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },

  /**
   * Generate performance recommendations
   */
  generateRecommendations(metrics: {
    database: DatabasePerformanceMetrics;
    cache: CacheStats;
    system: SystemMetrics;
  }): string[] {
    const recommendations: string[] = [];
    
    const { database, cache, system } = metrics;
    
    // Database recommendations
    if (database.slowQueryCount > 5) {
      recommendations.push('Consider optimizing database queries and indexes');
    }
    
    if (database.indexUsageRatio < 80) {
      recommendations.push('Review and optimize database indexes');
    }
    
    if (database.cacheHitRatio < 90) {
      recommendations.push('Increase database cache size and optimize query patterns');
    }
    
    // Cache recommendations
    if (cache.overall.hitRate < 80) {
      recommendations.push('Optimize caching strategy and consider cache warming');
    }
    
    if (cache.memory.size > 1000) {
      recommendations.push('Consider increasing memory cache size or implementing LRU eviction');
    }
    
    // System recommendations
    if (system.cpu.usage > 80) {
      recommendations.push('High CPU usage detected - consider scaling or optimization');
    }
    
    if (system.memory.usage > 85) {
      recommendations.push('High memory usage detected - consider memory optimization');
    }
    
    if (system.disk.usage > 90) {
      recommendations.push('High disk usage detected - consider cleanup or storage expansion');
    }
    
    return recommendations;
  },
};

// Export utility functions individually
export const formatDuration = PerformanceUtils.formatDuration;
export const formatBytes = PerformanceUtils.formatBytes;
export const formatPercentage = PerformanceUtils.formatPercentage;
export const calculatePerformanceGrade = PerformanceUtils.calculatePerformanceGrade;

// Main initialization function
export async function initializePerformanceOptimization(): Promise<void> {
  try {
    console.log('🚀 Initializing Performance Optimization Module...');
    
    // Initialize the main performance optimization service
    await performanceOptimizationService.initialize();
    
    console.log('✅ Performance Optimization Module initialized successfully');
  } catch (error) {
    console.error('❌ Performance Optimization Module initialization failed:', error);
    throw error;
  }
}

// Export default for easy importing
const PerformanceOptimizationModule = {
  initializePerformanceOptimization,
  async getDatabaseOptimizationService() {
    return getDatabaseOptimizationService();
  },
  async getMultiLayerCachingStrategy() {
    return getMultiLayerCachingStrategy();
  },
  async getCacheWarmingService() {
    return getCacheWarmingService();
  },
  async getPerformanceMonitoringService() {
    return getPerformanceMonitoringService();
  },
  async getLoadTestingService() {
    return getLoadTestingService();
  },
  performanceOptimizationService,
  PerformanceUtils,
};

export default PerformanceOptimizationModule;