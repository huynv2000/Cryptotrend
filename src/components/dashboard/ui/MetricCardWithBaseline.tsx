// Metric Card with Baseline Comparison Component
// Displays current value and growth comparison vs timeframe baseline

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { cn, formatNumber, formatCurrency, formatPercent, formatHashRate } from '@/lib/utils';

interface MetricData {
  value: number | null;
  changePercent?: number | null;
  trend?: 'up' | 'down' | 'stable';
  isSpike?: boolean;
  spikeSeverity?: 'low' | 'medium' | 'high';
}

interface MetricCardWithBaselineProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  data: MetricData;
  formatType?: 'number' | 'currency' | 'percent' | 'hashrate';
  unit?: string;
  isPositiveGood?: boolean;
  className?: string;
  isLoading?: boolean;
}

export default function MetricCardWithBaseline({
  title,
  description,
  icon,
  data,
  formatType = 'number',
  unit,
  isPositiveGood = true,
  className,
  isLoading = false
}: MetricCardWithBaselineProps) {
  const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    switch (formatType) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      case 'hashrate':
        return formatHashRate(value);
      default:
        return formatNumber(value);
    }
  };

  const getTrendIcon = () => {
    if (!data.value && data.value !== 0) return <Minus className="h-4 w-4" />;
    
    if (data.changePercent && data.changePercent > 0) return <TrendingUp className="h-4 w-4" />;
    if (data.changePercent && data.changePercent < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!data.value && data.value !== 0) return 'text-gray-500';
    if (!data.changePercent && data.changePercent !== 0) return 'text-gray-500';
    
    const change = data.changePercent || 0;
    if (change > 0) return isPositiveGood ? 'text-green-500' : 'text-red-500';
    if (change < 0) return isPositiveGood ? 'text-red-500' : 'text-green-500';
    return 'text-gray-500';
  };

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 bg-muted rounded"></div>
              <div>
                <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </div>
            </div>
            <div className="h-6 bg-muted rounded w-16"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "hover:shadow-md transition-all duration-200",
      data.isSpike && "border-orange-500/50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
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
            {data.isSpike && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Spike
              </Badge>
            )}
            <div className={cn("flex items-center space-x-1", getTrendColor())}>
              {getTrendIcon()}
              <span className="text-xs font-medium">
                {data.changePercent !== null && data.changePercent !== undefined 
                  ? `${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%` 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Current Value */}
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold">
              {data.value !== null && data.value !== undefined ? formatValue(data.value) : 'N/A'}
            </div>
            {unit && (
              <span className="text-sm text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                data.trend === 'up' ? 'bg-green-500' :
                data.trend === 'down' ? 'bg-red-500' : 'bg-gray-500'
              )} />
              <span className="text-xs capitalize">{data.trend || 'stable'}</span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {data.changePercent !== null && data.changePercent !== undefined 
                ? `${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%` 
                : 'N/A'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}