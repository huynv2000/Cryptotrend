'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  avgResponseTime: number;
  totalRequests: number;
  cacheSize: number;
  memoryUsage: number;
  evictionRate: number;
  compressionRatio: number;
}

interface CacheHealth {
  status: 'HEALTHY' | 'WARNING' | 'ERROR';
  issues: string[];
  recommendations: string[];
}

interface CacheStats {
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
  timestamp: string;
}

export const CachePerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [health, setHealth] = useState<CacheHealth | null>(null);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadCacheData();
    const interval = setInterval(loadCacheData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadCacheData = async () => {
    try {
      setLoading(true);
      
      const [metricsResponse, healthResponse, statsResponse] = await Promise.all([
        fetch('/api/performance/cache?action=metrics'),
        fetch('/api/performance/cache?action=health'),
        fetch('/api/performance/cache?action=stats')
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.data);
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealth(healthData.data);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load cache data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWarmCache = async () => {
    try {
      const response = await fetch('/api/performance/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'warm',
          keys: ['market-data:bitcoin', 'market-data:ethereum'],
          data: [{ price: 50000, volume: 1000000 }, { price: 3000, volume: 500000 }]
        })
      });

      if (response.ok) {
        await loadCacheData();
      }
    } catch (error) {
      console.error('Failed to warm cache:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/performance/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });

      if (response.ok) {
        await loadCacheData();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'bg-green-500';
      case 'WARNING': return 'bg-yellow-500';
      case 'ERROR': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const cacheLayerData = stats ? [
    { name: 'Memory', hitRate: stats.memory.hitRate, size: stats.memory.size, latency: stats.memory.avgLatency },
    { name: 'Redis', hitRate: stats.redis.hitRate, size: stats.redis.size, latency: stats.redis.avgLatency },
    { name: 'CDN', hitRate: stats.cdn.hitRate, size: stats.cdn.size, latency: stats.cdn.avgLatency },
  ] : [];

  const hitRateData = metrics ? [
    { name: 'Hit Rate', value: metrics.hitRate, color: '#22c55e' },
    { name: 'Miss Rate', value: metrics.missRate, color: '#ef4444' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading cache performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Performance Dashboard</h2>
          <p className="text-gray-600">
            {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleWarmCache} variant="outline">
            Warm Cache
          </Button>
          <Button onClick={handleClearCache} variant="outline">
            Clear Cache
          </Button>
          <Button onClick={loadCacheData}>
            Refresh
          </Button>
        </div>
      </div>

      {health && health.issues.length > 0 && (
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <strong>Cache Health Issues:</strong>
              <ul className="list-disc list-inside">
                {health.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
              <strong>Recommendations:</strong>
              <ul className="list-disc list-inside">
                {health.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
                <Badge variant={metrics.hitRate > 80 ? "default" : "destructive"}>
                  {metrics.hitRate.toFixed(1)}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.hitRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Miss Rate: {metrics.missRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Badge variant={metrics.avgResponseTime < 50 ? "default" : "destructive"}>
                  {metrics.avgResponseTime < 50 ? "Fast" : "Slow"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(metrics.avgResponseTime)}</div>
                <p className="text-xs text-muted-foreground">
                  Target: &lt;50ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Badge variant="outline">
                  {metrics.totalRequests.toLocaleString()}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Cache Size: {formatBytes(metrics.cacheSize)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                <Badge 
                  variant={health?.status === 'HEALTHY' ? "default" : health?.status === 'WARNING' ? "secondary" : "destructive"}
                >
                  {health?.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health?.status || 'Unknown'}</div>
                <p className="text-xs text-muted-foreground">
                  {health?.issues.length || 0} issues
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="layers">Cache Layers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {metrics && (
              <Card>
                <CardHeader>
                  <CardTitle>Hit Rate Distribution</CardTitle>
                  <CardDescription>Cache hit vs miss rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={hitRateData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {hitRateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Cache Layer Performance</CardTitle>
                  <CardDescription>Performance by cache layer</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cacheLayerData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="hitRate" fill="#22c55e" name="Hit Rate (%)" />
                      <Bar dataKey="latency" fill="#3b82f6" name="Latency (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="layers" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Memory Cache</CardTitle>
                  <CardDescription>L1 - Fastest access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <Badge variant={stats.memory.hitRate > 80 ? "default" : "destructive"}>
                        {stats.memory.hitRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatBytes(stats.memory.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Latency:</span>
                      <span>{formatDuration(stats.memory.avgLatency)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Redis Cache</CardTitle>
                  <CardDescription>L2 - Fast distributed cache</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <Badge variant={stats.redis.hitRate > 70 ? "default" : "destructive"}>
                        {stats.redis.hitRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatBytes(stats.redis.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Latency:</span>
                      <span>{formatDuration(stats.redis.avgLatency)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>CDN Cache</CardTitle>
                  <CardDescription>L3 - Global edge cache</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <Badge variant={stats.cdn.hitRate > 60 ? "default" : "destructive"}>
                        {stats.cdn.hitRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatBytes(stats.cdn.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Latency:</span>
                      <span>{formatDuration(stats.cdn.avgLatency)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed cache performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.hitRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Hit Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatDuration(metrics.avgResponseTime)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics.totalRequests.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatBytes(metrics.cacheSize)}
                    </div>
                    <div className="text-sm text-gray-600">Cache Size</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};