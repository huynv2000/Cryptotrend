// Usage Metrics Section Component

'use client';

import { useState } from 'react';
import { TrendingUp, BarChart3, Activity, DollarSign, Hash, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DailyActiveAddressesCard from './DailyActiveAddressesCard';
import NewAddressesCard from './NewAddressesCard';
import DailyTransactionsCard from './DailyTransactionsCard';
import TransactionVolumeCard from './TransactionVolumeCard';
import AverageFeeCard from './AverageFeeCard';
import HashRateCard from './HashRateCard';
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
    icon: Users,
    description: 'Number of unique active addresses',
    color: 'text-blue-500',
  },
  {
    key: 'newAddresses',
    title: 'New Addresses',
    icon: Activity,
    description: 'Newly created addresses',
    color: 'text-green-500',
  },
  {
    key: 'dailyTransactions',
    title: 'Daily Transactions',
    icon: TrendingUp,
    description: 'Total transactions per day',
    color: 'text-purple-500',
  },
  {
    key: 'transactionVolume',
    title: 'Transaction Volume',
    icon: DollarSign,
    description: 'Total transaction volume in USD',
    color: 'text-orange-500',
  },
  {
    key: 'averageFee',
    title: 'Average Fee',
    icon: BarChart3,
    description: 'Average transaction fee',
    color: 'text-red-500',
  },
  {
    key: 'hashRate',
    title: 'Network Hash Rate',
    icon: Hash,
    description: 'Current network hash rate',
    color: 'text-yellow-500',
  },
];

export default function UsageMetricsSection({
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
          <LoadingState text="Loading metrics..." />
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
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {metricsConfig.map((metric) => {
              const metricData = data[metric.key as keyof UsageMetrics] as any;
              const changePercent = metricData?.changePercent !== null && metricData?.changePercent !== undefined 
                ? Number(metricData.changePercent) || 0 
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
                    {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DailyActiveAddressesCard
                data={data.dailyActiveAddresses}
                rollingAverages={data.rollingAverages?.dailyActiveAddresses}
                spikeDetection={data.spikeDetection?.dailyActiveAddresses}
                isLoading={isLoading}
                isSelected={selectedMetric === 'dailyActiveAddresses'}
                onClick={() => handleMetricClick('dailyActiveAddresses')}
              />
              <NewAddressesCard
                data={data.newAddresses}
                rollingAverages={data.rollingAverages?.newAddresses}
                spikeDetection={data.spikeDetection?.newAddresses}
                isLoading={isLoading}
                isSelected={selectedMetric === 'newAddresses'}
                onClick={() => handleMetricClick('newAddresses')}
              />
              <DailyTransactionsCard
                data={data.dailyTransactions}
                rollingAverages={data.rollingAverages?.dailyTransactions}
                spikeDetection={data.spikeDetection?.dailyTransactions}
                isLoading={isLoading}
                isSelected={selectedMetric === 'dailyTransactions'}
                onClick={() => handleMetricClick('dailyTransactions')}
              />
              <TransactionVolumeCard
                data={data.transactionVolume}
                spikeDetection={data.spikeDetection?.transactionVolume}
                isLoading={isLoading}
                isSelected={selectedMetric === 'transactionVolume'}
                onClick={() => handleMetricClick('transactionVolume')}
              />
              <AverageFeeCard
                data={data.averageFee}
                rollingAverages={data.rollingAverages?.averageFee}
                spikeDetection={data.spikeDetection?.averageFee}
                isLoading={isLoading}
                isSelected={selectedMetric === 'averageFee'}
                onClick={() => handleMetricClick('averageFee')}
              />
              <HashRateCard
                data={data.hashRate}
                rollingAverages={data.rollingAverages?.hashRate}
                spikeDetection={data.spikeDetection?.hashRate}
                isLoading={isLoading}
                isSelected={selectedMetric === 'hashRate'}
                onClick={() => handleMetricClick('hashRate')}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {metricsConfig.map((metric) => {
                    const metricData = data[metric.key as keyof UsageMetrics] as any;
                    const changePercent = metricData?.changePercent !== null && metricData?.changePercent !== undefined 
                      ? Number(metricData.changePercent) || 0 
                      : 0;
                    const isPositive = changePercent >= 0;
                    
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
                            {metricData?.value !== null && metricData?.value !== undefined 
                              ? formatNumber(metricData.value) 
                              : 'N/A'}
                          </div>
                          <div className={cn(
                            "text-sm",
                            isPositive ? "text-green-500" : "text-red-500"
                          )}>
                            {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
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
                <BarChart3 className="h-5 w-5" />
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
                      {Object.entries(data.rollingAverages || {}).map(([key, averages]: [string, any]) => (
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
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Detailed metric analysis will be displayed here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}