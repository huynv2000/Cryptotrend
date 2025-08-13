'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Globe, 
  Cpu, 
  Zap,
  Clock,
  Server,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';

interface APIStatus {
  name: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: Date;
  description: string;
  error?: string;
}

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  dataCollector: 'running' | 'stopped' | 'error';
  memoryUsage: number;
  uptime: string;
  activeConnections: number;
  lastDataUpdate: Date | null;
}

interface DebugInfo {
  apiStatuses: APIStatus[];
  systemHealth: SystemHealth;
  dataCollectorStats: {
    isRunning: boolean;
    totalCollections: number;
    failedCollections: number;
    lastPriceCollection: Date | null;
    lastTechnicalCollection: Date | null;
    lastOnChainCollection: Date | null;
    lastSentimentCollection: Date | null;
    lastDerivativeCollection: Date | null;
    lastAIAnalysis: Date | null;
  };
}

export default function DebugTab() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      
      // Fetch API statuses
      const apiPromises = [
        checkAPIStatus('/api/cryptocurrencies?activeOnly=true', 'Cryptocurrencies API', 'Lấy danh sách tiền điện tử'),
        checkAPIStatus('/api/dashboard?coinId=bitcoin', 'Dashboard API', 'Lấy dữ liệu dashboard'),
        checkAPIStatus('/api/trading-signals-fast?action=signal&coinId=bitcoin', 'Trading Signals API', 'Tín hiệu giao dịch'),
        checkAPIStatus('/api/alerts-fast?action=process-data&coinId=bitcoin', 'Alerts API', 'Xử lý cảnh báo'),
        checkAPIStatus('/api/ai-analysis', 'AI Analysis API', 'Phân tích AI'),
      ];

      const apiStatuses = await Promise.allSettled(apiPromises);
      const successfulAPIs = apiStatuses
        .filter((result): result is PromiseFulfilledResult<APIStatus> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      // Fetch system health
      const systemHealth: SystemHealth = {
        database: 'healthy', // Will be updated based on actual checks
        dataCollector: 'running',
        memoryUsage: Math.random() * 100, // Mock data
        uptime: '2h 15m',
        activeConnections: Math.floor(Math.random() * 50) + 10,
        lastDataUpdate: new Date(Date.now() - Math.random() * 300000) // Within 5 minutes
      };

      // Mock data collector stats
      const dataCollectorStats = {
        isRunning: true,
        totalCollections: 127,
        failedCollections: 3,
        lastPriceCollection: new Date(Date.now() - 300000), // 5 minutes ago
        lastTechnicalCollection: new Date(Date.now() - 900000), // 15 minutes ago
        lastOnChainCollection: new Date(Date.now() - 3600000), // 1 hour ago
        lastSentimentCollection: new Date(Date.now() - 5400000), // 1.5 hours ago
        lastDerivativeCollection: new Date(Date.now() - 1800000), // 30 minutes ago
        lastAIAnalysis: new Date(Date.now() - 1800000), // 30 minutes ago
      };

      setDebugInfo({
        apiStatuses: successfulAPIs,
        systemHealth,
        dataCollectorStats
      });
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAPIStatus = async (endpoint: string, name: string, description: string): Promise<APIStatus> => {
    const startTime = Date.now();
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const responseTime = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (!response.ok) {
        status = response.status >= 500 ? 'down' : 'degraded';
      } else if (responseTime > 5000) {
        status = 'degraded';
      }

      return {
        name,
        endpoint,
        status,
        responseTime,
        lastChecked: new Date(),
        description,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        name,
        endpoint,
        status: 'down',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        description,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  useEffect(() => {
    fetchDebugInfo();
    const interval = setInterval(fetchDebugInfo, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'down' | 'running' | 'stopped' | 'error') => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
      case 'stopped':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'down' | 'running' | 'stopped' | 'error') => {
    switch (status) {
      case 'healthy':
      case 'running':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'down':
      case 'stopped':
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatResponseTime = (time: number) => {
    return `${time}ms`;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  if (loading && !debugInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Đang tải thông tin debug...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Debug & System Health</h2>
          <p className="text-gray-600">Giám sát trạng thái hệ thống và các API quan trọng</p>
        </div>
        <div className="flex items-center space-x-2">
          {lastRefresh && (
            <span className="text-sm text-gray-500">
              Cập nhật lần cuối: {lastRefresh.toLocaleTimeString('vi-VN')}
            </span>
          )}
          <Button onClick={fetchDebugInfo} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Tổng quan hệ thống</span>
          </CardTitle>
          <CardDescription>Trạng thái tổng thể của hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border ${getStatusColor(debugInfo?.systemHealth.database || 'healthy')}`}>
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span className="font-medium">Database</span>
              </div>
              <div className="mt-2 text-sm">{debugInfo?.systemHealth.database || 'healthy'}</div>
            </div>
            
            <div className={`p-4 rounded-lg border ${getStatusColor(debugInfo?.systemHealth.dataCollector || 'running')}`}>
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5" />
                <span className="font-medium">Data Collector</span>
              </div>
              <div className="mt-2 text-sm">{debugInfo?.systemHealth.dataCollector || 'running'}</div>
            </div>
            
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Memory Usage</span>
              </div>
              <div className="mt-2 text-sm">{debugInfo?.systemHealth.memoryUsage.toFixed(1) || 0}%</div>
            </div>
            
            <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Uptime</span>
              </div>
              <div className="mt-2 text-sm">{debugInfo?.systemHealth.uptime || 'N/A'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Statuses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Trạng thái API</span>
          </CardTitle>
          <CardDescription>Trạng thái các API quan trọng của hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {debugInfo?.apiStatuses.map((api, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(api.status)}
                  <div>
                    <div className="font-medium">{api.name}</div>
                    <div className="text-sm text-gray-600">{api.description}</div>
                    <div className="text-xs text-gray-500">{api.endpoint}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm">
                      <Badge className={getStatusColor(api.status)}>
                        {api.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">{formatResponseTime(api.responseTime)}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(api.lastChecked)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Collector Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Data Collector Statistics</span>
          </CardTitle>
          <CardDescription>Thống kê quá trình thu thập dữ liệu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Tổng quan</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trạng thái:</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(debugInfo?.dataCollectorStats.isRunning ? 'running' : 'stopped')}
                    <span className="text-sm">{debugInfo?.dataCollectorStats.isRunning ? 'Đang chạy' : 'Đã dừng'}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tổng số lần thu thập:</span>
                  <span className="text-sm font-medium">{debugInfo?.dataCollectorStats.totalCollections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Số lần thất bại:</span>
                  <span className="text-sm font-medium text-red-600">{debugInfo?.dataCollectorStats.failedCollections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tỷ lệ thành công:</span>
                  <span className="text-sm font-medium">
                    {debugInfo?.dataCollectorStats.totalCollections 
                      ? ((1 - debugInfo.dataCollectorStats.failedCollections / debugInfo.dataCollectorStats.totalCollections) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Lần thu thập gần nhất</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Giá cả:</span>
                  <span className="text-sm">{formatTime(debugInfo?.dataCollectorStats.lastPriceCollection)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phân tích kỹ thuật:</span>
                  <span className="text-sm">{formatTime(debugInfo?.dataCollectorStats.lastTechnicalCollection)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">On-chain:</span>
                  <span className="text-sm">{formatTime(debugInfo?.dataCollectorStats.lastOnChainCollection)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phân tích AI:</span>
                  <span className="text-sm">{formatTime(debugInfo?.dataCollectorStats.lastAIAnalysis)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Thông tin hệ thống</span>
          </CardTitle>
          <CardDescription>Thông tin chi tiết về môi trường hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Phiên bản:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Môi trường:</span>
                <span>{process.env.NODE_ENV || 'development'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Cổng:</span>
                <span>3000</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Kết nối đang hoạt động:</span>
                <span>{debugInfo?.systemHealth.activeConnections || 0}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Cập nhật dữ liệu lần cuối:</span>
                <span>{formatTime(debugInfo?.systemHealth.lastDataUpdate)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Trạng thái kết nối:</span>
                <div className="flex items-center space-x-1">
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}