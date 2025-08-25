'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Info,
  BarChart3,
  Target,
  Zap,
  TrendingUp as TrendIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrendAnalysis } from '@/lib/trend-calculator';

interface TrendModalProps {
  title: string;
  trendAnalysis: TrendAnalysis;
  currentValue: number;
  previousValue?: number;
  unit?: string;
  children: React.ReactNode;
}

export function TrendModal({
  title,
  trendAnalysis,
  currentValue,
  previousValue,
  unit = '',
  children
}: TrendModalProps) {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getMomentumColor = (momentum: 'strong' | 'moderate' | 'weak') => {
    switch (momentum) {
      case 'strong': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getVolatilityLevel = (volatility: number) => {
    if (volatility > 0.2) return { level: 'High', color: 'text-red-600' };
    if (volatility > 0.1) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence > 0.8) return { level: 'High', color: 'text-green-600' };
    if (confidence > 0.5) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-red-600' };
  };

  const change = previousValue !== undefined ? currentValue - previousValue : 0;
  const changePercent = previousValue !== undefined && previousValue !== 0 
    ? (change / previousValue) * 100 
    : 0;

  const volatilityLevel = getVolatilityLevel(trendAnalysis.volatility);
  const confidenceLevel = getConfidenceLevel(trendAnalysis.confidence);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Trend Analysis: {title}</span>
          </DialogTitle>
          <DialogDescription>
            Detailed trend analysis and insights for {title.toLowerCase()}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Current Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Value</div>
                    <div className="text-2xl font-bold">
                      {formatValue(currentValue)}{unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Change</div>
                    <div className={cn(
                      "text-2xl font-bold",
                      getTrendColor(trendAnalysis.direction)
                    )}>
                      {formatValue(change)} ({formatPercent(changePercent)})
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {trendAnalysis.direction === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
                    {trendAnalysis.direction === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
                    {trendAnalysis.direction === 'stable' && <Minus className="h-5 w-5 text-gray-600" />}
                    <span className={cn("font-medium capitalize", getTrendColor(trendAnalysis.direction))}>
                      {trendAnalysis.direction} trend
                    </span>
                  </div>
                  <Badge variant={trendAnalysis.momentum === 'strong' ? 'default' : 'secondary'}>
                    {trendAnalysis.momentum} momentum
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Trend Strength */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Trend Strength</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Strength</span>
                    <span>{Math.round(trendAnalysis.strength * 100)}%</span>
                  </div>
                  <Progress value={trendAnalysis.strength * 100} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Volatility</div>
                    <div className={cn("font-medium", volatilityLevel.color)}>
                      {volatilityLevel.level} ({(trendAnalysis.volatility * 100).toFixed(1)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                    <div className={cn("font-medium", confidenceLevel.color)}>
                      {confidenceLevel.level} ({Math.round(trendAnalysis.confidence * 100)}%)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Points */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendIcon className="h-5 w-5" />
                  <span>Key Points</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Peak</div>
                    <div className="text-lg font-semibold text-green-600">
                      {formatValue(trendAnalysis.keyPoints.peak)}{unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current</div>
                    <div className="text-lg font-semibold">
                      {formatValue(trendAnalysis.keyPoints.current)}{unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Trough</div>
                    <div className="text-lg font-semibold text-red-600">
                      {formatValue(trendAnalysis.keyPoints.trough)}{unit}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trendline Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Trendline Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Slope</div>
                    <div className="font-medium">
                      {trendAnalysis.trendline.slope.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Intercept</div>
                    <div className="font-medium">
                      {trendAnalysis.trendline.intercept.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">R²</div>
                    <div className="font-medium">
                      {trendAnalysis.trendline.rSquared.toFixed(4)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {trendAnalysis.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {trendAnalysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />
            
            <div className="text-xs text-muted-foreground text-center">
              Trend analysis based on recent data points. Confidence level indicates 
              the reliability of the trend prediction.
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}