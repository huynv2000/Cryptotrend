// Enhanced Tooltip Component
// Provides detailed information about financial values with historical context

'use client';

import { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Info, BarChart3 } from 'lucide-react';
import { cn, formatFinancialValue, formatPercent, getValueHierarchy } from '@/lib/utils';

interface EnhancedTooltipProps {
  value: number;
  title: string;
  description?: string;
  changePercent?: number;
  historicalData?: number[];
  formatType?: 'currency' | 'number' | 'percent';
  children: React.ReactNode;
  showHistoricalStats?: boolean;
  showHierarchy?: boolean;
}

interface HistoricalStats {
  min: number;
  max: number;
  avg: number;
  current: number;
  trend: 'up' | 'down' | 'stable';
  volatility: number;
}

export default function EnhancedTooltip({
  value,
  title,
  description,
  changePercent,
  historicalData = [],
  formatType = 'currency',
  children,
  showHistoricalStats = true,
  showHierarchy = true
}: EnhancedTooltipProps) {
  const stats = useMemo<HistoricalStats | null>(() => {
    if (historicalData.length === 0) return null;
    
    const min = Math.min(...historicalData);
    const max = Math.max(...historicalData);
    const avg = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const current = value;
    
    // Calculate trend based on recent vs older data
    const recentHalf = historicalData.slice(-Math.ceil(historicalData.length / 2));
    const olderHalf = historicalData.slice(0, Math.floor(historicalData.length / 2));
    
    const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
    const olderAvg = olderHalf.length > 0 ? olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length : avg;
    
    const trendChange = ((recentAvg - olderAvg) / olderAvg) * 100;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    
    if (Math.abs(trendChange) > 1) {
      trend = trendChange > 0 ? 'up' : 'down';
    }
    
    // Calculate volatility (coefficient of variation)
    const standardDeviation = Math.sqrt(
      historicalData.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / historicalData.length
    );
    const volatility = avg !== 0 ? (standardDeviation / avg) * 100 : 0;
    
    return { min, max, avg, current, trend, volatility };
  }, [historicalData, value]);

  const hierarchy = useMemo(() => getValueHierarchy(value), [value]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getVolatilityBadge = (volatility: number) => {
    if (volatility < 10) {
      return <Badge variant="secondary" className="text-xs">Low Volatility</Badge>;
    } else if (volatility < 25) {
      return <Badge variant="outline" className="text-xs">Medium Volatility</Badge>;
    } else {
      return <Badge variant="destructive" className="text-xs">High Volatility</Badge>;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="w-96 p-0" side="top" align="center">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 space-y-4">
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{title}</div>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
                {description && (
                  <div className="text-xs text-muted-foreground">{description}</div>
                )}
              </div>

              {/* Current Value */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Current Value</div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold">
                    {formatFinancialValue(value, { 
                      style: 'full', 
                      precision: 2,
                      showCurrency: formatType === 'currency'
                    })}
                  </div>
                  {showHierarchy && (
                    <div className={cn("flex items-center space-x-1", hierarchy.color)}>
                      <span className="text-xs font-medium uppercase">
                        {hierarchy.level}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Change Information */}
              {changePercent !== undefined && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Change</div>
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "flex items-center space-x-1",
                      changePercent >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {changePercent >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="text-sm font-medium">
                        {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      from previous period
                    </div>
                  </div>
                </div>
              )}

              {/* Historical Statistics */}
              {showHistoricalStats && stats && (
                <div className="space-y-3 border-t pt-3">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <div className="text-xs font-medium">Historical Analysis</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Minimum</div>
                      <div className="text-sm font-medium">
                        {formatFinancialValue(stats.min, { 
                          style: 'compact', 
                          precision: 1,
                          showCurrency: formatType === 'currency'
                        })}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Maximum</div>
                      <div className="text-sm font-medium">
                        {formatFinancialValue(stats.max, { 
                          style: 'compact', 
                          precision: 1,
                          showCurrency: formatType === 'currency'
                        })}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Average</div>
                      <div className="text-sm font-medium">
                        {formatFinancialValue(stats.avg, { 
                          style: 'compact', 
                          precision: 1,
                          showCurrency: formatType === 'currency'
                        })}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Trend</div>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(stats.trend)}
                        <span className="text-sm font-medium capitalize">
                          {stats.trend}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Volatility Indicator */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground">Volatility</div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs font-medium">
                        {stats.volatility.toFixed(1)}%
                      </div>
                      {getVolatilityBadge(stats.volatility)}
                    </div>
                  </div>
                </div>
              )}

              {/* Data Source Info */}
              <div className="text-xs text-muted-foreground border-t pt-2">
                Updated: {new Date().toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Simplified version for basic tooltips
interface SimpleTooltipProps {
  value: number;
  title: string;
  formatType?: 'currency' | 'number' | 'percent';
  children: React.ReactNode;
}

export function SimpleTooltip({
  value,
  title,
  formatType = 'currency',
  children
}: SimpleTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <div className="font-medium text-sm">{title}</div>
            <div className="text-lg font-bold">
              {formatFinancialValue(value, { 
                style: 'full', 
                precision: 2,
                showCurrency: formatType === 'currency'
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}