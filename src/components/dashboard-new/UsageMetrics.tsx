'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { MiniChart } from './MiniChart';

interface UsageMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changePercent: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  sparklineData: number[];
  spikeAlert?: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface UsageMetricsProps {
  metrics: UsageMetric[];
  timeRange: '7D' | '30D' | '90D';
  onTimeRangeChange: (range: '7D' | '30D' | '90D') => void;
}

export function UsageMetrics({ metrics, timeRange, onTimeRangeChange }: UsageMetricsProps) {
  const formatValue = (value: number, unit: string) => {
    if (unit === 'USD') {
      if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
      return `$${value.toFixed(2)}`;
    }
    
    if (unit === 'HASH') {
      if (value >= 1e18) return `${(value / 1e18).toFixed(2)} EH/s`;
      if (value >= 1e15) return `${(value / 1e15).toFixed(2)} PH/s`;
      if (value >= 1e12) return `${(value / 1e12).toFixed(2)} TH/s`;
      return `${value.toFixed(2)} H/s`;
    }
    
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toString();
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      case 'stable': return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
    }
  };

  const renderSparkline = (data: number[]) => {
    if (!data || data.length === 0) return null;
    
    const trend = data[data.length - 1] > data[0] ? 'up' : 
                  data[data.length - 1] < data[0] ? 'down' : 'stable';
    
    return (
      <MiniChart 
        data={data}
        width={200}
        height={40}
        trend={trend}
        className={getTrendColor(trend)}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Usage & Growth Metrics</h2>
          <p className="text-gray-600 dark:text-gray-400">Key blockchain usage and growth indicators</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex space-x-2">
          {(['7D', '30D', '90D'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <Card 
            key={metric.id} 
            className={`border-l-4 ${getPriorityColor(metric.priority)} ${
              metric.spikeAlert ? 'ring-2 ring-red-200 dark:ring-red-800' : ''
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  {metric.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {metric.spikeAlert && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <Badge 
                    variant={metric.priority === 'high' ? 'destructive' : 
                             metric.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {metric.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                {timeRange} rolling average
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Main Value */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatValue(metric.value, metric.unit)}
                </div>
                <div className={`flex items-center space-x-1 ${getTrendColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                  <span className="text-sm font-medium">
                    {metric.changePercent != null ? (metric.changePercent > 0 ? '+' : '') + metric.changePercent.toFixed(2) + '%' : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Sparkline */}
              <div className="h-10">
                {renderSparkline(metric.sparklineData)}
              </div>

              {/* Change Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Change:</span>
                  <span className={`ml-1 font-medium ${getTrendColor(metric.trend)}`}>
                    {metric.change > 0 ? '+' : ''}{formatValue(metric.change, metric.unit)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Trend:</span>
                  <span className={`ml-1 font-medium ${getTrendColor(metric.trend)}`}>
                    {metric.trend.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Spike Alert */}
              {metric.spikeAlert && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Spike detected!</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}