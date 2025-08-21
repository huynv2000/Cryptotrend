'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/LoadingState';
import { RefreshCw, TrendingUp, TrendingDown, BarChart3, Activity, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';

import TVLBarChart from './TVLBarChart';
import MovingAverageLine from './MovingAverageLine';
import { TVLDataPoint, TVLDataPointWithMA, MAMetrics } from '@/lib/tvl-analysis-service';
import { formatYAxisTick, calculateYDomain, getPerformanceColors } from '@/lib/chart-utils';

interface OptimizedTVLHistoryChartProps {
  coinId: string;
  coinName?: string;
  timeframe?: '24H' | '7D' | '30D' | '90D';
  height?: number;
  className?: string;
  showControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ChartStats {
  currentTVL: number;
  change24h: number;
  avgTVL: number;
  peakTVL: number;
  troughTVL: number;
  volatility: number;
}

interface CombinedTVLData {
  tvlData: TVLDataPoint[];
  maData: TVLDataPointWithMA[];
  metrics: MAMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export default function OptimizedTVLHistoryChart({
  coinId,
  coinName,
  timeframe = '30D',
  height = 400,
  className,
  showControls = true,
  autoRefresh = false,
  refreshInterval = 30000
}: OptimizedTVLHistoryChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [combinedData, setCombinedData] = useState<CombinedTVLData>({
    tvlData: [],
    maData: [],
    metrics: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert timeframe to days
  const getDaysFromTimeframe = useCallback((tf: string): number => {
    switch (tf) {
      case '24H': return 1;
      case '7D': return 7;
      case '30D': return 30;
      case '90D': return 90;
      default: return 30;
    }
  }, []);

  // Optimized data fetching - single API call for both TVL and MA data
  const fetchCombinedData = useCallback(async (isRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setCombinedData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const days = getDaysFromTimeframe(selectedTimeframe);
      
      console.log(`Fetching optimized TVL data for ${coinId}, timeframe: ${selectedTimeframe}`);
      
      // Single API call to get both TVL history and moving average data
      const response = await fetch(
        `/api/v2/blockchain/tvl/combined?coinId=${coinId}&days=${days}&includeMA=true&refresh=${isRefresh}`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'max-age=600', // Extended cache time
            'Pragma': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch TVL data');
      }

      const { tvlData, maData, metrics } = result.data;
      
      setCombinedData({
        tvlData: tvlData || [],
        maData: maData || [],
        metrics: metrics || null,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });

      console.log(`Successfully fetched ${tvlData?.length || 0} TVL data points for ${coinId}`);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setCombinedData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [coinId, selectedTimeframe, getDaysFromTimeframe]);

  // Calculate chart statistics with memoization
  const stats = useMemo((): ChartStats => {
    const { tvlData } = combinedData;
    
    if (tvlData.length === 0) {
      return {
        currentTVL: 0,
        change24h: 0,
        avgTVL: 0,
        peakTVL: 0,
        troughTVL: 0,
        volatility: 0
      };
    }

    const tvls = tvlData.map(d => d.tvl);
    const currentTVL = tvls[tvls.length - 1];
    const previousTVL = tvls.length > 1 ? tvls[tvls.length - 2] : currentTVL;
    const change24h = previousTVL > 0 ? ((currentTVL - previousTVL) / previousTVL) * 100 : 0;
    
    const avgTVL = tvls.reduce((sum, tvl) => sum + tvl, 0) / tvls.length;
    const peakTVL = Math.max(...tvls);
    const troughTVL = Math.min(...tvls);
    
    // Calculate volatility (standard deviation)
    const variance = tvls.reduce((sum, tvl) => sum + Math.pow(tvl - avgTVL, 2), 0) / tvls.length;
    const volatility = Math.sqrt(variance) / avgTVL * 100;

    return {
      currentTVL,
      change24h,
      avgTVL,
      peakTVL,
      troughTVL,
      volatility
    };
  }, [combinedData.tvlData]);

  // Handle refresh with debouncing
  const handleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      fetchCombinedData(true);
    }, 300);
  }, [fetchCombinedData]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: typeof selectedTimeframe) => {
    setSelectedTimeframe(newTimeframe);
  }, []);

  // Optimized chart rendering - render both charts in a single pass
  const renderOptimizedChart = useCallback(() => {
    const { tvlData, maData } = combinedData;
    
    if (tvlData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">No Data Available</div>
            <div className="text-sm">Unable to display TVL chart</div>
          </div>
        </div>
      );
    }

    // Calculate Y-axis domain for both datasets
    const allValues = [
      ...tvlData.map(d => d.tvl),
      ...maData.map(d => d.movingAverage)
    ];
    const yDomain = calculateYDomain(allValues.map(tvl => ({ tvl })), 0.15);

    return (
      <div className="relative h-full">
        {/* TVL Bar Chart */}
        <div className="absolute inset-0">
          <TVLBarChart
            data={tvlData}
            height={height}
            showGrid={true}
            showAnimation={false} // Disable animation for better performance
          />
        </div>
        
        {/* Moving Average Overlay */}
        {showMovingAverage && maData.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <MovingAverageLine
              data={maData}
              period={30}
              height={height}
              showDots={false}
              showAnimation={false}
              showReferenceLines={false}
              color="#f59e0b"
            />
          </div>
        )}
      </div>
    );
  }, [combinedData, height, showMovingAverage]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(() => {
      fetchCombinedData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCombinedData]);

  // Initial data fetch
  useEffect(() => {
    fetchCombinedData();
  }, [fetchCombinedData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Loading state
  if (combinedData.isLoading && combinedData.tvlData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-500" />
              <span>Optimized TVL History - {coinName || coinId}</span>
            </div>
            <LoadingState text="Loading TVL data..." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height }} className="flex items-center justify-center">
            <LoadingState text="Preparing optimized chart..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (combinedData.error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-500" />
            <span>Optimized TVL History - {coinName || coinId}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height }} className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️ Error Loading Data</div>
              <div className="text-sm text-gray-600 mb-4">
                {combinedData.error}
              </div>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-500" />
            <span>Optimized TVL History - {coinName || coinId}</span>
            {combinedData.metrics && (
              <Badge 
                variant={combinedData.metrics.signal === 'buy_signal' ? 'default' : 
                         combinedData.metrics.signal === 'sell_signal' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {combinedData.metrics.signal.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={combinedData.isLoading}
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-2",
                  combinedData.isLoading && "animate-spin"
                )} />
                Refresh
              </Button>
            </div>
          )}
        </CardTitle>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {formatCurrency(stats.currentTVL)}
            </div>
            <div className="text-xs text-muted-foreground">Current TVL</div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-lg font-semibold",
              stats.change24h >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">24h Change</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {formatCurrency(stats.avgTVL)}
            </div>
            <div className="text-xs text-muted-foreground">Average TVL</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(stats.peakTVL)}
            </div>
            <div className="text-xs text-muted-foreground">Peak TVL</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">
              {stats.volatility.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Volatility</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-600">
              {combinedData.tvlData.length}
            </div>
            <div className="text-xs text-muted-foreground">Data Points</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            {/* Timeframe Selector */}
            {showControls && (
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {(['24H', '7D', '30D', '90D'] as const).map((tf) => (
                    <Button
                      key={tf}
                      variant={selectedTimeframe === tf ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTimeframeChange(tf)}
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {combinedData.lastUpdated && (
                    <span>Last updated: {format(combinedData.lastUpdated, 'HH:mm:ss')}</span>
                  )}
                </div>
              </div>
            )}

            {/* Optimized Chart */}
            <div className="w-full" style={{ height }}>
              {renderOptimizedChart()}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {combinedData.metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-amber-500" />
                      <span>30-Day Moving Average Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Current MA</div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(combinedData.metrics.currentMA)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Distance from MA</div>
                        <div className={cn(
                          "text-lg font-semibold",
                          combinedData.metrics.distanceFromMA >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {combinedData.metrics.distanceFromMA >= 0 ? '+' : ''}{combinedData.metrics.distanceFromMA.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">MA Trend</div>
                        <div className={cn(
                          "text-lg font-semibold",
                          combinedData.metrics.maTrend === 'up' ? "text-green-600" : 
                          combinedData.metrics.maTrend === 'down' ? "text-red-600" : "text-gray-600"
                        )}>
                          {combinedData.metrics.maTrend.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Signal</div>
                        <div className={cn(
                          "text-lg font-semibold",
                          combinedData.metrics.signal === 'buy_signal' ? "text-green-600" :
                          combinedData.metrics.signal === 'sell_signal' ? "text-red-600" :
                          combinedData.metrics.signal === 'overbought' ? "text-orange-600" :
                          combinedData.metrics.signal === 'oversold' ? "text-blue-600" : "text-gray-600"
                        )}>
                          {combinedData.metrics.signal.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Data Points</div>
                    <div className="text-lg font-semibold">
                      {combinedData.tvlData.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Moving Average Points</div>
                    <div className="text-lg font-semibold">
                      {combinedData.maData.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Load Time</div>
                    <div className="text-lg font-semibold text-green-600">
                      Optimized
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">API Calls</div>
                    <div className="text-lg font-semibold text-green-600">
                      Single Call
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}