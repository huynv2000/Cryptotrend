// Base Metric Card Component

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, formatPercent, formatFinancialValue, formatHashRate, getTrendColor } from '@/lib/utils';
import { TrendIndicator } from '@/components/ui/trend-indicator';
import { TrendModal } from '@/components/ui/trend-modal';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';
import type { TrendAnalysis } from '@/lib/trend-calculator';

interface BaseMetricCardProps {
  title: string;
  description?: string | undefined;
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult | undefined;
  trendAnalysis?: TrendAnalysis | undefined;
  isLoading: boolean;
  isSelected?: boolean | undefined;
  onClick?: (() => void) | undefined;
  icon?: React.ReactNode | undefined;
  formatType?: 'number' | 'currency' | 'percent' | 'hashrate' | undefined;
  unit?: string | undefined;
  isPositiveGood?: boolean | undefined;
  className?: string | undefined;
}

export default function BaseMetricCard({
  title,
  description,
  data,
  spikeDetection,
  trendAnalysis,
  isLoading,
  isSelected = false,
  onClick,
  icon,
  formatType = 'number',
  unit,
  isPositiveGood = true,
  className
}: BaseMetricCardProps) {
  const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    switch (formatType) {
      case 'currency':
        return formatFinancialValue(value, { style: 'compact' });
      case 'percent':
        return formatPercent(value);
      case 'hashrate':
        return formatHashRate(value);
      default:
        return formatNumber(value);
    }
  };
  
  const getTrendIcon = () => {
    if (!data || data.value === null || data.value === undefined) return <Minus className="h-4 w-4" />;
    
    if (data.change > 0) return <TrendingUp className="h-4 w-4" />;
    if (data.change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };
  
  const getChangeColor = () => {
    if (!data || data.value === null || data.value === undefined) return 'text-gray-500';
    return getTrendColor(data.change, isPositiveGood);
  };
  
  const getSpikeBadge = () => {
    if (!spikeDetection || !spikeDetection.isSpike) return null;
    
    const variant = spikeDetection.severity === 'high' ? 'destructive' : 
                   spikeDetection.severity === 'medium' ? 'default' : 'secondary';
    
    return (
      <Badge variant={variant} className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Spike
      </Badge>
    );
  };
  
  if (isLoading) {
    return (
      <Card className={cn(
        "animate-pulse cursor-pointer hover:shadow-md transition-shadow",
        isSelected && "ring-2 ring-blue-500",
        className
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
            <div className="h-6 bg-muted rounded w-16"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded w-3/4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-12"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-12"></div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            </div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data) {
    return (
      <Card className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        isSelected && "ring-2 ring-blue-500",
        className
      )}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <TrendModal
      title={title}
      trendAnalysis={trendAnalysis || {
        direction: data?.trend || 'stable',
        strength: 0.5,
        momentum: 'moderate',
        volatility: 0.1,
        confidence: 0.7,
        trendline: { slope: 0, intercept: 0, rSquared: 0 },
        keyPoints: { peak: data?.value || 0, trough: data?.value || 0, current: data?.value || 0 },
        recommendations: ['Trend analysis available']
      }}
      currentValue={data?.value || 0}
      previousValue={data?.value !== undefined && data?.change !== undefined ? data.value - data.change : undefined}
      unit={unit}
    >
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-md transition-all duration-200",
          isSelected && "ring-2 ring-blue-500 bg-blue-500/5",
          spikeDetection?.isSpike && "border-orange-500/50",
          className
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {icon}
              <div>
                <CardTitle className="text-sm font-medium">
                  {title}
                </CardTitle>
                {description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getSpikeBadge()}
              <div className={cn("flex items-center space-x-1", getChangeColor())}>
                {getTrendIcon()}
                <span className="text-xs font-medium">
                  {data.changePercent !== null && data.changePercent !== undefined 
                    ? `${data.changePercent >= 0 ? '+' : ''}${Number(data.changePercent).toFixed(2)}%` 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Main Value */}
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">
                {data.value !== null && data.value !== undefined ? formatValue(data.value) : 'N/A'}
              </div>
              {unit && (
                <span className="text-sm text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
            
            {/* Enhanced Trend Indicator */}
            <div className="flex items-center justify-between">
              <TrendIndicator
                trend={data?.trend || 'stable'}
                strength={trendAnalysis?.strength || 0.5}
                showPercentage={true}
                percentage={data?.changePercent}
                size="sm"
              />
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Change</div>
                <div className={cn(
                  "font-medium",
                  getChangeColor()
                )}>
                  {data.change !== null && data.change !== undefined ? formatValue(data.change) : 'N/A'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Momentum</div>
                <div className="font-medium capitalize">
                  {trendAnalysis?.momentum || 'moderate'}
                </div>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <span className={cn(
                  "text-xs font-medium capitalize",
                  data.trend === 'up' ? 'text-green-600' :
                  data.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                )}>
                  {data.trend || 'stable'}
                </span>
              </div>
              
              {spikeDetection?.isSpike && (
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-500 font-medium">
                    {spikeDetection.severity} spike
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TrendModal>
  );
}