'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/LoadingState';
import { RefreshCw, TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';

import TVLBarChart from './TVLBarChart';
import MovingAverageLine from './MovingAverageLine';

import { useOptimizedTVLHistory } from '@/hooks/useOptimizedTVLHistory';
import { TVLDataPoint, TVLDataPointWithMA, MAMetrics } from '@/lib/tvl-analysis-service';

interface TVLHistoryChartOptimizedProps {
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

export default function TVLHistoryChartOptimized({
  coinId,
  coinName,
  timeframe = '30D',
  height = 500,
  className,
  showControls = true,
  autoRefresh = false,
  refreshInterval = 30000
}: TVLHistoryChartOptimizedProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use optimized hook that combines both data sources
  const {
    data: tvlHistory,
    movingAverageData,
    metrics,
    stats,
    loading,
    error,
    refetch,
    mutate,
    refreshMetrics,
    cacheInfo,
    analysis
  } = useOptimizedTVLHistory({
    coinId,
    timeframe: selectedTimeframe,
    enabled: true,
    refetchInterval: autoRefresh ? refreshInterval : undefined,
    includeMovingAverage: true,
    includeMetrics: true,
    onSuccess: (data) => {
      setLastUpdated(new Date());
    }
  });

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await refetch();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refetch]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: typeof selectedTimeframe) => {
    setSelectedTimeframe(newTimeframe);
  }, []);

  // Render chart with optimized performance
  const renderChart = useCallback(() => {
    if (tvlHistory.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">No Data Available</div>
            <div className="text-sm">Unable to display TVL chart</div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full">
        {/* Bar Chart */}
        <div className="absolute inset-0">
          <TVLBarChart
            data={tvlHistory}
            height={height}
            showGrid={true}
            showAnimation={true}
          />
        </div>
        
        {/* Moving Average Overlay */}
        {showMovingAverage && movingAverageData.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <MovingAverageLine
              data={movingAverageData.slice(0, tvlHistory.length)}
              period={30}
              height={height}
              showDots={false}
              showAnimation={true}
              showReferenceLines={false}
              color="#f59e0b"
            />
          </div>
        )}
      </div>
    );
  }, [tvlHistory, movingAverageData, showMovingAverage, height]);

  // Loading state
  if (loading && tvlHistory.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span>TVL History - {coinName || coinId}</span>
            </div>
            <LoadingState text="Loading TVL data..." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height }} className="flex items-center justify-center">
            <LoadingState text="Preparing chart..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <span>TVL History - {coinName || coinId}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height }} className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️ Error Loading Data</div>
              <div className="text-sm text-gray-600 mb-4">
                {error}
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
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <span>TVL History - {coinName || coinId}</span>
            {analysis && (
              <Badge 
                variant={analysis.trend === 'bullish' ? 'default' : analysis.trend === 'bearish' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {analysis.trend.toUpperCase()}
              </Badge>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-2",
                  isLoading && "animate-spin"
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
              stats.change24h != null && stats.change24h >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {stats.change24h != null ? (stats.change24h >= 0 ? '+' : '') + stats.change24h.toFixed(2) + '%' : 'N/A'}
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
              {stats.volatility != null ? stats.volatility.toFixed(1) + '%' : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">Volatility</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-600">
              {tvlHistory.length}
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
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                  {lastUpdated && (
                    <span>Last updated: {format(lastUpdated, 'HH:mm:ss')}</span>
                  )}
                  {cacheInfo.hit && (
                    <Badge variant="secondary" className="text-xs">
                      Cached
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="w-full" style={{ height }}>
              {renderChart()}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Moving Average Analysis */}
              {metrics && (
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
                          {formatCurrency(metrics.currentMA)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Distance from MA</div>
                        <div className={cn(
                          "text-lg font-semibold",
                          metrics.distanceFromMA != null && metrics.distanceFromMA >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {metrics.distanceFromMA != null ? (metrics.distanceFromMA >= 0 ? '+' : '') + metrics.distanceFromMA.toFixed(2) + '%' : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">MA Trend</div>
                        <div className={cn(
                          "text-lg font-semibold",
                          metrics.maTrend === 'up' ? "text-green-600" : 
                          metrics.maTrend === 'down' ? "text-red-600" : "text-gray-600"
                        )}>
                          {metrics.maTrend.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Signal</div>
                        <div className={cn(
                          "text-lg font-semibold",
                          metrics.signal === 'buy_signal' ? "text-green-600" :
                          metrics.signal === 'sell_signal' ? "text-red-600" :
                          metrics.signal === 'overbought' ? "text-orange-600" :
                          metrics.signal === 'oversold' ? "text-blue-600" : "text-gray-600"
                        )}>
                          {metrics.signal.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>Market Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Trend Direction</div>
                      <div className={cn(
                        "text-lg font-semibold",
                        analysis.trend === 'bullish' ? "text-green-600" : 
                        analysis.trend === 'bearish' ? "text-red-600" : "text-gray-600"
                      )}>
                        {analysis.trend.charAt(0).toUpperCase() + analysis.trend.slice(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Signal Strength</div>
                      <div className="text-lg font-semibold">
                        {analysis.strength != null ? analysis.strength.toFixed(0) + '%' : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Current Signal</div>
                      <div className="text-lg font-semibold">
                        {analysis.signal.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Volatility</div>
                      <div className="text-lg font-semibold text-orange-600">
                        {stats.volatility != null ? stats.volatility.toFixed(1) + '%' : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Chart Settings</h3>
                  <p className="text-sm text-muted-foreground">Customize chart display options</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Display Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Moving Average</span>
                      {/* Add toggle switch here */}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Grid Lines</span>
                      {/* Add toggle switch here */}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Animation</span>
                      {/* Add toggle switch here */}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Chart Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Default Timeframe</span>
                      {/* Add selector here */}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Chart Type</span>
                      {/* Add selector here */}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Color Scheme</span>
                      {/* Add selector here */}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}