// TVL Metrics Section Component

'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Layers, Target, DollarSign, Percent, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/LoadingState';
import TVLHistoryChart from '@/components/dashboard/tvl-history/TVLHistoryChart';
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
    icon: DollarSign,
    color: 'text-green-500',
    format: 'currency',
  },
  {
    key: 'chainTVLChange24h',
    title: '24h Change',
    description: 'TVL change in last 24 hours',
    icon: TrendingUp,
    color: 'text-blue-500',
    format: 'percentage',
  },
  {
    key: 'tvlDominance',
    title: 'Market Dominance',
    description: 'Market share of total DeFi TVL',
    icon: Percent,
    color: 'text-purple-500',
    format: 'percentage',
  },
  {
    key: 'tvlRank',
    title: 'TVL Rank',
    description: 'Global ranking by TVL',
    icon: Target,
    color: 'text-orange-500',
    format: 'number',
  },
  {
    key: 'tvlPeak',
    title: 'TVL Peak',
    description: 'Historical peak TVL',
    icon: BarChart3,
    color: 'text-red-500',
    format: 'currency',
  },
  {
    key: 'tvlToMarketCapRatio',
    title: 'TVL/MC Ratio',
    description: 'TVL to Market Cap ratio',
    icon: Hash,
    color: 'text-yellow-500',
    format: 'ratio',
  },
];

export default function TVLMetricsSection({
  blockchain,
  timeframe,
  data,
  isLoading
}: TVLMetricsSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
  const handleMetricClick = (metricKey: string) => {
    setSelectedMetric(selectedMetric === metricKey ? null : metricKey);
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
          <LoadingState message="Loading TVL metrics..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
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
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {tvlMetricsConfig.map((metric) => {
              const metricData = data[metric.key as keyof TVLMetrics] as any;
              const changePercent = metricData?.changePercent !== null && metricData?.changePercent !== undefined 
                ? metricData.changePercent 
                : 0;
              const isPositive = changePercent >= 0;
              
              return (
                <div key={metric.key} className="text-center">
                  <metric.icon className={cn(
                    "h-4 w-4 mx-auto mb-1",
                    metric.color
                  )} />
                  <div className="text-xs text-muted-foreground">
                    {metric.title}
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    isPositive ? "text-green-500" : "text-red-500"
                  )}>
                    {changePercent !== null && changePercent !== undefined 
                      ? `${isPositive ? '+' : ''}${Number(changePercent).toFixed(1)}%` 
                      : 'N/A'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tvlMetricsConfig.map((metric) => {
                const metricData = data[metric.key as keyof TVLMetrics] as any;
                const value = metricData?.value || 0;
                const changePercent = metricData?.changePercent || 0;
                const isPositive = changePercent >= 0;
                
                let formattedValue = 'N/A';
                switch (metric.format) {
                  case 'currency':
                    formattedValue = formatCurrency(value);
                    break;
                  case 'percentage':
                    formattedValue = value !== null && value !== undefined ? `${Number(value).toFixed(2)}%` : 'N/A';
                    break;
                  case 'ratio':
                    formattedValue = value !== null && value !== undefined ? Number(value).toFixed(3) : 'N/A';
                    break;
                  default:
                    formattedValue = formatNumber(value);
                }
                
                return (
                  <Card 
                    key={metric.key}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedMetric === metric.key && "ring-2 ring-green-500"
                    )}
                    onClick={() => handleMetricClick(metric.key)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <metric.icon className={cn("h-5 w-5", metric.color)} />
                        <Badge 
                          variant={isPositive ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {changePercent !== null && changePercent !== undefined 
                            ? `${isPositive ? '+' : ''}${Number(changePercent).toFixed(1)}%` 
                            : 'N/A'}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm">{metric.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-1">
                        {formattedValue}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metric.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {tvlMetricsConfig.map((metric) => {
                    const metricData = data[metric.key as keyof TVLMetrics] as any;
                    const value = metricData?.value || 0;
                    const changePercent = metricData?.changePercent || 0;
                    const isPositive = changePercent >= 0;
                    
                    let formattedValue = 'N/A';
                    switch (metric.format) {
                      case 'currency':
                        formattedValue = formatCurrency(value);
                        break;
                      case 'percentage':
                        formattedValue = value !== null && value !== undefined ? `${Number(value).toFixed(2)}%` : 'N/A';
                        break;
                      case 'ratio':
                        formattedValue = value !== null && value !== undefined ? Number(value).toFixed(3) : 'N/A';
                        break;
                      default:
                        formattedValue = formatNumber(value);
                    }
                    
                    return (
                      <div
                        key={metric.key}
                        className={cn(
                          "flex items-center justify-between p-4 border-b border-border last:border-b-0",
                          selectedMetric === metric.key && "bg-accent"
                        )}
                        onClick={() => handleMetricClick(metric.key)}
                      >
                        <div className="flex items-center space-x-3">
                          <metric.icon className={cn(
                            "h-5 w-5",
                            metric.color
                          )} />
                          <div>
                            <div className="font-medium">{metric.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {metric.description}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formattedValue}
                          </div>
                          <div className={cn(
                            "text-sm",
                            isPositive ? "text-green-500" : "text-red-500"
                          )}>
                            {changePercent !== null && changePercent !== undefined 
                              ? `${isPositive ? '+' : ''}${Number(changePercent).toFixed(1)}%` 
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
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
                          protocol.change_1d !== null && protocol.change_1d !== undefined && protocol.change_1d >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {protocol.change_1d !== null && protocol.change_1d !== undefined 
              ? `${protocol.change_1d >= 0 ? '+' : ''}${Number(protocol.change_1d).toFixed(1)}%` 
              : 'N/A'}
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
                            {percentage !== null && percentage !== undefined && !isNaN(percentage) 
                              ? `${Number(percentage).toFixed(1)}%` 
                              : 'N/A'}
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
          <TVLHistoryChart
            coinId={blockchain.toLowerCase()}
            coinName={blockchain}
            timeframe="30D"
            height={400}
            showControls={true}
            autoRefresh={false}
          />
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  <span>Market Comparison</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Market Dominance</span>
                    <span className="font-semibold">
                      {data.tvlDominance?.value !== null && data.tvlDominance?.value !== undefined 
                        ? `${Number(data.tvlDominance.value).toFixed(2)}%` 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Global Rank</span>
                    <span className="font-semibold">
                      #{data.tvlRank?.value || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">TVL/MC Ratio</span>
                    <span className="font-semibold">
                      {data.tvlToMarketCapRatio?.value !== null && data.tvlToMarketCapRatio?.value !== undefined 
                        ? Number(data.tvlToMarketCapRatio.value).toFixed(3) 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">24h Change</span>
                    <div className="flex items-center space-x-2">
                      {data.chainTVLChange24h?.value >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn(
                        "font-semibold",
                        data.chainTVLChange24h?.value !== null && data.chainTVLChange24h?.value !== undefined && data.chainTVLChange24h.value >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {data.chainTVLChange24h?.value !== null && data.chainTVLChange24h?.value !== undefined 
                          ? `${Number(data.chainTVLChange24h.value).toFixed(2)}%` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">7d Change</span>
                    <div className="flex items-center space-x-2">
                      {data.chainTVLChange7d?.value >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn(
                        "font-semibold",
                        data.chainTVLChange7d?.value !== null && data.chainTVLChange7d?.value !== undefined && data.chainTVLChange7d.value >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {data.chainTVLChange7d?.value !== null && data.chainTVLChange7d?.value !== undefined 
                          ? `${Number(data.chainTVLChange7d.value).toFixed(2)}%` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">30d Change</span>
                    <div className="flex items-center space-x-2">
                      {data.chainTVLChange30d?.value >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn(
                        "font-semibold",
                        data.chainTVLChange30d?.value !== null && data.chainTVLChange30d?.value !== undefined && data.chainTVLChange30d.value >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {data.chainTVLChange30d?.value !== null && data.chainTVLChange30d?.value !== undefined 
                          ? `${Number(data.chainTVLChange30d.value).toFixed(2)}%` 
                          : 'N/A'}
                      </span>
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
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Detailed TVL metric analysis will be displayed here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}