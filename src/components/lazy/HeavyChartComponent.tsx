'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Zap } from 'lucide-react';

interface HeavyChartComponentProps {
  data: any[];
  title: string;
  description?: string;
}

// Simulate a heavy component with complex calculations and large data processing
export default function HeavyChartComponent({ data, title, description }: HeavyChartComponentProps) {
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Simulate heavy data processing
    const processData = async () => {
      setIsProcessing(true);
      
      // Simulate complex calculations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const processed = data.map(item => ({
        ...item,
        calculatedValue: Math.sqrt(item.value) * Math.log(item.value + 1),
        trend: item.value > (item.prevValue || 0) ? 'up' : 'down',
        movingAverage: calculateMovingAverage(data, item.index || 0, 5)
      }));
      
      setProcessedData(processed);
      setIsProcessing(false);
    };

    processData();
  }, [data]);

  const calculateMovingAverage = (data: any[], index: number, window: number): number => {
    const start = Math.max(0, index - window + 1);
    const end = index + 1;
    const subset = data.slice(start, end);
    const sum = subset.reduce((acc, item) => acc + (item.value || 0), 0);
    return sum / subset.length;
  };

  const exportData = () => {
    const csvContent = [
      ['Index', 'Value', 'Calculated Value', 'Trend', 'Moving Average'],
      ...processedData.map((item, index) => [
        index,
        item.value,
        item.calculatedValue.toFixed(2),
        item.trend,
        item.movingAverage.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Processing complex data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Zap className="h-3 w-3 mr-1" />
              Optimized
            </Badge>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart visualization */}
          <div className="h-64 bg-muted rounded-lg p-4">
            <div className="h-full flex items-end justify-around">
              {processedData.slice(0, 10).map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-8 ${
                      item.trend === 'up' ? 'bg-green-500' : 'bg-red-500'
                    } rounded-t`}
                    style={{ height: `${Math.min(100, (item.calculatedValue / 100) * 100)}%` }}
                  />
                  <span className="text-xs mt-2">{index}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Data Points</p>
              <p className="font-semibold">{processedData.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Value</p>
              <p className="font-semibold">
                {processedData.length > 0
                  ? (processedData.reduce((sum, item) => sum + item.value, 0) / processedData.length).toFixed(2)
                  : '0'
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Max Value</p>
              <p className="font-semibold">
                {processedData.length > 0
                  ? Math.max(...processedData.map(item => item.value)).toFixed(2)
                  : '0'
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Trend</p>
              <p className="font-semibold">
                {processedData.length > 0
                  ? processedData.filter(item => item.trend === 'up').length > processedData.filter(item => item.trend === 'down').length
                    ? 'Upward'
                    : 'Downward'
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}