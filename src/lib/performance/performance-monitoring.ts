// Performance Monitoring Service
// Enterprise-grade performance monitoring for financial systems

import { databaseOptimizationService } from './database-optimization';
import { multiLayerCachingStrategy } from './caching-strategy';

export interface SystemMetrics {
  cpu: {
    usage: number;
    load1m: number;
    load5m: number;
    load15m: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
    iops: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  timestamp: Date;
}

export interface ApplicationMetrics {
  uptime: number;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  activeConnections: number;
  timestamp: Date;
}

export interface DatabaseMetrics {
  activeConnections: number;
  slowQueryCount: number;
  indexUsageRatio: number;
  cacheHitRatio: number;
  avgQueryTime: number;
  timestamp: Date;
}

export interface CacheMetrics {
  memory: {
    hitRate: number;
    size: number;
    avgLatency: number;
  };
  redis: {
    hitRate: number;
    size: number;
    avgLatency: number;
  };
  cdn: {
    hitRate: number;
    size: number;
    avgLatency: number;
  };
  overall: {
    hitRate: number;
    totalSize: number;
    totalRequests: number;
    totalHits: number;
  };
  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  type: 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'SYSTEM' | 'DATABASE' | 'CACHE' | 'APPLICATION';
  title: string;
  description: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface PerformanceDashboard {
  system: SystemMetrics;
  application: ApplicationMetrics;
  database: DatabaseMetrics;
  cache: CacheMetrics;
  alerts: PerformanceAlert[];
  health: 'HEALTHY' | 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: Date;
}

export class PerformanceMonitoringService {
  private isRunning = false;
  private metricsCollectionInterval: NodeJS.Timeout | null = null;
  private alerts: PerformanceAlert[] = [];
  private dashboard: PerformanceDashboard | null = null;
  private requestMetrics = {
    count: 0,
    totalTime: 0,
    responseTimes: [] as number[],
  };
  private errorCount = 0;

  constructor() {
    this.initializeDashboard();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing Performance Monitoring Service...');
      
      await this.initializeDashboard();
      await this.startMetricsCollection();
      
      console.log('✅ Performance Monitoring Service initialized successfully');
    } catch (error) {
      console.error('❌ Performance Monitoring Service initialization failed:', error);
      throw error;
    }
  }

  private async initializeDashboard(): Promise<void> {
    try {
      this.dashboard = {
        system: await this.getSystemMetrics(),
        application: await this.getApplicationMetrics(),
        database: await this.getDatabaseMetrics(),
        cache: await this.getCacheMetrics(),
        alerts: [],
        health: 'HEALTHY',
        timestamp: new Date(),
      };
      
      console.log('✅ Performance dashboard initialized');
    } catch (error) {
      console.error('❌ Failed to initialize performance dashboard:', error);
      throw error;
    }
  }

  private async startMetricsCollection(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      this.isRunning = true;
      
      // Collect metrics every 30 seconds
      this.metricsCollectionInterval = setInterval(async () => {
        try {
          await this.collectAllMetrics();
          await this.checkAlerts();
          await this.updateDashboard();
        } catch (error) {
          console.error('❌ Metrics collection failed:', error);
        }
      }, 30000); // 30 seconds
      
      console.log('✅ Metrics collection started');
    } catch (error) {
      console.error('❌ Failed to start metrics collection:', error);
      throw error;
    }
  }

  private async collectAllMetrics(): Promise<void> {
    try {
      const [system, application, database, cache] = await Promise.all([
        this.getSystemMetrics(),
        this.getApplicationMetrics(),
        this.getDatabaseMetrics(),
        this.getCacheMetrics(),
      ]);

      if (this.dashboard) {
        this.dashboard.system = system;
        this.dashboard.application = application;
        this.dashboard.database = database;
        this.dashboard.cache = cache;
        this.dashboard.timestamp = new Date();
      }
    } catch (error) {
      console.error('❌ Failed to collect metrics:', error);
    }
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Simulate system metrics collection
      // In a real implementation, this would use system monitoring libraries
      return {
        cpu: {
          usage: Math.random() * 100,
          load1m: Math.random() * 2,
          load5m: Math.random() * 1.5,
          load15m: Math.random() * 1,
        },
        memory: {
          total: 16 * 1024 * 1024 * 1024, // 16GB
          used: Math.random() * 8 * 1024 * 1024 * 1024, // 8GB
          free: 8 * 1024 * 1024 * 1024, // 8GB
          usage: 50,
        },
        disk: {
          total: 500 * 1024 * 1024 * 1024, // 500GB
          used: Math.random() * 250 * 1024 * 1024 * 1024, // 250GB
          free: 250 * 1024 * 1024 * 1024, // 250GB
          usage: 50,
          iops: Math.random() * 1000,
        },
        network: {
          bytesIn: Math.random() * 1000000,
          bytesOut: Math.random() * 1000000,
          packetsIn: Math.random() * 10000,
          packetsOut: Math.random() * 10000,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Failed to get system metrics:', error);
      return {
        cpu: { usage: 0, load1m: 0, load5m: 0, load15m: 0 },
        memory: { total: 0, used: 0, free: 0, usage: 0 },
        disk: { total: 0, used: 0, free: 0, usage: 0, iops: 0 },
        network: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 },
        timestamp: new Date(),
      };
    }
  }

  private async getApplicationMetrics(): Promise<ApplicationMetrics> {
    try {
      // Calculate application metrics
      const uptime = process.uptime() * 1000; // Convert to milliseconds
      const avgResponseTime = this.requestMetrics.count > 0 
        ? this.requestMetrics.totalTime / this.requestMetrics.count 
        : 0;
      
      const sortedResponseTimes = [...this.requestMetrics.responseTimes].sort((a, b) => a - b);
      const p95ResponseTime = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.95)] || 0;
      const p99ResponseTime = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.99)] || 0;

      return {
        uptime,
        requestCount: this.requestMetrics.count,
        errorCount: this.errorCount,
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        activeConnections: 0, // Would get from connection pool
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Failed to get application metrics:', error);
      return {
        uptime: 0,
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        activeConnections: 0,
        timestamp: new Date(),
      };
    }
  }

  private async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      const dbMetrics = await databaseOptimizationService.getPerformanceMetrics();
      
      return {
        activeConnections: dbMetrics.activeConnections,
        slowQueryCount: dbMetrics.slowQueryCount,
        indexUsageRatio: dbMetrics.indexUsageRatio,
        cacheHitRatio: dbMetrics.cacheHitRatio,
        avgQueryTime: 0, // Would calculate from query logs
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Failed to get database metrics:', error);
      return {
        activeConnections: 0,
        slowQueryCount: 0,
        indexUsageRatio: 0,
        cacheHitRatio: 0,
        avgQueryTime: 0,
        timestamp: new Date(),
      };
    }
  }

  private async getCacheMetrics(): Promise<CacheMetrics> {
    try {
      const cacheStats = await multiLayerCachingStrategy.getCacheStats();
      
      return {
        memory: {
          hitRate: cacheStats.memory.hitRate,
          size: cacheStats.memory.size,
          avgLatency: cacheStats.memory.avgLatency,
        },
        redis: {
          hitRate: cacheStats.redis.hitRate,
          size: cacheStats.redis.size,
          avgLatency: cacheStats.redis.avgLatency,
        },
        cdn: {
          hitRate: cacheStats.cdn.hitRate,
          size: cacheStats.cdn.size,
          avgLatency: cacheStats.cdn.avgLatency,
        },
        overall: {
          hitRate: cacheStats.overall.hitRate,
          totalSize: cacheStats.overall.totalSize,
          totalRequests: cacheStats.overall.totalRequests,
          totalHits: cacheStats.overall.totalHits,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Failed to get cache metrics:', error);
      return {
        memory: { hitRate: 0, size: 0, avgLatency: 0 },
        redis: { hitRate: 0, size: 0, avgLatency: 0 },
        cdn: { hitRate: 0, size: 0, avgLatency: 0 },
        overall: { hitRate: 0, totalSize: 0, totalRequests: 0, totalHits: 0 },
        timestamp: new Date(),
      };
    }
  }

  private async checkAlerts(): Promise<void> {
    try {
      if (!this.dashboard) {
        return;
      }

      const newAlerts: PerformanceAlert[] = [];

      // Check system alerts
      if (this.dashboard.system.cpu.usage > 90) {
        newAlerts.push(this.createAlert(
          'CRITICAL',
          'SYSTEM',
          'High CPU Usage',
          `CPU usage is ${this.dashboard.system.cpu.usage.toFixed(1)}%`,
          this.dashboard.system.cpu.usage,
          90
        ));
      }

      if (this.dashboard.system.memory.usage > 90) {
        newAlerts.push(this.createAlert(
          'CRITICAL',
          'SYSTEM',
          'High Memory Usage',
          `Memory usage is ${this.dashboard.system.memory.usage.toFixed(1)}%`,
          this.dashboard.system.memory.usage,
          90
        ));
      }

      // Check database alerts
      if (this.dashboard.database.slowQueryCount > 10) {
        newAlerts.push(this.createAlert(
          'WARNING',
          'DATABASE',
          'High Slow Query Count',
          `Slow query count is ${this.dashboard.database.slowQueryCount}`,
          this.dashboard.database.slowQueryCount,
          10
        ));
      }

      if (this.dashboard.database.indexUsageRatio < 70) {
        newAlerts.push(this.createAlert(
          'WARNING',
          'DATABASE',
          'Low Index Usage',
          `Index usage ratio is ${this.dashboard.database.indexUsageRatio.toFixed(1)}%`,
          this.dashboard.database.indexUsageRatio,
          70
        ));
      }

      // Check cache alerts
      if (this.dashboard.cache.overall.hitRate < 80) {
        newAlerts.push(this.createAlert(
          'WARNING',
          'CACHE',
          'Low Cache Hit Rate',
          `Cache hit rate is ${this.dashboard.cache.overall.hitRate.toFixed(1)}%`,
          this.dashboard.cache.overall.hitRate,
          80
        ));
      }

      // Check application alerts
      if (this.dashboard.application.avgResponseTime > 1000) {
        newAlerts.push(this.createAlert(
          'WARNING',
          'APPLICATION',
          'High Response Time',
          `Average response time is ${this.dashboard.application.avgResponseTime.toFixed(1)}ms`,
          this.dashboard.application.avgResponseTime,
          1000
        ));
      }

      if (this.dashboard.application.errorCount > 10) {
        newAlerts.push(this.createAlert(
          'ERROR',
          'APPLICATION',
          'High Error Count',
          `Error count is ${this.dashboard.application.errorCount}`,
          this.dashboard.application.errorCount,
          10
        ));
      }

      // Add new alerts
      this.alerts.push(...newAlerts);
      
      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(-100);
      }

      // Update dashboard alerts
      if (this.dashboard) {
        this.dashboard.alerts = [...this.alerts];
      }

      // Log new alerts
      for (const alert of newAlerts) {
        console.warn(`🚨 ${alert.type} Alert: ${alert.title} - ${alert.description}`);
      }
    } catch (error) {
      console.error('❌ Failed to check alerts:', error);
    }
  }

  private createAlert(
    type: 'WARNING' | 'ERROR' | 'CRITICAL',
    category: 'SYSTEM' | 'DATABASE' | 'CACHE' | 'APPLICATION',
    title: string,
    description: string,
    value: number,
    threshold: number
  ): PerformanceAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      title,
      description,
      value,
      threshold,
      timestamp: new Date(),
      resolved: false,
    };
  }

  private async updateDashboard(): Promise<void> {
    try {
      if (!this.dashboard) {
        return;
      }

      // Calculate overall health status
      const health = this.calculateOverallHealth();
      this.dashboard.health = health;

      // Update timestamp
      this.dashboard.timestamp = new Date();
    } catch (error) {
      console.error('❌ Failed to update dashboard:', error);
    }
  }

  private calculateOverallHealth(): 'HEALTHY' | 'WARNING' | 'ERROR' | 'CRITICAL' {
    if (!this.dashboard) {
      return 'ERROR';
    }

    const criticalAlerts = this.alerts.filter(a => a.type === 'CRITICAL' && !a.resolved);
    const errorAlerts = this.alerts.filter(a => a.type === 'ERROR' && !a.resolved);
    const warningAlerts = this.alerts.filter(a => a.type === 'WARNING' && !a.resolved);

    if (criticalAlerts.length > 0) {
      return 'CRITICAL';
    }

    if (errorAlerts.length > 0) {
      return 'ERROR';
    }

    if (warningAlerts.length > 3) {
      return 'WARNING';
    }

    return 'HEALTHY';
  }

  // Public methods for tracking application metrics
  trackRequest(responseTime: number): void {
    this.requestMetrics.count++;
    this.requestMetrics.totalTime += responseTime;
    this.requestMetrics.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.requestMetrics.responseTimes.length > 1000) {
      this.requestMetrics.responseTimes = this.requestMetrics.responseTimes.slice(-1000);
    }
  }

  trackError(): void {
    this.errorCount++;
  }

  // Public methods for getting metrics
  getDashboard(): PerformanceDashboard | null {
    return this.dashboard;
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        alert.resolvedAt = new Date();
        console.log(`✅ Alert resolved: ${alert.title}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to resolve alert:', error);
      return false;
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('🛑 Stopping Performance Monitoring Service...');
      
      if (this.metricsCollectionInterval) {
        clearInterval(this.metricsCollectionInterval);
        this.metricsCollectionInterval = null;
      }
      
      this.isRunning = false;
      
      console.log('✅ Performance Monitoring Service stopped');
    } catch (error) {
      console.error('❌ Failed to stop Performance Monitoring Service:', error);
      throw error;
    }
  }
}

// Global instance
export const performanceMonitoringService = new PerformanceMonitoringService();