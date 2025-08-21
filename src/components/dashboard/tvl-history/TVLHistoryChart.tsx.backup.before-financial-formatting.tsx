'use client';

import React, { useState, useCallback } from 'react';
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
import ProgressiveChart from './ProgressiveChart';

import { useTVLHistory } from '@/hooks/useTVLHistory';
import { useMovingAverage } from '@/hooks/useMovingAverage';
import { TVLDataPoint, TVLDataPointWithMA, MAMetrics } from '@/lib/tvl-analysis-service';
import { performanceManager } from '@/lib/performance-utils';

interface TVLHistoryChartProps {
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

export default function TVLHistoryChart({
  coinId,
  coinName,
  timeframe = '30D',
  height = 500,
  className,
  showControls = true,
  autoRefresh = false,
  refreshInterval = 30000
}: TVLHistoryChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch TVL history data
  const {
    data: tvlHistory,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
    cacheInfo: historyCacheInfo
  } = useTVLHistory({
    coinId,
    timeframe: selectedTimeframe,
    enabled: true,
    refetchInterval: autoRefresh ? refreshInterval : undefined,
    onSuccess: (data) => {
      setLastUpdated(new Date());
    }
  });

  // Fetch moving average data
  const {
    data: maData,
    metrics: maMetrics,
    loading: maLoading,
    error: maError,
    refetch: refetchMA,
    analysis: maAnalysis
  } = useMovingAverage({
    coinId,
    period: 30,
    enabled: true,
    autoRefresh,
    refetchInterval: refreshInterval,
    onMetricsChange: (metrics) => {
      console.log('MA metrics updated:', metrics);
    }
  });

  // Calculate chart statistics
  const calculateStats = useCallback((data: TVLDataPoint[]): ChartStats => {
    if (data.length === 0) {
      return {
        currentTVL: 0,
        change24h: 0,
        avgTVL: 0,
        peakTVL: 0,
        troughTVL: 0,
        volatility: 0
      };
    }

    const tvls = data.map(d => d.tvl);
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
  }, []);

  const stats = calculateStats(tvlHistory);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([refetchHistory(), refetchMA()]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refetchHistory, refetchMA]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: typeof selectedTimeframe) => {
    setSelectedTimeframe(newTimeframe);
  }, []);

  // Render combined chart with progressive loading
  const renderCombinedChart = useCallback((data: TVLDataPoint[], chunkIndex: number) => {
    // For simplicity, we'll render the bar chart and MA overlay
    // In a real implementation, you might want more sophisticated chart composition
    return (
      <div className="relative h-full">
        {/* Bar Chart */}
        <div className="absolute inset-0">
          <TVLBarChart
            data={data}
            height={height}
            showGrid={true}
            showAnimation={chunkIndex === 0} // Only animate first chunk
          />
        </div>
        
        {/* Moving Average Overlay */}
        {showMovingAverage && maData.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <MovingAverageLine
              data={maData.slice(0, data.length)}
              period={30}
              height={height}
              showDots={false}
              showAnimation={chunkIndex === 0}
              showReferenceLines={false}
              color="#f59e0b"
            />
          </div>
        )}
      </div>
    );
  }, [height, showMovingAverage, maData]);

  // Loading state
  if (historyLoading && tvlHistory.length === 0) {
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
  if (historyError || maError) {
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
                {historyError || maError || 'Failed to load TVL history'}
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
            {maAnalysis && (
              <Badge 
                variant={maAnalysis.trend === 'bullish' ? 'default' : maAnalysis.trend === 'bearish' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {maAnalysis.trend.toUpperCase()}
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
                  {historyCacheInfo.hit && (
                    <Badge variant="secondary" className="text-xs">
                      Cached
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Progressive Chart */}
            <ProgressiveChart
              data={tvlHistory}
              renderChunk={renderCombinedChart}
              chunkSize={10}
              height={height}
              className="w-full"
              threshold={0.1}
              rootMargin="50px"
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Moving Average Analysis */}
              {maMetrics && (
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
                          {formatCurrency(maMetrics.currentMA)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Distance from MA</div>
                        <div className={cn(
                          "text-lg font-semibold",
                          maMetrics.distanceFromMA >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {maMetrics.distanceFromMA >= 0 ? '+' : ''}{maMetrics.distanceFromMA.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">MA Trend</div>
                        <div className={cn(
                          "text-lg font-semibold",
                          maMetrics.maTrend === 'up' ? "text-green-600" : 
                          maMetrics.maTrend === 'down' ? "text-red-600" : "text-gray-600"
                        )}>
                          {maMetrics.maTrend.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Signal</div>
                        <div className={cn(
                          "text-lg font-semibold",
                          maMetrics.signal === 'buy_signal' ? "text-green-600" :
                          maMetrics.signal === 'sell_signal' ? "text-red-600" :
                          maMetrics.signal === 'overbought' ? "text-orange-600" :
                          maMetrics.signal === 'oversold' ? "text-blue-600" : "text-gray-600"
                        )}>
                          {maMetrics.signal.replace('_', ' ').toUpperCase()}
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
                        maAnalysis.trend === 'bullish' ? "text-green-600" : 
                        maAnalysis.trend === 'bearish' ? "text-red-600" : "text-gray-600"
                      )}>
                        {maAnalysis.trend.charAt(0).toUpperCase() + maAnalysis.trend.slice(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Signal Strength</div>
                      <div className="text-lg font-semibold">
                        {maAnalysis.strength.toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Volatility</div>
                      <div className="text-lg font-semibold text-orange-600">
                        {stats.volatility.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Data Quality</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {tvlHistory.length >= 25 ? "High" : tvlHistory.length >= 15 ? "Medium" : "Low"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chart Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Show Moving Average</div>
                    <div className="text-sm text-muted-foreground">
                      Display 30-day moving average line
                    </div>
                  </div>
                  <Button
                    variant={showMovingAverage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowMovingAverage(!showMovingAverage)}
                  >
                    {showMovingAverage ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Refresh</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically refresh data every {refreshInterval / 1000}s
                    </div>
                  </div>
                  <Button
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      // This would typically update state or context
                      console.log('Auto refresh toggled');
                    }}
                  >
                    {autoRefresh ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Cache Status</div>
                    <div className="text-sm text-muted-foreground">
                      {historyCacheInfo.hit ? 'Using cached data' : 'Fresh data loaded'}
                    </div>
                  </div>
                  <Badge variant={historyCacheInfo.hit ? "secondary" : "default"}>
                    {historyCacheInfo.hit ? 'Cached' : 'Live'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}