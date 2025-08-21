// Base Metric Card Component

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, formatPercent, formatCurrency, formatHashRate, getTrendColor } from '@/lib/utils';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface BaseMetricCardProps {
  title: string;
  description?: string;
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  formatType?: 'number' | 'currency' | 'percent' | 'hashrate';
  unit?: string;
  isPositiveGood?: boolean;
  showSparkline?: boolean;
  sparklineData?: number[];
  className?: string;
}

export default function BaseMetricCard({
  title,
  description,
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick,
  icon,
  formatType = 'number',
  unit,
  isPositiveGood = true,
  showSparkline = false,
  sparklineData = [],
  className
}: BaseMetricCardProps) {
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
  
  const renderSparkline = () => {
    if (!showSparkline || sparklineData.length === 0) return null;
    
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    
    return (
      <div className="mt-2 h-12 relative">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${sparklineData.length} 100`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Gradient fill */}
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <path
            d={`M 0,100 ${sparklineData.map((value, index) => 
              `L ${index},${100 - ((value - min) / range) * 100}`
            ).join(' ')} L ${sparklineData.length - 1},100 Z`}
            fill={`url(#gradient-${title})`}
            className="text-blue-500"
          />
          
          {/* Line */}
          <path
            d={`M ${sparklineData.map((value, index) => 
              `${index},${100 - ((value - min) / range) * 100}`
            ).join(' ')}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-500"
          />
          
          {/* Data points */}
          {sparklineData.map((value, index) => (
            <circle
              key={index}
              cx={index}
              cy={100 - ((value - min) / range) * 100}
              r="2"
              fill="currentColor"
              className="text-blue-500"
            />
          ))}
        </svg>
      </div>
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
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-12 bg-muted rounded w-full"></div>
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
                  ? `${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%` 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Main Value */}
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
          
          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Change: {data.change !== null && data.change !== undefined ? formatValue(data.change) : 'N/A'}
            </span>
            <span>Trend: {data.trend || 'stable'}</span>
          </div>
          
          {/* Sparkline */}
          {renderSparkline()}
          
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
            
            {spikeDetection?.isSpike && (
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-500">
                  {spikeDetection.severity} spike
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}