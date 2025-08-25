// Chain TVL Card Component

'use client';

import { Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatFinancialValue } from '@/lib/utils';
import type { MetricValue } from '@/lib/types';

interface ChainTVLCardProps {
  data: MetricValue | null;
  isLoading: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export default function ChainTVLCard({
  data,
  isLoading,
  isSelected,
  onClick
}: ChainTVLCardProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow opacity-50" onClick={onClick}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Building2 className="h-4 w-4 text-green-500" />
            <span>Chain TVL</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-muted-foreground">No data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.changePercent >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        isSelected && "ring-2 ring-green-500 bg-green-500/5"
      )} 
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-green-500" />
            <span className="text-sm">Chain TVL</span>
          </div>
          {isSelected && (
            <Badge variant="secondary" className="text-xs">
              Selected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {formatFinancialValue(data.value, { style: 'compact' })}
            </div>
            <div className={cn(
              "flex items-center space-x-1",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}{data.changePercent.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            TVL for this specific blockchain
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Trend: {data.trend}
            </div>
            <div className="text-xs text-muted-foreground">
              Updated: {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}