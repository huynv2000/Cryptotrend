// Cash Flow Metrics Section Component

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, ArrowLeft, PieChart, BarChart3, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BridgeFlowsCard from './BridgeFlowsCard';
import ExchangeFlowsCard from './ExchangeFlowsCard';
import StakingMetricsCard from './StakingMetricsCard';
import MiningValidationCard from './MiningValidationCard';
import { BridgeFlowsDetailChart } from '@/components/charts/BridgeFlowsDetailChart';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import { BridgeFlowService } from '@/lib/bridge-flow-service';
import type { CashflowMetrics, BlockchainValue, TimeframeValue } from '@/lib/types';
import type { BridgeFlowHistoricalData } from '@/types/bridge-flow';

interface CashFlowSectionProps {
  blockchain: BlockchainValue;
  timeframe: TimeframeValue;
  data: CashflowMetrics | null;
  isLoading: boolean;
}

const cashflowMetrics = [
  {
    key: 'bridgeFlows',
    title: 'Bridge Flows',
    description: 'Cross-chain bridge transactions',
    icon: ArrowRight,
    color: 'text-blue-500',
  },
  {
    key: 'exchangeFlows',
    title: 'Exchange Flows',
    description: 'Exchange inflow/outflow',
    icon: TrendingUp,
    color: 'text-green-500',
  },
  {
    key: 'stakingMetrics',
    title: 'Staking Metrics',
    description: 'Staking participation and rewards',
    icon: PieChart,
    color: 'text-purple-500',
  },
  {
    key: 'miningValidation',
    title: 'Mining/Validation',
    description: 'Network mining and validation',
    icon: BarChart3,
    color: 'text-orange-500',
  },
];

export default function CashFlowSection({
  blockchain,
  timeframe,
  data,
  isLoading
}: CashFlowSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [detailTimeRange, setDetailTimeRange] = useState<'7D' | '30D' | '90D'>('90D');
  const [historicalData, setHistoricalData] = useState<BridgeFlowHistoricalData[]>([]);
  const [isHistoricalLoading, setIsHistoricalLoading] = useState(false);
  
  const handleMetricClick = (metricKey: string) => {
    setSelectedMetric(selectedMetric === metricKey ? null : metricKey);
  };

  // Load historical data when bridge flows is selected
  useEffect(() => {
    const loadHistoricalData = async () => {
      if (selectedMetric === 'bridgeFlows') {
        setIsHistoricalLoading(true);
        try {
          const days = detailTimeRange === '7D' ? 7 : detailTimeRange === '30D' ? 30 : 90;
          const data = await BridgeFlowService.getHistoricalData(days, blockchain);
          setHistoricalData(data);
        } catch (error) {
          console.error('Failed to load historical data:', error);
          setHistoricalData([]);
        } finally {
          setIsHistoricalLoading(false);
        }
      }
    };

    loadHistoricalData();
  }, [selectedMetric, detailTimeRange, blockchain]);

  // Handle detail time range change
  const handleDetailTimeRangeChange = (range: '7D' | '30D' | '90D') => {
    setDetailTimeRange(range);
  };
  
  if (isLoading && !data) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Cash Flow Metrics</h2>
            <p className="text-sm text-muted-foreground">
              Flow analysis for {blockchain}
            </p>
          </div>
          <LoadingState message="Loading cashflow data..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <h2 className="text-xl font-semibold">Cash Flow Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Flow analysis for {blockchain}
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">No data available</div>
              <p className="text-muted-foreground">
                Unable to load cashflow metrics for {blockchain}
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
          <h2 className="text-xl font-semibold">Cash Flow Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Flow analysis for {blockchain} • {timeframe}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cashflowMetrics.map((metric) => {
              const metricData = data[metric.key as keyof CashflowMetrics] as any;
              const isPositive = metricData?.changePercent >= 0;
              
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
                    {metricData?.changePercent !== null && metricData?.changePercent !== undefined 
                      ? `${isPositive ? '+' : ''}${Number(metricData.changePercent).toFixed(1)}%` 
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
          <TabsTrigger value="flows">Flow Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BridgeFlowsCard
                data={data.bridgeFlows}
                isLoading={isLoading}
                isSelected={selectedMetric === 'bridgeFlows'}
                onClick={() => handleMetricClick('bridgeFlows')}
              />
              <ExchangeFlowsCard
                data={data.exchangeFlows}
                isLoading={isLoading}
                isSelected={selectedMetric === 'exchangeFlows'}
                onClick={() => handleMetricClick('exchangeFlows')}
              />
              <StakingMetricsCard
                data={data.stakingMetrics}
                isLoading={isLoading}
                isSelected={selectedMetric === 'stakingMetrics'}
                onClick={() => handleMetricClick('stakingMetrics')}
              />
              <MiningValidationCard
                data={data.miningValidation}
                isLoading={isLoading}
                isSelected={selectedMetric === 'miningValidation'}
                onClick={() => handleMetricClick('miningValidation')}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {cashflowMetrics.map((metric) => {
                    const metricData = data[metric.key as keyof CashflowMetrics] as any;
                    const isPositive = metricData?.changePercent >= 0;
                    
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
                            {metricData?.value || 'N/A'}
                          </div>
                          <div className={cn(
                            "text-sm",
                            isPositive ? "text-green-500" : "text-red-500"
                          )}>
                            {metricData?.changePercent !== null && metricData?.changePercent !== undefined 
                              ? `${isPositive ? '+' : ''}${Number(metricData.changePercent).toFixed(1)}%` 
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
        
        <TabsContent value="flows" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowRight className="h-5 w-5 text-blue-500" />
                  <span>Inflow Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Inflow</span>
                    <span className="font-semibold text-green-500">
                      +$2.4B
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Inflow</span>
                    <span className="font-semibold">$240M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Peak Inflow</span>
                    <span className="font-semibold">$480M</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowLeft className="h-5 w-5 text-red-500" />
                  <span>Outflow Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Outflow</span>
                    <span className="font-semibold text-red-500">
                      -$1.8B
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Outflow</span>
                    <span className="font-semibold">$180M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Peak Outflow</span>
                    <span className="font-semibold">$320M</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flow Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Flow pattern analysis will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="correlations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Correlation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.flowAnalysis?.exchangeFlowCorrelations?.slice(0, 4).map((correlation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">
                        {correlation.metric1} vs {correlation.metric2}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {correlation.timeframe}
                      </div>
                    </div>
                    <Badge 
                      variant={Math.abs(correlation.correlation) > 0.7 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {correlation.correlation !== null && correlation.correlation !== undefined 
                        ? `${correlation.correlation > 0 ? '+' : ''}${Number(correlation.correlation).toFixed(2)}` 
                        : 'N/A'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Selected Metric Detail */}
      {selectedMetric === 'bridgeFlows' && (
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detailed View: {cashflowMetrics.find(m => m.key === selectedMetric)?.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMetric(null)}
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BridgeFlowsDetailChart
              data={historicalData}
              isLoading={isHistoricalLoading}
              timeRange={detailTimeRange}
              onTimeRangeChange={handleDetailTimeRangeChange}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Selected Metric Detail - Other Metrics (Placeholder) */}
      {selectedMetric && selectedMetric !== 'bridgeFlows' && (
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detailed View: {cashflowMetrics.find(m => m.key === selectedMetric)?.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMetric(null)}
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Detailed analysis for {cashflowMetrics.find(m => m.key === selectedMetric)?.title.toLowerCase()} will be displayed here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}