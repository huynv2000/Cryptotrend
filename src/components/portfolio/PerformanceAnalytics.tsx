// Performance Analytics Component
// Displays various performance metrics, benchmark comparison, and risk metrics

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercentage: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  bestDay: number;
  worstDay: number;
}

interface BenchmarkData {
  name: string;
  returnPercentage: number;
  volatility: number;
  sharpeRatio: number;
}

interface PerformanceDataPoint {
  date: string;
  portfolioValue: number;
  benchmarkValue: number;
  portfolioReturn: number;
  benchmarkReturn: number;
}

interface PerformanceAnalyticsProps {
  userId?: string;
  timeframe?: '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
  className?: string;
}

export default function PerformanceAnalytics({ 
  userId, 
  timeframe = '1m', 
  className 
}: PerformanceAnalyticsProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, [userId, timeframe]);

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('timeframe', timeframe);

      const response = await fetch(`/api/portfolio/performance?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setBenchmarks(data.benchmarks || []);
      setPerformanceData(data.performanceData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching performance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDecimal = (value: number, decimals: number = 2): string => {
    return value.toFixed(decimals);
  };

  const getRiskLevel = (volatility: number): string => {
    if (volatility < 10) return 'Low';
    if (volatility < 20) return 'Medium';
    if (volatility < 30) return 'High';
    return 'Very High';
  };

  const getRiskColor = (volatility: number): string => {
    if (volatility < 10) return 'text-green-600';
    if (volatility < 20) return 'text-yellow-600';
    if (volatility < 30) return 'text-orange-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>Detailed performance metrics and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <LoadingState message="Loading performance data..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>Detailed performance metrics and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-2">Error loading performance data</div>
              <div className="text-sm text-muted-foreground mb-4">{error}</div>
              <button
                onClick={fetchPerformanceData}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>Detailed performance metrics and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-lg font-medium mb-2">No performance data available</div>
            <div className="text-muted-foreground">
              Add positions to your portfolio to see performance analytics
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
        <CardDescription>Detailed performance metrics and analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Returns Overview */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Returns Overview</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Total Return</div>
              <div className={cn(
                'text-lg font-bold',
                metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(metrics.totalReturn)} ({formatPercentage(metrics.totalReturnPercentage)})
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Daily Return</div>
              <div className={cn(
                'text-lg font-bold',
                metrics.dailyReturn >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatPercentage(metrics.dailyReturn)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Monthly Return</div>
              <div className={cn(
                'text-lg font-bold',
                metrics.monthlyReturn >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatPercentage(metrics.monthlyReturn)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Yearly Return</div>
              <div className={cn(
                'text-lg font-bold',
                metrics.yearlyReturn >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatPercentage(metrics.yearlyReturn)}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Risk Metrics</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Volatility</div>
              <div className="text-lg font-bold">
                {formatPercentage(metrics.volatility)}
              </div>
              <Badge variant="outline" className={getRiskColor(metrics.volatility)}>
                {getRiskLevel(metrics.volatility)} Risk
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Sharpe Ratio</div>
              <div className="text-lg font-bold">
                {formatDecimal(metrics.sharpeRatio)}
              </div>
              <Badge variant={metrics.sharpeRatio > 1 ? 'default' : 'secondary'}>
                {metrics.sharpeRatio > 1 ? 'Good' : 'Poor'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Max Drawdown</div>
              <div className="text-lg font-bold text-red-600">
                {formatPercentage(metrics.maxDrawdown)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Win Rate</div>
              <div className="text-lg font-bold">
                {formatPercentage(metrics.winRate)}
              </div>
            </div>
          </div>
        </div>

        {/* Best/Worst Performance */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Best & Worst Performance</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-2">Best Day</div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(metrics.bestDay)}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-2">Worst Day</div>
              <div className="text-2xl font-bold text-red-600">
                {formatPercentage(metrics.worstDay)}
              </div>
            </div>
          </div>
        </div>

        {/* Benchmark Comparison */}
        {benchmarks.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Benchmark Comparison</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']} />
                  <Bar dataKey="returnPercentage" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Performance vs Benchmark Chart */}
        {performanceData.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Performance vs Benchmark</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}%`,
                      name === 'portfolioReturn' ? 'Portfolio' : 'Benchmark'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="portfolioReturn" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Portfolio"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmarkReturn" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Benchmark"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}