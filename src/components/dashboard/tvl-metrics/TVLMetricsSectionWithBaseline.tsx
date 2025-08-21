// TVL Metrics Section Component with Baseline Comparison
// Enhanced version that displays current values and baseline comparisons

'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Layers, Target, DollarSign, Percent, Hash, RefreshCw, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MetricCardWithBaseline from '../ui/MetricCardWithBaseline';
import { LoadingState } from '@/components/LoadingState';
import { cn, formatNumber, formatCurrency, formatCurrencyCompact, formatCurrencyDetailed } from '@/lib/utils';
import type { TVLMetrics, BlockchainValue, TimeframeValue } from '@/lib/types';

// TVL History imports
import TVLBarChart from '../tvl-history/TVLBarChart';
import MovingAverageLine from '../tvl-history/MovingAverageLine';
import { useOptimizedTVLHistory } from '@/hooks/useOptimizedTVLHistory';
import { format } from 'date-fns';

interface TVLMetricsSectionProps {
  blockchain: BlockchainValue;
  timeframe: TimeframeValue;
  data: TVLMetrics | null;
  isLoading: boolean;
}

const tvlMetricsConfig = [
  {
    key: 'chainTVL',
    title: 'Chain TVL',
    description: 'Total Value Locked in this blockchain',
    icon: <DollarSign className="h-5 w-5 text-green-500" />,
    formatType: 'currency' as const,
    isPositiveGood: true
  },
  {
    key: 'tvlDominance',
    title: 'Market Dominance',
    description: 'Market share of total DeFi TVL',
    icon: <Percent className="h-5 w-5 text-purple-500" />,
    formatType: 'percent' as const,
    isPositiveGood: true
  },
  {
    key: 'tvlRank',
    title: 'TVL Rank',
    description: 'Global ranking by TVL',
    icon: <Target className="h-5 w-5 text-orange-500" />,
    formatType: 'number' as const,
    isPositiveGood: false // Lower rank is better
  },
  {
    key: 'tvlToMarketCapRatio',
    title: 'TVL/MC Ratio',
    description: 'TVL to Market Cap ratio',
    icon: <Hash className="h-5 w-5 text-yellow-500" />,
    formatType: 'number' as const,
    isPositiveGood: true
  },
];

export default function TVLMetricsSectionWithBaseline({
  blockchain,
  timeframe,
  data,
  isLoading
}: TVLMetricsSectionProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
  // TVL History state
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24H' | '7D' | '30D' | '90D'>('30D');
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [isTVLLoading, setIsTVLLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get coin ID from blockchain
  const getCoinId = (blockchain: BlockchainValue): string => {
    switch (blockchain) {
      case 'Ethereum': return 'ethereum';
      case 'BSC': return 'binance-smart-chain';
      case 'Polygon': return 'polygon';
      case 'Arbitrum': return 'arbitrum';
      case 'Optimism': return 'optimism';
      default: return blockchain.toLowerCase();
    }
  };

  const coinId = getCoinId(blockchain);

  // Use optimized TVL history hook
  const {
    data: tvlHistory,
    movingAverageData,
    metrics,
    stats,
    loading: tvlLoading,
    error: tvlError,
    refetch,
    cacheInfo,
    analysis
  } = useOptimizedTVLHistory({
    coinId,
    timeframe: selectedTimeframe,
    enabled: true,
    includeMovingAverage: true,
    includeMetrics: true,
    onSuccess: (data) => {
      setLastUpdated(new Date());
    }
  });

  const handleMetricClick = (metricKey: string) => {
    setSelectedMetric(selectedMetric === metricKey ? null : metricKey);
  };

  // Handle TVL refresh
  const handleTVLRefresh = async () => {
    setIsTVLLoading(true);
    try {
      await refetch();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing TVL data:', error);
    } finally {
      setIsTVLLoading(false);
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: typeof selectedTimeframe) => {
    setSelectedTimeframe(newTimeframe);
  };

  // Render TVL chart
  const renderTVLChart = () => {
    if (tvlHistory.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">No Data Available</div>
            <div className="text-sm">Unable to display TVL chart</div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-96">
        {/* Bar Chart */}
        <div className="absolute inset-0">
          <TVLBarChart
            data={tvlHistory}
            height={384}
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
              height={384}
              showDots={false}
              showAnimation={true}
              showReferenceLines={false}
              color="#f59e0b"
            />
          </div>
        )}
      </div>
    );
  };

  if (isLoading && !data) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">TVL (Total Value Locked) Metrics</h2>
            <p className="text-sm text-muted-foreground">
              DeFi TVL analysis for {blockchain}
            </p>
          </div>
          <LoadingState text="Loading TVL metrics..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }
  
  if (!data) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">TVL (Total Value Locked) Metrics</h2>
          <p className="text-sm text-muted-foreground">
            DeFi TVL analysis for {blockchain}
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">No data available</div>
              <p className="text-muted-foreground">
                Unable to load TVL metrics for {blockchain}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">TVL (Total Value Locked) Metrics</h2>
          <p className="text-sm text-muted-foreground">
            DeFi TVL analysis for {blockchain} • {timeframe}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            Real-time Analysis
          </Badge>
        </div>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tvlMetricsConfig.map((metric) => {
              const metricData = data[metric.key as keyof TVLMetrics] as any;
              
              return (
                <MetricCardWithBaseline
                  key={metric.key}
                  title={metric.title}
                  description={metric.description}
                  icon={metric.icon}
                  data={{
                    value: metricData?.value,
                    changePercent: metricData?.changePercent,
                    trend: metricData?.trend
                  }}
                  formatType={metric.formatType}
                  isPositiveGood={metric.isPositiveGood}
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-all",
                    selectedMetric === metric.key && "ring-2 ring-green-500 bg-green-500/5"
                  )}
                  onClick={() => handleMetricClick(metric.key)}
                />
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="protocols" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Protocols */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-blue-500" />
                  <span>Top DeFi Protocols</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topProtocols?.slice(0, 8).map((protocol, index) => (
                    <div key={protocol.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{protocol.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {protocol.category}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrencyCompact(protocol.tvl)}
                        </div>
                        <div className={cn(
                          "text-xs",
                          protocol.change_1d != null && protocol.change_1d >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {protocol.change_1d != null ? (protocol.change_1d >= 0 ? '+' : '') + protocol.change_1d.toFixed(1) + '%' : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Protocol Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  <span>TVL by Category</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.protocolCategories || {}).map(([category, tvl]) => {
                    const totalTVL = data.chainTVL?.value || 1;
                    const percentage = (tvl as number) / totalTVL * 100;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {percentage != null ? percentage.toFixed(1) + '%' : 'N/A'}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrencyCompact(tvl as number)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span>Historical TVL Trends</span>
                  {analysis && (
                    <Badge 
                      variant={analysis.trend === 'bullish' ? 'default' : analysis.trend === 'bearish' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {analysis.trend.toUpperCase()}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTVLRefresh}
                    disabled={isTVLLoading || tvlLoading}
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4 mr-2",
                      (isTVLLoading || tvlLoading) && "animate-spin"
                    )} />
                    Refresh
                  </Button>
                </div>
              </CardTitle>
              
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {formatCurrencyCompact(stats.currentTVL)}
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
                    {formatCurrencyCompact(stats.avgTVL)}
                  </div>
                  <div className="text-xs text-muted-foreground">Average TVL</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrencyCompact(stats.peakTVL)}
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
            
            <CardContent className="space-y-4">
              {/* Timeframe Selector */}
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

              {/* Chart */}
              <div className="w-full">
                {(tvlLoading || isTVLLoading) && tvlHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-96">
                    <LoadingState text="Loading TVL chart..." />
                  </div>
                ) : tvlError ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="text-red-500 mb-2">⚠️ Error Loading Data</div>
                      <div className="text-sm text-gray-600 mb-4">
                        {tvlError}
                      </div>
                      <Button onClick={handleTVLRefresh} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  renderTVLChart()
                )}
              </div>
            </CardContent>
          </Card>
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
                        {formatCurrencyCompact(metrics.currentMA)}
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
      </Tabs>
      
      {/* Selected Metric Detail */}
      {selectedMetric && (
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detailed View: {tvlMetricsConfig.find(m => m.key === selectedMetric)?.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMetric(null)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Detailed analysis for {tvlMetricsConfig.find(m => m.key === selectedMetric)?.title} will be displayed here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}