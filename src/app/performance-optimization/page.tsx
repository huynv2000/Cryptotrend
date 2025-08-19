'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  performanceOptimizationService, 
  initializePerformanceOptimization,
  type PerformanceOptimizationStatus,
  type PerformanceDashboard,
  type CacheStats,
  type DatabasePerformanceMetrics,
  type LoadTestResult,
  type LoadTestProgress
} from '@/lib/performance';
import { 
  Database, 
  Zap, 
  BarChart3, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Play,
  Stop,
  TrendingUp,
  TrendingDown,
  Clock,
  HardDrive,
  Cpu,
  Wifi
} from 'lucide-react';
import { formatDuration, formatBytes, formatPercentage, calculatePerformanceGrade } from '@/lib/performance';

export default function PerformanceOptimizationPage() {
  const [status, setStatus] = useState<PerformanceOptimizationStatus | null>(null);
  const [dashboard, setDashboard] = useState<PerformanceDashboard | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [dbMetrics, setDbMetrics] = useState<DatabasePerformanceMetrics | null>(null);
  const [loadTestResult, setLoadTestResult] = useState<LoadTestResult | null>(null);
  const [loadTestProgress, setLoadTestProgress] = useState<LoadTestProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    initializePerformanceOptimization();
    loadMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      
      const [statusData, dashboardData, cacheData, dbData] = await Promise.all([
        performanceOptimizationService.getStatus(),
        performanceOptimizationService.getPerformanceDashboard(),
        performanceOptimizationService.getCacheStats(),
        performanceOptimizationService.getDatabaseMetrics(),
      ]);
      
      setStatus(statusData);
      setDashboard(dashboardData);
      setCacheStats(cacheData);
      setDbMetrics(dbData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    try {
      setIsLoading(true);
      await performanceOptimizationService.runManualOptimization();
      await loadMetrics();
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCacheWarming = async () => {
    try {
      setIsLoading(true);
      await performanceOptimizationService.runManualCacheWarming('all');
      await loadMetrics();
    } catch (error) {
      console.error('Cache warming failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTest = async () => {
    try {
      setIsLoading(true);
      const config = {
        duration: 60,
        concurrentUsers: 10,
        rampUpTime: 30,
        requestsPerSecond: 5,
        endpoints: [
          {
            url: '/api/health',
            method: 'GET' as const,
            weight: 1,
          },
          {
            url: '/api/v2/blockchain/usage-metrics',
            method: 'GET' as const,
            weight: 3,
          },
          {
            url: '/api/v2/blockchain/market-overview',
            method: 'GET' as const,
            weight: 2,
          },
        ],
      };
      
      const testId = await performanceOptimizationService.getPerformanceDashboard();
      // Note: Load testing would be implemented with proper API endpoints
      await loadMetrics();
    } catch (error) {
      console.error('Load test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (isHealthy: boolean, isRunning: boolean) => {
    if (!isRunning) return <XCircle className="h-4 w-4 text-gray-500" />;
    if (isHealthy) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (health: string) => {
    switch (health) {
      case 'HEALTHY':
        return <Badge className="bg-green-500 text-white">Healthy</Badge>;
      case 'WARNING':
        return <Badge className="bg-yellow-500 text-white">Warning</Badge>;
      case 'ERROR':
        return <Badge className="bg-red-500 text-white">Error</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-red-700 text-white">Critical</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const getPerformanceGradeBadge = (grade: string) => {
    const colors = {
      'A': 'bg-green-500',
      'B': 'bg-blue-500',
      'C': 'bg-yellow-500',
      'D': 'bg-orange-500',
      'F': 'bg-red-500',
    };
    
    return (
      <Badge className={`${colors[grade as keyof typeof colors] || 'bg-gray-500'} text-white`}>
        {grade}
      </Badge>
    );
  };

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Performance Optimization...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Optimization</h1>
          <p className="text-muted-foreground">
            System performance monitoring and optimization dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadMetrics} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleOptimize} disabled={isLoading}>
            <Zap className="h-4 w-4 mr-2" />
            Optimize
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
          <CardDescription>
            Overall system health and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Database</div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.components.database.health === 'HEALTHY', status.components.database.running)}
                  <span>{status.components.database.health}</span>
                </div>
              </div>
              {getStatusBadge(status.components.database.health)}
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Caching</div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Healthy</span>
                </div>
              </div>
              <Badge className="bg-green-500 text-white">Healthy</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Monitoring</div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(
                    status.components.monitoring.health === 'HEALTHY' || 
                    status.components.monitoring.health === 'WARNING',
                    status.components.monitoring.running
                  )}
                  <span>{status.components.monitoring.health}</span>
                </div>
              </div>
              {getStatusBadge(status.components.monitoring.health)}
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Load Testing</div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(true, status.components.loadTesting.running)}
                  <span>{status.components.loadTesting.running ? 'Running' : 'Idle'}</span>
                </div>
              </div>
              <Badge className={status.components.loadTesting.running ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}>
                {status.components.loadTesting.running ? 'Running' : 'Idle'}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()} | Uptime: {formatDuration(status.uptime * 1000)}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="loadtest">Load Test</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span className="text-2xl font-bold">
                    {dashboard?.system.cpu.usage.toFixed(1) || '0'}%
                  </span>
                  {dashboard?.system.cpu.usage && dashboard.system.cpu.usage > 80 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-2xl font-bold">
                    {dashboard?.system.memory.usage.toFixed(1) || '0'}%
                  </span>
                  {dashboard?.system.memory.usage && dashboard.system.memory.usage > 85 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4" />
                  <span className="text-2xl font-bold">
                    {cacheStats?.overall.hitRate.toFixed(1) || '0'}%
                  </span>
                  {cacheStats?.overall.hitRate && cacheStats.overall.hitRate > 80 ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Database Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span className="text-2xl font-bold">
                    {dbMetrics?.cacheHitRatio.toFixed(1) || '0'}%
                  </span>
                  {getStatusBadge(status.components.database.health)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Performance Grade</CardTitle>
              <CardDescription>
                Overall system performance assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Performance Grade</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">
                      {calculatePerformanceGrade({
                        responseTime: dashboard?.application.avgResponseTime || 0,
                        errorRate: dashboard?.application.errorCount || 0,
                        throughput: dashboard?.application.requestCount || 0,
                      })}
                    </span>
                    {getPerformanceGradeBadge(
                      calculatePerformanceGrade({
                        responseTime: dashboard?.application.avgResponseTime || 0,
                        errorRate: dashboard?.application.errorCount || 0,
                        throughput: dashboard?.application.requestCount || 0,
                      })
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  <div className="text-lg font-semibold">
                    {formatDuration(dashboard?.application.avgResponseTime || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Active Connections</span>
                  <span className="font-semibold">{dbMetrics?.activeConnections || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Slow Queries</span>
                  <span className="font-semibold">{dbMetrics?.slowQueryCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Index Usage</span>
                  <span className="font-semibold">
                    {formatPercentage(dbMetrics?.indexUsageRatio || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Hit Ratio</span>
                  <span className="font-semibold">
                    {formatPercentage(dbMetrics?.cacheHitRatio || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Optimization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Last Optimization</span>
                  <span className="font-semibold">
                    {status.components.database.lastOptimization.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Health Status</span>
                  {getStatusBadge(status.components.database.health)}
                </div>
                <Button onClick={handleOptimize} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Run Optimization
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Memory Cache</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Hit Rate</span>
                  <span className="font-semibold">
                    {formatPercentage(cacheStats?.memory.hitRate || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Size</span>
                  <span className="font-semibold">
                    {cacheStats?.memory.size || 0} items
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Latency</span>
                  <span className="font-semibold">
                    {formatDuration(cacheStats?.memory.avgLatency || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Redis Cache</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Hit Rate</span>
                  <span className="font-semibold">
                    {formatPercentage(cacheStats?.redis.hitRate || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Size</span>
                  <span className="font-semibold">
                    {cacheStats?.redis.size || 0} items
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Latency</span>
                  <span className="font-semibold">
                    {formatDuration(cacheStats?.redis.avgLatency || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CDN Cache</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Hit Rate</span>
                  <span className="font-semibold">
                    {formatPercentage(cacheStats?.cdn.hitRate || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Size</span>
                  <span className="font-semibold">
                    {cacheStats?.cdn.size || 0} items
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Latency</span>
                  <span className="font-semibold">
                    {formatDuration(cacheStats?.cdn.avgLatency || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cache Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCacheWarming} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Run Cache Warming
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>CPU Usage</span>
                  <span className="font-semibold">
                    {formatPercentage(dashboard?.system.cpu.usage || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage</span>
                  <span className="font-semibold">
                    {formatPercentage(dashboard?.system.memory.usage || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Disk Usage</span>
                  <span className="font-semibold">
                    {formatPercentage(dashboard?.system.disk.usage || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Total</span>
                  <span className="font-semibold">
                    {formatBytes(dashboard?.system.memory.total || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Uptime</span>
                  <span className="font-semibold">
                    {formatDuration(dashboard?.application.uptime || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Request Count</span>
                  <span className="font-semibold">
                    {dashboard?.application.requestCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Error Count</span>
                  <span className="font-semibold">
                    {dashboard?.application.errorCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response Time</span>
                  <span className="font-semibold">
                    {formatDuration(dashboard?.application.avgResponseTime || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="loadtest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Load Testing</CardTitle>
              <CardDescription>
                Run performance tests to measure system capacity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={handleLoadTest} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Load Test
                </Button>
                
                {loadTestProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Progress</span>
                      <span>{formatPercentage(loadTestProgress.progress)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${loadTestProgress.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Elapsed: {formatDuration(loadTestProgress.elapsedTime * 1000)}</span>
                      <span>Remaining: {formatDuration(loadTestProgress.remainingTime * 1000)}</span>
                    </div>
                  </div>
                )}
                
                {loadTestResult && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Throughput</div>
                      <div className="font-semibold">
                        {loadTestResult.throughput.toFixed(1)} req/s
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Error Rate</div>
                      <div className="font-semibold">
                        {formatPercentage(loadTestResult.errorRate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg Response</div>
                      <div className="font-semibold">
                        {formatDuration(loadTestResult.avgResponseTime)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">P95 Response</div>
                      <div className="font-semibold">
                        {formatDuration(loadTestResult.p95ResponseTime)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}