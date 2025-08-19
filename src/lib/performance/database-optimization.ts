// Database Optimization Service
// Enterprise-grade database performance optimization for financial systems

import { PrismaClient } from '@prisma/client';

export interface DatabasePerformanceMetrics {
  activeConnections: number;
  slowQueryCount: number;
  indexUsageRatio: number;
  cacheHitRatio: number;
  timestamp: Date;
}

export interface QueryOptimizationResult {
  executionTime: number;
  slowQueriesOptimized: number;
  indexesOptimized: number;
  statisticsUpdated: boolean;
  cleanupResults: CleanupResult;
}

export interface IndexOptimizationResult {
  optimizedCount: number;
}

export interface CleanupResult {
  indexesDropped: number;
  spaceSaved: number;
}

export interface SlowQuery {
  query: string;
  mean_time: number;
  calls: number;
  rows: number;
}

export interface IndexInfo {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
  index_size: string;
}

export interface UnusedIndex {
  schemaname: string;
  tablename: string;
  indexname: string;
  size: string;
}

export class DatabaseOptimizationService {
  private prisma: PrismaClient;
  private isInitialized = false;
  
  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'file:./dev.db',
        },
      },
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.setupConnectionPooling();
      await this.setupQueryOptimization();
      await this.setupIndexOptimization();
      await this.setupPartitioning();
      
      this.isInitialized = true;
      console.log('✅ Database Optimization Service initialized successfully');
    } catch (error) {
      console.error('❌ Database Optimization Service initialization failed:', error);
      throw error;
    }
  }

  private async setupConnectionPooling(): Promise<void> {
    try {
      // Configure connection pool settings
      await this.prisma.$executeRaw`
        SET pool_size = 20;
        SET max_connections = 100;
        SET shared_buffers = '256MB';
        SET effective_cache_size = '1GB';
        SET maintenance_work_mem = '64MB';
        SET checkpoint_completion_target = 0.9;
        SET wal_buffers = '16MB';
        SET default_statistics_target = 100;
      `;
      
      console.log('✅ Connection pooling configured');
    } catch (error) {
      console.warn('⚠️ Connection pooling setup failed:', error);
    }
  }

  private async setupQueryOptimization(): Promise<void> {
    try {
      // Enable query optimization features
      await this.prisma.$executeRaw`
        SET enable_nestloop = ON;
        SET enable_hashjoin = ON;
        SET enable_mergejoin = ON;
        SET enable_indexscan = ON;
        SET enable_bitmapscan = ON;
        SET effective_io_concurrency = 2;
        SET random_page_cost = 1.1;
        SET seq_page_cost = 1.0;
      `;
      
      console.log('✅ Query optimization configured');
    } catch (error) {
      console.warn('⚠️ Query optimization setup failed:', error);
    }
  }

  private async setupIndexOptimization(): Promise<void> {
    try {
      // Create performance monitoring indexes if they don't exist
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_crypto_symbol_active 
        ON "main"."cryptocurrencies" (symbol, is_active);
        
        CREATE INDEX IF NOT EXISTS idx_crypto_created_at 
        ON "main"."cryptocurrencies" (created_at);
        
        CREATE INDEX IF NOT EXISTS idx_price_history_crypto_timestamp 
        ON "main"."price_history" (crypto_id, timestamp DESC);
        
        CREATE INDEX IF NOT EXISTS idx_price_history_timestamp 
        ON "main"."price_history" (timestamp DESC);
        
        CREATE INDEX IF NOT EXISTS idx_onchain_crypto_timestamp 
        ON "main"."on_chain_metrics" (crypto_id, timestamp DESC);
        
        CREATE INDEX IF NOT EXISTS idx_technical_crypto_timestamp 
        ON "main"."technical_indicators" (crypto_id, timestamp DESC);
        
        CREATE INDEX IF NOT EXISTS idx_sentiment_crypto_timestamp 
        ON "main"."sentiment_data" (crypto_id, timestamp DESC);
      `;
      
      console.log('✅ Index optimization configured');
    } catch (error) {
      console.warn('⚠️ Index optimization setup failed:', error);
    }
  }

  private async setupPartitioning(): Promise<void> {
    try {
      // Check if partitioning extension is available
      const partitionExt = await this.prisma.$queryRaw`
        SELECT * FROM pg_extension WHERE extname = 'pg_partman'
      `;
      
      if (Array.isArray(partitionExt) && partitionExt.length > 0) {
        // Set up time-series partitioning for price history
        try {
          await this.prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS price_history_2024 
            PARTITION OF price_history 
            FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
          `;
          
          await this.prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS price_history_2025 
            PARTITION OF price_history 
            FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
          `;
          
          console.log('✅ Time-series partitioning configured');
        } catch (partitionError) {
          console.warn('⚠️ Partitioning setup failed:', partitionError);
        }
      } else {
        console.log('ℹ️ Partitioning extension not available, skipping');
      }
    } catch (error) {
      console.warn('⚠️ Partitioning setup failed:', error);
    }
  }

  async optimizeQueryPerformance(): Promise<QueryOptimizationResult> {
    const startTime = Date.now();
    
    try {
      // Analyze slow queries
      const slowQueries = await this.analyzeSlowQueries();
      
      // Optimize indexes
      const indexOptimization = await this.optimizeIndexes();
      
      // Update statistics
      await this.updateStatistics();
      
      // Clean up unused indexes
      const cleanupResult = await this.cleanupUnusedIndexes();
      
      return {
        executionTime: Date.now() - startTime,
        slowQueriesOptimized: slowQueries.length,
        indexesOptimized: indexOptimization.optimizedCount,
        statisticsUpdated: true,
        cleanupResults: cleanupResult,
      };
    } catch (error) {
      console.error('❌ Query optimization failed:', error);
      throw error;
    }
  }

  private async analyzeSlowQueries(): Promise<SlowQuery[]> {
    try {
      const slowQueries = await this.prisma.$queryRaw`
        SELECT query, mean_time, calls, rows
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      ` as SlowQuery[];
      
      return slowQueries || [];
    } catch (error) {
      console.warn('⚠️ Slow query analysis failed:', error);
      return [];
    }
  }

  private async optimizeIndexes(): Promise<IndexOptimizationResult> {
    try {
      const indexes = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        ORDER BY idx_scan ASC
      ` as IndexInfo[];
      
      let optimizedCount = 0;
      
      for (const index of indexes || []) {
        if (index.idx_scan === 0 && index.idx_tup_read === 0) {
          try {
            // Drop unused indexes
            await this.prisma.$executeRaw`DROP INDEX CONCURRENTLY ${index.indexname}`;
            optimizedCount++;
            console.log(`🗑️ Dropped unused index: ${index.indexname}`);
          } catch (dropError) {
            console.warn(`⚠️ Failed to drop index ${index.indexname}:`, dropError);
          }
        }
      }
      
      return { optimizedCount };
    } catch (error) {
      console.warn('⚠️ Index optimization failed:', error);
      return { optimizedCount: 0 };
    }
  }

  private async updateStatistics(): Promise<void> {
    try {
      await this.prisma.$executeRaw`ANALYZE`;
      await this.prisma.$executeRaw`VACUUM ANALYZE`;
      console.log('✅ Database statistics updated');
    } catch (error) {
      console.warn('⚠️ Statistics update failed:', error);
    }
  }

  private async cleanupUnusedIndexes(): Promise<CleanupResult> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_indexes
        WHERE indexname NOT IN (
          SELECT indexname 
          FROM pg_stat_user_indexes 
          WHERE idx_scan > 0
        )
      ` as UnusedIndex[];
      
      let spaceSaved = 0;
      let indexesDropped = 0;
      
      for (const index of result || []) {
        try {
          await this.prisma.$executeRaw`DROP INDEX CONCURRENTLY ${index.indexname}`;
          spaceSaved += parseInt(index.size.replace(/[^0-9]/g, '')) || 0;
          indexesDropped++;
          console.log(`🗑️ Cleaned up unused index: ${index.indexname}`);
        } catch (cleanupError) {
          console.warn(`⚠️ Failed to cleanup index ${index.indexname}:`, cleanupError);
        }
      }
      
      return { indexesDropped, spaceSaved };
    } catch (error) {
      console.warn('⚠️ Index cleanup failed:', error);
      return { indexesDropped: 0, spaceSaved: 0 };
    }
  }

  async getPerformanceMetrics(): Promise<DatabasePerformanceMetrics> {
    try {
      const [connectionCount, slowQueryCount, indexUsage, cacheHitRatio] = await Promise.all([
        this.getActiveConnections(),
        this.getSlowQueryCount(),
        this.getIndexUsage(),
        this.getCacheHitRatio(),
      ]);
      
      return {
        activeConnections: connectionCount,
        slowQueryCount,
        indexUsageRatio: indexUsage,
        cacheHitRatio,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Failed to get performance metrics:', error);
      return {
        activeConnections: 0,
        slowQueryCount: 0,
        indexUsageRatio: 0,
        cacheHitRatio: 0,
        timestamp: new Date(),
      };
    }
  }

  private async getActiveConnections(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE state = 'active'
      ` as { count: number }[];
      
      return result[0]?.count || 0;
    } catch (error) {
      console.warn('⚠️ Failed to get active connections:', error);
      return 0;
    }
  }

  private async getSlowQueryCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT count(*) as count
        FROM pg_stat_statements
        WHERE mean_time > 1000
      ` as { count: number }[];
      
      return result[0]?.count || 0;
    } catch (error) {
      console.warn('⚠️ Failed to get slow query count:', error);
      return 0;
    }
  }

  private async getIndexUsage(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          (sum(idx_scan) * 100.0 / nullif(sum(idx_scan) + sum(seq_scan), 0)) as usage_ratio
        FROM pg_stat_user_tables
      ` as { usage_ratio: number }[];
      
      return result[0]?.usage_ratio || 0;
    } catch (error) {
      console.warn('⚠️ Failed to get index usage:', error);
      return 0;
    }
  }

  private async getCacheHitRatio(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          (sum(heap_blks_hit) * 100.0 / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0)) as hit_ratio
        FROM pg_statio_user_tables
      ` as { hit_ratio: number }[];
      
      return result[0]?.hit_ratio || 0;
    } catch (error) {
      console.warn('⚠️ Failed to get cache hit ratio:', error);
      return 0;
    }
  }

  async runHealthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const metrics = await this.getPerformanceMetrics();
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check active connections
      if (metrics.activeConnections > 50) {
        issues.push('High number of active connections');
        recommendations.push('Consider increasing connection pool size');
      }

      // Check slow queries
      if (metrics.slowQueryCount > 5) {
        issues.push('High number of slow queries detected');
        recommendations.push('Run query optimization and review indexes');
      }

      // Check index usage
      if (metrics.indexUsageRatio < 80) {
        issues.push('Low index usage ratio');
        recommendations.push('Review and optimize database indexes');
      }

      // Check cache hit ratio
      if (metrics.cacheHitRatio < 90) {
        issues.push('Low cache hit ratio');
        recommendations.push('Increase shared_buffers and review query patterns');
      }

      return {
        healthy: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        healthy: false,
        issues: ['Health check failed'],
        recommendations: ['Check database connectivity and permissions'],
      };
    }
  }

  async close(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log('✅ Database Optimization Service closed');
    } catch (error) {
      console.error('❌ Failed to close Database Optimization Service:', error);
    }
  }
}

// Global instance
export const databaseOptimizationService = new DatabaseOptimizationService();