// Performance Optimization Integration Service
// Main integration service for all performance optimization components

// Lazy imports to avoid circular dependencies
let databaseOptimizationService: any;
let multiLayerCachingStrategy: any;
let cacheWarmingService: any;
let performanceMonitoringService: any;
let loadTestingService: any;

// Lazy initialization function
const getServices = async () => {
  if (!databaseOptimizationService) {
    // Use dynamic imports to avoid circular dependencies
    const dbModule = await import('./database-optimization');
    const cacheModule = await import('./caching-strategy');
    const warmingModule = await import('./cache-warming');
    const monitoringModule = await import('./performance-monitoring');
    const loadModule = await import('./load-testing');
    
    databaseOptimizationService = dbModule.databaseOptimizationService;
    multiLayerCachingStrategy = cacheModule.multiLayerCachingStrategy;
    cacheWarmingService = warmingModule.cacheWarmingService;
    performanceMonitoringService = monitoringModule.performanceMonitoringService;
    loadTestingService = loadModule.loadTestingService;
  }
  return {
    databaseOptimizationService,
    multiLayerCachingStrategy,
    cacheWarmingService,
    performanceMonitoringService,
    loadTestingService
  };
};

export interface PerformanceOptimizationConfig {
  database: {
    enabled: boolean;
    optimizationInterval: number; // minutes
    healthCheckInterval: number; // minutes
  };
  caching: {
    enabled: boolean;
    warming: {
      enabled: boolean;
      marketDataInterval: number;
      cryptoMetricsInterval: number;
      analysisDataInterval: number;
      sentimentDataInterval: number;
    };
  };
  monitoring: {
    enabled: boolean;
    metricsCollectionInterval: number; // seconds
    alertCheckInterval: number; // seconds
  };
  loadTesting: {
    enabled: boolean;
    autoTest: {
      enabled: boolean;
      interval: number; // hours
      config: 'basic' | 'stress' | 'spike';
    };
  };
}

export interface PerformanceOptimizationStatus {
  initialized: boolean;
  running: boolean;
  components: {
    database: {
      initialized: boolean;
      running: boolean;
      lastOptimization: Date;
      health: 'HEALTHY' | 'WARNING' | 'ERROR';
    };
    caching: {
      initialized: boolean;
      running: boolean;
      memory: {
        hitRate: number;
        size: number;
      };
      redis: {
        hitRate: number;
        size: number;
      };
      cdn: {
        hitRate: number;
        size: number;
      };
    };
    monitoring: {
      initialized: boolean;
      running: boolean;
      health: 'HEALTHY' | 'WARNING' | 'ERROR' | 'CRITICAL';
      alerts: number;
    };
    loadTesting: {
      initialized: boolean;
      running: boolean;
      lastTest: Date | null;
    };
  };
  uptime: number;
  lastHealthCheck: Date;
}

export class PerformanceOptimizationService {
  private config: PerformanceOptimizationConfig;
  private status: PerformanceOptimizationStatus;
  private isInitialized = false;
  private isRunning = false;
  private optimizationTasks: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: PerformanceOptimizationConfig) {
    this.config = config || this.getDefaultConfig();
    this.status = this.initializeStatus();
  }

  private getDefaultConfig(): PerformanceOptimizationConfig {
    return {
      database: {
        enabled: true,
        optimizationInterval: 60, // 1 hour
        healthCheckInterval: 5, // 5 minutes
      },
      caching: {
        enabled: true,
        warming: {
          enabled: true,
          marketDataInterval: 5,
          cryptoMetricsInterval: 10,
          analysisDataInterval: 15,
          sentimentDataInterval: 30,
        },
      },
      monitoring: {
        enabled: true,
        metricsCollectionInterval: 30, // 30 seconds
        alertCheckInterval: 60, // 1 minute
      },
      loadTesting: {
        enabled: true,
        autoTest: {
          enabled: false, // Disabled by default for production
          interval: 24, // 24 hours
          config: 'basic',
        },
      },
    };
  }

  private initializeStatus(): PerformanceOptimizationStatus {
    return {
      initialized: false,
      running: false,
      components: {
        database: {
          initialized: false,
          running: false,
          lastOptimization: new Date(),
          health: 'HEALTHY',
        },
        caching: {
          initialized: false,
          running: false,
          memory: {
            hitRate: 0,
            size: 0,
          },
          redis: {
            hitRate: 0,
            size: 0,
          },
          cdn: {
            hitRate: 0,
            size: 0,
          },
        },
        monitoring: {
          initialized: false,
          running: false,
          health: 'HEALTHY',
          alerts: 0,
        },
        loadTesting: {
          initialized: false,
          running: false,
          lastTest: null,
        },
      },
      uptime: 0,
      lastHealthCheck: new Date(),
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🚀 Initializing Performance Optimization Service...');
      
      // Initialize all components
      await this.initializeComponents();
      
      // Schedule optimization tasks
      await this.scheduleOptimizationTasks();
      
      // Run initial health check
      await this.runHealthCheck();
      
      this.isInitialized = true;
      this.isRunning = true;
      this.status.initialized = true;
      this.status.running = true;
      
      console.log('✅ Performance Optimization Service initialized successfully');
    } catch (error) {
      console.error('❌ Performance Optimization Service initialization failed:', error);
      throw error;
    }
  }

  private async initializeComponents(): Promise<void> {
    try {
      const services = await getServices();
      
      // Initialize database optimization
      if (this.config.database.enabled) {
        await services.databaseOptimizationService.initialize();
        this.status.components.database.initialized = true;
        console.log('✅ Database optimization initialized');
      }

      // Initialize caching strategy
      if (this.config.caching.enabled) {
        await services.multiLayerCachingStrategy; // Initialize by accessing
        this.status.components.caching.initialized = true;
        console.log('✅ Caching strategy initialized');
      }

      // Initialize cache warming
      if (this.config.caching.warming.enabled) {
        await services.cacheWarmingService.initialize();
        this.status.components.caching.running = true;
        console.log('✅ Cache warming initialized');
      }

      // Initialize performance monitoring
      if (this.config.monitoring.enabled) {
        await services.performanceMonitoringService.initialize();
        this.status.components.monitoring.initialized = true;
        this.status.components.monitoring.running = true;
        console.log('✅ Performance monitoring initialized');
      }

      // Initialize load testing
      if (this.config.loadTesting.enabled) {
        this.status.components.loadTesting.initialized = true;
        console.log('✅ Load testing initialized');
      }

      console.log('✅ All components initialized');
    } catch (error) {
      console.error('❌ Failed to initialize components:', error);
      throw error;
    }
  }

  private async scheduleOptimizationTasks(): Promise<void> {
    try {
      // Schedule database optimization
      if (this.config.database.enabled) {
        this.scheduleTask(
          'database-optimization',
          this.config.database.optimizationInterval * 60 * 1000,
          () => this.optimizeDatabase()
        );
        
        this.scheduleTask(
          'database-health-check',
          this.config.database.healthCheckInterval * 60 * 1000,
          () => this.checkDatabaseHealth()
        );
      }

      // Schedule cache warming
      if (this.config.caching.warming.enabled) {
        // Cache warming is handled internally by cacheWarmingService
        console.log('✅ Cache warming scheduled');
      }

      // Schedule performance monitoring
      if (this.config.monitoring.enabled) {
        // Performance monitoring is handled internally by performanceMonitoringService
        console.log('✅ Performance monitoring scheduled');
      }

      // Schedule auto load testing
      if (this.config.loadTesting.autoTest.enabled) {
        this.scheduleTask(
          'auto-load-test',
          this.config.loadTesting.autoTest.interval * 60 * 60 * 1000,
          () => this.runAutoLoadTest()
        );
      }

      // Schedule health check
      this.scheduleTask(
        'health-check',
        5 * 60 * 1000, // 5 minutes
        () => this.runHealthCheck()
      );

      console.log('✅ Optimization tasks scheduled');
    } catch (error) {
      console.error('❌ Failed to schedule optimization tasks:', error);
      throw error;
    }
  }

  private scheduleTask(name: string, intervalMs: number, task: () => Promise<void>): void {
    const taskInterval = setInterval(async () => {
      try {
        await task();
      } catch (error) {
        console.error(`❌ Optimization task ${name} failed:`, error);
      }
    }, intervalMs);
    
    this.optimizationTasks.set(name, taskInterval);
    
    console.log(`📅 Scheduled ${name} every ${intervalMs / 1000 / 60} minutes`);
  }

  private async optimizeDatabase(): Promise<void> {
    try {
      console.log('🔄 Running database optimization...');
      
      const services = await getServices();
      const result = await services.databaseOptimizationService.optimizeQueryPerformance();
      
      this.status.components.database.lastOptimization = new Date();
      
      console.log('✅ Database optimization completed', {
        executionTime: result.executionTime,
        slowQueriesOptimized: result.slowQueriesOptimized,
        indexesOptimized: result.indexesOptimized,
      });
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
      this.status.components.database.health = 'ERROR';
    }
  }

  private async checkDatabaseHealth(): Promise<void> {
    try {
      console.log('🔄 Running database health check...');
      
      const services = await getServices();
      const health = await services.databaseOptimizationService.runHealthCheck();
      
      this.status.components.database.health = health.healthy ? 'HEALTHY' : 'ERROR';
      
      if (!health.healthy) {
        console.warn('⚠️ Database health issues detected:', health.issues);
      }
      
      console.log('✅ Database health check completed');
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      this.status.components.database.health = 'ERROR';
    }
  }

  private async runAutoLoadTest(): Promise<void> {
    try {
      console.log('🔄 Running auto load test...');
      
      const services = await getServices();
      const config = services.loadTestingService.getStandardConfigurations()[this.config.loadTesting.autoTest.config];
      
      const testId = await services.loadTestingService.startLoadTest(config);
      
      this.status.components.loadTesting.running = true;
      this.status.components.loadTesting.lastTest = new Date();
      
      console.log(`✅ Auto load test started: ${testId}`);
    } catch (error) {
      console.error('❌ Auto load test failed:', error);
    }
  }

  private async runHealthCheck(): Promise<void> {
    try {
      console.log('🔄 Running system health check...');
      
      // Update component status
      await this.updateComponentStatus();
      
      // Calculate overall health
      const overallHealth = this.calculateOverallHealth();
      
      // Update status
      this.status.lastHealthCheck = new Date();
      this.status.uptime = process.uptime();
      
      console.log(`✅ System health check completed - Status: ${overallHealth}`);
    } catch (error) {
      console.error('❌ System health check failed:', error);
    }
  }

  private async updateComponentStatus(): Promise<void> {
    try {
      const services = await getServices();
      
      // Update cache status
      if (this.status.components.caching.initialized) {
        try {
          const cacheStats = await services.multiLayerCachingStrategy.getCacheStats();
          this.status.components.caching.memory = {
            hitRate: cacheStats.memory.hitRate,
            size: cacheStats.memory.size,
          };
          this.status.components.caching.redis = {
            hitRate: cacheStats.redis.hitRate,
            size: cacheStats.redis.size,
          };
          this.status.components.caching.cdn = {
            hitRate: cacheStats.cdn.hitRate,
            size: cacheStats.cdn.size,
          };
        } catch (error) {
          console.warn('⚠️ Failed to update cache status:', error);
        }
      }

      // Update monitoring status
      if (this.status.components.monitoring.initialized) {
        try {
          const dashboard = services.performanceMonitoringService.getDashboard();
          if (dashboard) {
            this.status.components.monitoring.health = dashboard.health;
            this.status.components.monitoring.alerts = dashboard.alerts.length;
          }
        } catch (error) {
          console.warn('⚠️ Failed to update monitoring status:', error);
        }
      }

      // Update load testing status
      if (this.status.components.loadTesting.running) {
        try {
          const progress = services.loadTestingService.getTestProgress();
          if (progress && progress.status === 'COMPLETED') {
            this.status.components.loadTesting.running = false;
          }
        } catch (error) {
          console.warn('⚠️ Failed to update load testing status:', error);
        }
      }

      console.log('✅ Component status updated');
    } catch (error) {
      console.error('❌ Failed to update component status:', error);
    }
  }

  private calculateOverallHealth(): 'HEALTHY' | 'WARNING' | 'ERROR' | 'CRITICAL' {
    const components = this.status.components;
    
    if (components.database.health === 'ERROR' || components.monitoring.health === 'CRITICAL') {
      return 'CRITICAL';
    }
    
    if (components.database.health === 'ERROR' || components.monitoring.health === 'ERROR') {
      return 'ERROR';
    }
    
    if (components.database.health === 'WARNING' || components.monitoring.health === 'WARNING') {
      return 'WARNING';
    }
    
    return 'HEALTHY';
  }

  // Public methods
  getStatus(): PerformanceOptimizationStatus {
    return { ...this.status };
  }

  async getPerformanceDashboard(): Promise<any> {
    try {
      const services = await getServices();
      const dashboard = services.performanceMonitoringService.getDashboard();
      return dashboard;
    } catch (error) {
      console.error('❌ Failed to get performance dashboard:', error);
      return null;
    }
  }

  async getCacheStats(): Promise<any> {
    try {
      const services = await getServices();
      const stats = await services.multiLayerCachingStrategy.getCacheStats();
      return stats;
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return null;
    }
  }

  async getDatabaseMetrics(): Promise<any> {
    try {
      const services = await getServices();
      const metrics = await services.databaseOptimizationService.getPerformanceMetrics();
      return metrics;
    } catch (error) {
      console.error('❌ Failed to get database metrics:', error);
      return null;
    }
  }

  async runManualOptimization(): Promise<void> {
    try {
      console.log('🔄 Running manual optimization...');
      
      await Promise.all([
        this.optimizeDatabase(),
        this.runHealthCheck(),
      ]);
      
      console.log('✅ Manual optimization completed');
    } catch (error) {
      console.error('❌ Manual optimization failed:', error);
      throw error;
    }
  }

  async runManualCacheWarming(dataType?: 'market-data' | 'crypto-metrics' | 'analysis-data' | 'sentiment-data' | 'all'): Promise<void> {
    try {
      console.log('🔄 Running manual cache warming...');
      
      const services = await getServices();
      await services.cacheWarmingService.runManualWarming(dataType || 'all');
      
      console.log('✅ Manual cache warming completed');
    } catch (error) {
      console.error('❌ Manual cache warming failed:', error);
      throw error;
    }
  }

  async updateConfig(newConfig: Partial<PerformanceOptimizationConfig>): Promise<void> {
    try {
      console.log('🔄 Updating performance optimization config...');
      
      this.config = { ...this.config, ...newConfig };
      
      // Reschedule tasks with new configuration
      await this.stopOptimizationTasks();
      await this.scheduleOptimizationTasks();
      
      console.log('✅ Performance optimization config updated');
    } catch (error) {
      console.error('❌ Failed to update performance optimization config:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('🛑 Stopping Performance Optimization Service...');
      
      // Stop all optimization tasks
      await this.stopOptimizationTasks();
      
      // Stop all components
      if (this.config.database.enabled) {
        await databaseOptimizationService.close();
      }
      
      if (this.config.caching.warming.enabled) {
        await cacheWarmingService.stop();
      }
      
      if (this.config.monitoring.enabled) {
        await performanceMonitoringService.stop();
      }
      
      if (this.status.components.loadTesting.running) {
        await loadTestingService.stopLoadTest();
      }
      
      this.isRunning = false;
      this.status.running = false;
      
      console.log('✅ Performance Optimization Service stopped');
    } catch (error) {
      console.error('❌ Failed to stop Performance Optimization Service:', error);
      throw error;
    }
  }

  private async stopOptimizationTasks(): Promise<void> {
    try {
      for (const [name, task] of this.optimizationTasks) {
        clearInterval(task);
        console.log(`🛑 Stopped ${name} task`);
      }
      
      this.optimizationTasks.clear();
    } catch (error) {
      console.error('❌ Failed to stop optimization tasks:', error);
    }
  }

  // Utility methods
  async getSystemReport(): Promise<string> {
    try {
      const status = this.getStatus();
      const dashboard = await this.getPerformanceDashboard();
      const cacheStats = await this.getCacheStats();
      const dbMetrics = await this.getDatabaseMetrics();
      
      const report = `
=== Performance Optimization System Report ===

System Status: ${status.running ? 'RUNNING' : 'STOPPED'}
Uptime: ${Math.floor(status.uptime / 60)} minutes
Last Health Check: ${status.lastHealthCheck.toLocaleString()}

=== Component Status ===
Database: ${status.components.database.health} (Last optimization: ${status.components.database.lastOptimization.toLocaleString()})
Caching: 
  Memory: ${status.components.caching.memory.hitRate.toFixed(1)}% hit rate, ${status.components.caching.memory.size} items
  Redis: ${status.components.caching.redis.hitRate.toFixed(1)}% hit rate, ${status.components.caching.redis.size} items
  CDN: ${status.components.caching.cdn.hitRate.toFixed(1)}% hit rate, ${status.components.caching.cdn.size} items
Monitoring: ${status.components.monitoring.health} (${status.components.monitoring.alerts} alerts)
Load Testing: ${status.components.loadTesting.running ? 'RUNNING' : 'STOPPED'}

=== Performance Metrics ===
${dashboard ? `
System Health: ${dashboard.health}
CPU Usage: ${dashboard.system.cpu.usage.toFixed(1)}%
Memory Usage: ${dashboard.system.memory.usage.toFixed(1)}%
Database Cache Hit Ratio: ${dashboard.database.cacheHitRatio.toFixed(1)}%
Overall Cache Hit Rate: ${dashboard.cache.overall.hitRate.toFixed(1)}%
` : 'Dashboard not available'}

${dbMetrics ? `
Database Metrics:
Active Connections: ${dbMetrics.activeConnections}
Slow Queries: ${dbMetrics.slowQueryCount}
Index Usage: ${dbMetrics.indexUsageRatio.toFixed(1)}%
` : 'Database metrics not available'}

${cacheStats ? `
Cache Statistics:
Total Size: ${cacheStats.overall.totalSize} items
Overall Hit Rate: ${cacheStats.overall.hitRate.toFixed(1)}%
Total Requests: ${cacheStats.overall.totalRequests}
Total Hits: ${cacheStats.overall.totalHits}
` : 'Cache statistics not available'}

=== End Report ===
      `;
      
      return report;
    } catch (error) {
      console.error('❌ Failed to generate system report:', error);
      return 'Failed to generate system report';
    }
  }
}

// Global instance
export const performanceOptimizationService = new PerformanceOptimizationService();