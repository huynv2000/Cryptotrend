'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, ArrowRight, ArrowLeft, Zap, Building, PieChart, Activity } from 'lucide-react';

interface CashFlowMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changePercent: number;
  unit: string;
  trend: 'inflow' | 'outflow' | 'stable';
  icon: React.ReactNode;
  description: string;
  breakdown?: {
    label: string;
    value: number;
    percentage: number;
  }[];
  spikeAlert?: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface CashFlowMetricsProps {
  metrics: CashFlowMetric[];
  timeRange: '7D' | '30D' | '90D';
  onTimeRangeChange: (range: '7D' | '30D' | '90D') => void;
}

export function CashFlowMetrics({ metrics, timeRange, onTimeRangeChange }: CashFlowMetricsProps) {
  const formatValue = (value: number, unit: string) => {
    if (unit === 'USD') {
      if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
      return `$${value.toFixed(2)}`;
    }
    
    if (unit === '%') {
      return `${value.toFixed(2)}%`;
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

  const getTrendIcon = (trend: 'inflow' | 'outflow' | 'stable') => {
    switch (trend) {
      case 'inflow': return <ArrowRight className="w-4 h-4" />;
      case 'outflow': return <ArrowLeft className="w-4 h-4" />;
      case 'stable': return <Activity className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: 'inflow' | 'outflow' | 'stable') => {
    switch (trend) {
      case 'inflow': return 'text-green-600';
      case 'outflow': return 'text-red-600';
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

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cash Flow Metrics</h2>
          <p className="text-gray-600 dark:text-gray-400">Detailed cash flow and movement analysis</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric) => (
          <Card 
            key={metric.id} 
            className={`border-l-4 ${getPriorityColor(metric.priority)} ${
              metric.spikeAlert ? 'ring-2 ring-red-200 dark:ring-red-800' : ''
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    {metric.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      {metric.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={metric.priority === 'high' ? 'destructive' : 
                             metric.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {metric.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
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
                    {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(2)}%
                  </span>
                </div>
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
                  <span className="text-gray-600 dark:text-gray-400">Flow:</span>
                  <span className={`ml-1 font-medium ${getTrendColor(metric.trend)}`}>
                    {metric.trend.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Breakdown */}
              {metric.breakdown && metric.breakdown.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Breakdown:</h4>
                  <div className="space-y-2">
                    {metric.breakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {item.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatValue(item.value, metric.unit)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spike Alert */}
              {metric.spikeAlert && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Unusual flow detected!</span>
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