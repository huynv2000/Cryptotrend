'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, BarChart3, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BridgeFlowService } from '@/lib/bridge-flow-service';
import { 
  BridgeFlowHistoricalData, 
  BridgeFlowChartProps, 
  ChartTooltipData,
  BridgeFlowSummary 
} from '@/types/bridge-flow';
import { FEATURE_FLAGS } from '@/config/features';

export function BridgeFlowsDetailChart({
  data: initialData,
  isLoading,
  timeRange,
  onTimeRangeChange,
  className
}: BridgeFlowChartProps) {
  const [chartData, setChartData] = useState<BridgeFlowHistoricalData[]>(initialData || []);
  const [summary, setSummary] = useState<BridgeFlowSummary | null>(null);
  const [hoveredData, setHoveredData] = useState<ChartTooltipData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Calculate summary statistics
  useEffect(() => {
    if (chartData.length > 0) {
      const summaryData = BridgeFlowService.getSummary(chartData);
      setSummary(summaryData);
    }
  }, [chartData]);

  // Handle data changes
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setChartData(initialData);
    }
  }, [initialData]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!chartData.length) return;
    
    setIsExporting(true);
    try {
      const csv = BridgeFlowService.exportToCSV(chartData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bridge-flows-${timeRange.toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsExporting(false);
    }
  }, [chartData, timeRange]);

  // Debug logging for MA30
  useEffect(() => {
    if (chartData.length > 0) {
      const ma30Count = chartData.filter(d => d.ma30).length;
      const firstMa30Index = chartData.findIndex(d => d.ma30);
      const hasValidMA30Data = chartData.length >= 30 && 
        chartData.slice(29).every(d => d.ma30 !== undefined);
      
      console.log('MA30 Debug:', {
        totalDataPoints: chartData.length,
        ma30DataPoints: ma30Count,
        firstMa30Index: firstMa30Index,
        expectedFirstIndex: 29,
        hasEnoughData: chartData.length >= 30,
        hasValidMA30Data: hasValidMA30Data,
        timeRange: timeRange
      });
    }
  }, [chartData, timeRange]);

  // Performance optimization: Cache MA30 path calculation
  const ma30Path = useMemo(() => {
    if (chartData.length < 30) return '';
    
    try {
      const maxValue = Math.max(...chartData.map(d => d.value));
      const minValue = Math.min(...chartData.map(d => d.value));
      const valueRange = maxValue - minValue || 1;
      
      return chartData
        .slice(29) // Start from index 29 (first point with MA30)
        .map((item, index) => {
          if (item.ma30 === undefined || item.ma30 === null) return '';
          const actualIndex = 29 + index; // Actual index in full dataset
          const y = 100 - ((item.ma30 - minValue) / valueRange) * 80;
          return `${index === 0 ? 'M' : 'L'} ${actualIndex} ${y}`;
        })
        .filter(point => point !== '')
        .join(' ');
    } catch (error) {
      console.error('Error calculating MA30 path:', error);
      return '';
    }
  }, [chartData]);

  // Quick rollback component
  if (FEATURE_FLAGS.ENABLE_ROLLBACK) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Detailed cashflow analysis will be displayed here
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length || !summary) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No historical data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));
  const valueRange = maxValue - minValue || 1;

  // Validation for MA30 data
  const hasValidMA30Data = chartData.length >= 30 && 
    chartData.slice(29).every(d => d.ma30 !== undefined && d.ma30 !== null);

  // Safe chart rendering
  const renderChart = () => {
    try {
      return (
        <div className="relative h-64 w-full">
          <svg
            viewBox={`0 0 ${chartData.length} 100`}
            preserveAspectRatio="none"
            className="w-full h-full"
            onMouseLeave={() => setHoveredData(null)}
          >
            {/* Grid lines */}
            {[...Array(5)].map((_, i) => (
              <line
                key={i}
                x1={0}
                y1={i * 25}
                x2={chartData.length}
                y2={i * 25}
                stroke="currentColor"
                strokeWidth={0.5}
                className="text-border opacity-30"
              />
            ))}
            
            {/* Bars */}
            {chartData.map((item, index) => {
              try {
                const height = ((item.value - minValue) / valueRange) * 80;
                const y = 100 - height;
                
                return (
                  <g key={index}>
                    <rect
                      x={index + 0.1}
                      y={y}
                      width={0.8}
                      height={height}
                      fill="currentColor"
                      className="text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredData({
                        date: item.date,
                        value: item.value,
                        volume: item.volume,
                        transactionCount: item.transactionCount,
                        ma30: item.ma30 || 0
                      })}
                    />
                  </g>
                );
              } catch (error) {
                console.error(`Error rendering bar at index ${index}:`, error);
                return null;
              }
            }).filter(Boolean)}
            
            {/* 30-day Moving Average Line */}
            {hasValidMA30Data && ma30Path && (
              <path
                d={ma30Path}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="text-orange-500"
                strokeDasharray="4,2"
              />
            )}
          </svg>
        </div>
      );
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <div className="relative h-64 w-full flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Error rendering chart. Please try again.
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Bridge Flows Historical Data</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-1" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <Tabs value={timeRange} onValueChange={(value) => onTimeRangeChange(value as any)}>
          <TabsList>
            <TabsTrigger value="7D">7 Days</TabsTrigger>
            <TabsTrigger value="30D">30 Days</TabsTrigger>
            <TabsTrigger value="90D">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Total Value</div>
            <div className="text-lg font-semibold">
              {BridgeFlowService.formatValue(summary.totalValue)}
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Average</div>
            <div className="text-lg font-semibold">
              {BridgeFlowService.formatValue(summary.averageValue)}
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Change</div>
            <div className={cn(
              "text-lg font-semibold flex items-center justify-center space-x-1",
              summary.trend === 'up' ? 'text-green-600' : 
              summary.trend === 'down' ? 'text-red-600' : 'text-gray-600'
            )}>
              {summary.trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {summary.trend === 'down' && <TrendingDown className="h-4 w-4" />}
              <span>{summary.changePercent >= 0 ? '+' : ''}{summary.changePercent.toFixed(1)}%</span>
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Data Points</div>
            <div className="text-lg font-semibold">{chartData.length}</div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="space-y-4">
          {/* Chart */}
          {renderChart()}

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Daily Bridge Flows</span>
            </div>
            {hasValidMA30Data && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-orange-500"></div>
                <span>30-Day Moving Average</span>
              </div>
            )}
          </div>

          {/* Tooltip */}
          {hoveredData && (
            <div className="absolute bg-background border border-border rounded-lg p-3 shadow-lg z-10"
                 style={{ 
                   left: '50%', 
                   top: '50%', 
                   transform: 'translate(-50%, -50%)' 
                 }}>
              <div className="space-y-1 text-sm">
                <div className="font-medium">{hoveredData.date}</div>
                <div>Value: {BridgeFlowService.formatValue(hoveredData.value)}</div>
                <div>Volume: {BridgeFlowService.formatValue(hoveredData.volume)}</div>
                <div>Transactions: {hoveredData.transactionCount.toLocaleString()}</div>
                {hoveredData.ma30 && (
                  <div>MA30: {BridgeFlowService.formatValue(hoveredData.ma30)}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}