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
  Legend,
  ComposedChart,
  Scatter
} from 'recharts';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Server
} from 'lucide-react';

interface SystemMetrics {
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
  timestamp: string;
}

interface ApplicationMetrics {
  uptime: number;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  activeConnections: number;
  timestamp: string;
}

interface DatabaseMetrics {
  activeConnections: number;
  slowQueryCount: number;
  indexUsageRatio: number;
  cacheHitRatio: number;
  avgQueryTime: number;
  timestamp: string;
}

interface CacheMetrics {
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

interface PerformanceAlert {
  id: string;
  type: 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'SYSTEM' | 'DATABASE' | 'CACHE' | 'APPLICATION';
  title: string;
  description: string;
  value: number;
  threshold: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

interface PerformanceDashboard {
  system: SystemMetrics;
  application: ApplicationMetrics;
  database: DatabaseMetrics;
  cache: CacheMetrics;
  alerts: PerformanceAlert[];
  health: 'HEALTHY' | 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: string;
}

export const PerformanceMonitoringDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<PerformanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/performance/monitoring?action=dashboard');
      
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/performance/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve-alert',
          alertId
        })
      });

      if (response.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'bg-green-500';
      case 'WARNING': return 'bg-yellow-500';
      case 'ERROR': return 'bg-red-500';
      case 'CRITICAL': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'ERROR': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'CRITICAL': return <XCircle className="h-4 w-4 text-red-700" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getResourceUsageData = () => {
    if (!dashboard) return [];
    
    return [
      { name: 'CPU', usage: dashboard.system.cpu.usage, type: 'cpu' },
      { name: 'Memory', usage: dashboard.system.memory.usage, type: 'memory' },
      { name: 'Disk', usage: dashboard.system.disk.usage, type: 'disk' },
    ];
  };

  const getResponseTimeData = () => {
    if (!dashboard) return [];
    
    return [
      { name: 'Average', time: dashboard.application.avgResponseTime },
      { name: 'P95', time: dashboard.application.p95ResponseTime },
      { name: 'P99', time: dashboard.application.p99ResponseTime },
    ];
  };

  const getCacheHitRateData = () => {
    if (!dashboard) return [];
    
    return [
      { name: 'Memory', rate: dashboard.cache.memory.hitRate },
      { name: 'Redis', rate: dashboard.cache.redis.hitRate },
      { name: 'CDN', rate: dashboard.cache.cdn.hitRate },
    ];
  };

  const getAlertDistribution = () => {
    if (!dashboard) return [];
    
    const activeAlerts = dashboard.alerts.filter(alert => !alert.resolved);
    const typeCounts = activeAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'WARNING', value: typeCounts.WARNING || 0, color: '#eab308' },
      { name: 'ERROR', value: typeCounts.ERROR || 0, color: '#ef4444' },
      { name: 'CRITICAL', value: typeCounts.CRITICAL || 0, color: '#dc2626' },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading performance monitoring data...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Failed to load dashboard data</p>
          <Button onClick={loadDashboardData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const activeAlerts = dashboard.alerts.filter(alert => !alert.resolved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring Dashboard</h2>
          <p className="text-gray-600">
            {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(dashboard.health)}
            <Badge className={getStatusColor(dashboard.health)}>
              {dashboard.health}
            </Badge>
          </div>
          <Button onClick={loadDashboardData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <strong>Active Alerts ({activeAlerts.length}):</strong>
              <div className="space-y-1">
                {activeAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between">
                    <span className="text-sm">
                      {alert.category}: {alert.title} - {alert.description}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                ))}
                {activeAlerts.length > 3 && (
                  <p className="text-sm text-gray-600">
                    +{activeAlerts.length - 3} more alerts
                  </p>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {getStatusIcon(dashboard.health)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.health}</div>
            <p className="text-xs text-muted-foreground">
              {activeAlerts.length} active alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(dashboard.application.uptime)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.application.requestCount.toLocaleString()} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(dashboard.application.avgResponseTime)}</div>
            <p className="text-xs text-muted-foreground">
              P95: {formatDuration(dashboard.application.p95ResponseTime)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${dashboard.application.errorCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.application.errorCount}</div>
            <p className="text-xs text-muted-foreground">
              {((dashboard.application.errorCount / dashboard.application.requestCount) * 100 || 0).toFixed(2)}% error rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>System resource utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getResourceUsageData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>Application response time metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getResponseTimeData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatDuration(value as number)} />
                    <Bar dataKey="time" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
                <CardDescription>Cache hit rates across layers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getCacheHitRateData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Distribution</CardTitle>
                <CardDescription>Active alerts by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getAlertDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getAlertDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5" />
                  <span>CPU Usage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Usage</span>
                    <span className="font-semibold">{dashboard.system.cpu.usage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Load (1m)</span>
                    <span className="font-semibold">{dashboard.system.cpu.load1m.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Load (5m)</span>
                    <span className="font-semibold">{dashboard.system.cpu.load5m.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Load (15m)</span>
                    <span className="font-semibold">{dashboard.system.cpu.load15m.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5" />
                  <span>Memory Usage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Used</span>
                    <span className="font-semibold">{formatBytes(dashboard.system.memory.used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-semibold">{formatBytes(dashboard.system.memory.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free</span>
                    <span className="font-semibold">{formatBytes(dashboard.system.memory.free)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage</span>
                    <span className="font-semibold">{dashboard.system.memory.usage.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>Disk Usage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Used</span>
                    <span className="font-semibold">{formatBytes(dashboard.system.disk.used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-semibold">{formatBytes(dashboard.system.disk.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free</span>
                    <span className="font-semibold">{formatBytes(dashboard.system.disk.free)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage</span>
                    <span className="font-semibold">{dashboard.system.disk.usage.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="application" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Requests</span>
                    <span className="font-semibold">{dashboard.application.requestCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Count</span>
                    <span className="font-semibold">{dashboard.application.errorCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Connections</span>
                    <span className="font-semibold">{dashboard.application.activeConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate</span>
                    <span className="font-semibold">
                      {((dashboard.application.errorCount / dashboard.application.requestCount) * 100 || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Connections</span>
                    <span className="font-semibold">{dashboard.database.activeConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slow Queries</span>
                    <span className="font-semibold">{dashboard.database.slowQueryCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Index Usage</span>
                    <span className="font-semibold">{dashboard.database.indexUsageRatio.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hit Ratio</span>
                    <span className="font-semibold">{dashboard.database.cacheHitRatio.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                System alerts and notifications requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold">No Active Alerts</p>
                  <p className="text-gray-600">All systems are operating normally</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={alert.type === 'CRITICAL' ? 'destructive' : alert.type === 'ERROR' ? 'destructive' : 'secondary'}>
                            {alert.type}
                          </Badge>
                          <Badge variant="outline">{alert.category}</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      </div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Value: {alert.value} (Threshold: {alert.threshold})</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};