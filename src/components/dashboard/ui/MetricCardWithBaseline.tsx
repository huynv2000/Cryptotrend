// Metric Card with Baseline Comparison Component
// Displays current value and growth comparison vs timeframe baseline

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Settings } from 'lucide-react';
import { cn, formatNumber, formatCurrency, formatPercent, formatHashRate, formatFinancialValue, getValueHierarchy } from '@/lib/utils';
import { TrendIndicator } from '@/components/ui/trend-indicator';

interface MetricData {
  value: number | null;
  changePercent?: number | null | undefined;
  trend?: 'up' | 'down' | 'stable' | undefined;
  isSpike?: boolean | undefined;
  spikeSeverity?: 'low' | 'medium' | 'high' | undefined;
}

interface MetricCardWithBaselineProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  data: MetricData;
  formatType?: 'number' | 'currency' | 'percent' | 'hashrate';
  formatStyle?: 'full' | 'compact' | 'abbreviated' | 'scientific';
  unit?: string;
  isPositiveGood?: boolean;
  className?: string;
  isLoading?: boolean;
  showFormatToggle?: boolean;
  showHierarchy?: boolean;
  onFormatChange?: (style: 'full' | 'compact' | 'abbreviated' | 'scientific') => void;
}

export default function MetricCardWithBaseline({
  title,
  description,
  icon,
  data,
  formatType = 'number',
  formatStyle = 'compact',
  unit,
  isPositiveGood = true,
  className,
  isLoading = false,
  showFormatToggle = false,
  showHierarchy = true,
  onFormatChange
}: MetricCardWithBaselineProps) {
  const [currentFormatStyle, setCurrentFormatStyle] = useState(formatStyle);
  const [showSettings, setShowSettings] = useState(false);

  const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    
    if (formatType === 'currency') {
      return formatFinancialValue(value, { 
        style: currentFormatStyle,
        precision: 2,
        showCurrency: true
      });
    } else if (formatType === 'percent') {
      return formatPercent(value);
    } else if (formatType === 'hashrate') {
      return formatHashRate(value);
    } else {
      return formatFinancialValue(value, { 
        style: currentFormatStyle,
        precision: 2,
        showCurrency: false
      });
    }
  };

  const handleFormatChange = (newStyle: typeof currentFormatStyle) => {
    setCurrentFormatStyle(newStyle);
    onFormatChange?.(newStyle);
  };

  const getHierarchyInfo = () => {
    if (data.value === null || data.value === undefined) return null;
    return getValueHierarchy(data.value);
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

  const calculateTrendStrength = (changePercent: number | null | undefined): number => {
    if (!changePercent && changePercent !== 0) return 0;
    const absChange = Math.abs(changePercent);
    if (absChange >= 10) return 1.0;
    if (absChange >= 5) return 0.7;
    if (absChange >= 2) return 0.4;
    if (absChange >= 1) return 0.2;
    return 0.1;
  };

  const hierarchyInfo = getHierarchyInfo();

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
            {showFormatToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
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
                  ? `${data.changePercent >= 0 ? '+' : ''}${Number(data.changePercent).toFixed(2)}%` 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Format Toggle Panel */}
        {showSettings && showFormatToggle && (
          <div className="mt-3 p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Display Format</span>
            </div>
            <div className="flex items-center space-x-1">
              {(['compact', 'full', 'abbreviated'] as const).map((style) => (
                <Button
                  key={style}
                  variant={currentFormatStyle === style ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFormatChange(style)}
                  className="h-6 px-2 text-xs"
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Current Value with Hierarchy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">
                  {data.value !== null && data.value !== undefined ? formatValue(data.value) : 'N/A'}
                </div>
                {unit && (
                  <span className="text-sm text-muted-foreground">
                    {unit}
                  </span>
                )}
              </div>
              {showHierarchy && hierarchyInfo && (
                <div className={cn("flex items-center space-x-1", hierarchyInfo.color)}>
                  <div className="text-xs font-medium uppercase">
                    {hierarchyInfo.level}
                  </div>
                </div>
              )}
            </div>
            
            {/* Full value as subtitle when using compact format */}
            {currentFormatStyle !== 'full' && data.value !== null && data.value !== undefined && (
              <div className="text-xs text-muted-foreground">
                {formatFinancialValue(data.value, { style: 'full', precision: 2 })}
              </div>
            )}
          </div>
          
          {/* Enhanced Trend Indicator with Mini Trend Dots */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <TrendIndicator
              trend={data.trend || 'stable'}
              strength={calculateTrendStrength(data.changePercent)}
              showIcon={true}
              showPercentage={true}
              percentage={data.changePercent}
              size="sm"
              className="text-xs"
            />
            
            {data.isSpike && (
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-500 font-medium">
                  {data.spikeSeverity} spike
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}