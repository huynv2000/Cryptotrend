// TVL Metrics Section Component with Baseline Comparison
// Enhanced version that displays current values and baseline comparisons

'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Layers, Target, DollarSign, Percent, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MetricCardWithBaseline from '../ui/MetricCardWithBaseline';
import { LoadingState } from '@/components/LoadingState';
import { cn, formatNumber, formatCurrency } from '@/lib/utils';
import type { TVLMetrics, BlockchainValue, TimeframeValue } from '@/lib/types';

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
  
  const handleMetricClick = (metricKey: string) => {
    setSelectedMetric(selectedMetric === metricKey ? null : metricKey);
  };

  const createBaselineComparison = (metricKey: string, timeframe: TimeframeValue) => {
    if (!data || !data.historicalData) return undefined;
    
    const metricData = data[metricKey as keyof TVLMetrics] as any;
    if (!metricData || metricData.value === null || metricData.value === undefined) return undefined;
    
    const currentValue = metricData.value;
    
    // Calculate baseline based on timeframe
    let baselineValue: number;
    switch (timeframe) {
      case '1h':
        // Use 7-day average for 1H timeframe
        baselineValue = data.historicalData.slice(-7).reduce((sum: number, point: any) => sum + (point[metricKey] || 0), 0) / 7;
        break;
      case '24h':
        // Use 7-day average for 24H timeframe
        baselineValue = data.historicalData.slice(-7).reduce((sum: number, point: any) => sum + (point[metricKey] || 0), 0) / 7;
        break;
      case '7d':
        // Use 30-day average for 7D timeframe
        baselineValue = data.historicalData.slice(-30).reduce((sum: number, point: any) => sum + (point[metricKey] || 0), 0) / 30;
        break;
      case '30d':
        // Use 90-day average for 30D timeframe
        baselineValue = data.historicalData.slice(-90).reduce((sum: number, point: any) => sum + (point[metricKey] || 0), 0) / 90;
        break;
      case '90d':
        // Use 90-day average for 90D timeframe
        baselineValue = data.historicalData.slice(-90).reduce((sum: number, point: any) => sum + (point[metricKey] || 0), 0) / 90;
        break;
      default:
        baselineValue = currentValue;
    }
    
    if (!baselineValue || baselineValue === 0) return undefined;
    
    const growthPercent = ((currentValue - baselineValue) / baselineValue) * 100;
    
    return {
      timeframe,
      baselineValue,
      growthPercent,
      isPositive: growthPercent >= 0
    };
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
            Baseline Comparison
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
              const baselineComparison = createBaselineComparison(metric.key, timeframe);
              
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
                  baselineComparison={baselineComparison}
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
                          {formatCurrency(protocol.tvl)}
                        </div>
                        <div className={cn(
                          "text-xs",
                          protocol.change_1d >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {protocol.change_1d >= 0 ? '+' : ''}{protocol.change_1d.toFixed(1)}%
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
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(tvl as number)}
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
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Historical TVL Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Historical TVL charts will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>TVL Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Advanced TVL analysis will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
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