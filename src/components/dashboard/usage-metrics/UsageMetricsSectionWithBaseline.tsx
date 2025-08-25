// Usage Metrics Section Component with Baseline Comparison
// Enhanced version that displays current values and baseline comparisons

'use client';

import { useState } from 'react';
import { Users, Activity, TrendingUp, DollarSign, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MetricCardWithBaseline from '../ui/MetricCardWithBaseline';
import { LoadingState } from '@/components/LoadingState';
import { cn, formatNumber } from '@/lib/utils';
import type { UsageMetrics, BlockchainValue, TimeframeValue } from '@/lib/types';

interface UsageMetricsSectionProps {
  blockchain: BlockchainValue;
  timeframe: TimeframeValue;
  data: UsageMetrics | null;
  isLoading: boolean;
}

const metricsConfig = [
  {
    key: 'dailyActiveAddresses',
    title: 'Daily Active Addresses',
    description: 'Number of unique active addresses',
    icon: <Users className="h-5 w-5 text-blue-500" />,
    color: 'text-blue-500',
    formatType: 'number' as const,
    isPositiveGood: true
  },
  {
    key: 'newAddresses',
    title: 'New Addresses',
    description: 'Newly created addresses',
    icon: <Activity className="h-5 w-5 text-green-500" />,
    color: 'text-green-500',
    formatType: 'number' as const,
    isPositiveGood: true
  },
  {
    key: 'dailyTransactions',
    title: 'Daily Transactions',
    description: 'Total transactions per day',
    icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
    color: 'text-purple-500',
    formatType: 'number' as const,
    isPositiveGood: true
  },
  {
    key: 'transactionVolume',
    title: 'Transaction Volume',
    description: 'Total transaction volume in USD',
    icon: <DollarSign className="h-5 w-5 text-orange-500" />,
    color: 'text-orange-500',
    formatType: 'currency' as const,
    isPositiveGood: true
  },
  // Note: Average Fee, Network Hash Rate boxes removed as requested
];

export default function UsageMetricsSectionWithBaseline({
  blockchain,
  timeframe,
  data,
  isLoading
}: UsageMetricsSectionProps) {
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
            <h2 className="text-xl font-semibold">Usage & Growth Metrics</h2>
            <p className="text-sm text-muted-foreground">
              Key performance indicators for {blockchain}
            </p>
          </div>
          <LoadingState message="Loading metrics..." />
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
          <h2 className="text-xl font-semibold">Usage & Growth Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Key performance indicators for {blockchain}
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">No data available</div>
              <p className="text-muted-foreground">
                Unable to load usage metrics for {blockchain}
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
          <h2 className="text-xl font-semibold">Usage & Growth Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Key performance indicators for {blockchain} • {timeframe}
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricsConfig.map((metric) => {
              const metricData = data[metric.key as keyof UsageMetrics] as any;
              
              return (
                <MetricCardWithBaseline
                  key={metric.key}
                  title={metric.title}
                  description={metric.description}
                  icon={metric.icon}
                  data={{
                    value: metricData?.value,
                    changePercent: metricData?.changePercent,
                    trend: metricData?.trend,
                    isSpike: data.spikeDetection?.[metric.key]?.isSpike,
                    spikeSeverity: data.spikeDetection?.[metric.key]?.severity
                  }}
                  formatType={metric.formatType}
                  isPositiveGood={metric.isPositiveGood}
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-all",
                    selectedMetric === metric.key && "ring-2 ring-blue-500 bg-blue-500/5"
                  )}
                />
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Growth Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Trend charts will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Advanced Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.spikeDetection && data.rollingAverages ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Spike Detection</h4>
                    <div className="space-y-1">
                      {Object.entries(data.spikeDetection || {}).map(([key, detection]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <Badge 
                            variant={detection?.isSpike ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {detection?.isSpike ? 'Spike' : 'Normal'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Rolling Averages</h4>
                    <div className="space-y-1">
                      {Object.entries(data.rollingAverages || {}).map(([key, averages]: [string, any]) => {
                        if (key === 'averageFee' || key === 'hashRate') return null; // Removed as requested
                        return (
                          <div key={key} className="text-sm">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="ml-2">
                              7D: {averages?.['7d'] !== null && averages?.['7d'] !== undefined 
                                ? formatNumber(averages['7d']) 
                                : 'N/A'}, 
                              30D: {averages?.['30d'] !== null && averages?.['30d'] !== undefined 
                                ? formatNumber(averages['30d']) 
                                : 'N/A'}, 
                              90D: {averages?.['90d'] !== null && averages?.['90d'] !== undefined 
                                ? formatNumber(averages['90d']) 
                                : 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Analysis data is not available for the selected timeframe
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Selected Metric Detail */}
      {selectedMetric && (
        <Card className="border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detailed View: {metricsConfig.find(m => m.key === selectedMetric)?.title}</span>
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
                Detailed analysis for {metricsConfig.find(m => m.key === selectedMetric)?.title} will be displayed here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}