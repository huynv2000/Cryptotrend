'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { 
  formatYAxisTick, 
  calculateYDomain, 
  getPerformanceColors, 
  formatChartDate, 
  calculateLabelInterval,
  createTVLTooltipData
} from '@/lib/chart-utils';

interface TVLDataPoint {
  date: string;
  tvl: number;
  changePercent?: number;
  dominance?: number;
}

interface TVLBarChartProps {
  data: TVLDataPoint[];
  height?: number;
  showGrid?: boolean;
  showAnimation?: boolean;
  className?: string;
  onBarClick?: (data: TVLDataPoint) => void;
}

export default function TVLBarChart({
  data,
  height = 400,
  showGrid = true,
  showAnimation = true,
  className,
  onBarClick
}: TVLBarChartProps) {
  // Format data for chart display
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const isPositive = (item.changePercent || 0) >= 0;
      const colors = getPerformanceColors(isPositive);
      
      return {
        ...item,
        formattedDate: formatChartDate(item.date),
        fullDate: format(new Date(item.date), 'MMM dd, yyyy'),
        formattedTVL: formatCurrency(item.tvl),
        ...colors,
        index
      };
    });
  }, [data]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    const tooltipData = createTVLTooltipData(active, payload, label);
    
    if (!tooltipData) return null;
    
    const { fullDate, formattedTVL, changePercent, isPositive, dominance } = tooltipData;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
        <div className="font-medium text-gray-900 mb-2">
          {fullDate}
        </div>
        <div className="space-y-1">
          <div className="text-sm text-gray-600">
            TVL: <span className="font-medium text-gray-900">{formattedTVL}</span>
          </div>
          {changePercent !== undefined && (
            <div className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              Change: {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </div>
          )}
          {dominance !== undefined && (
            <div className="text-sm text-gray-600">
              Dominance: <span className="font-medium">{dominance.toFixed(2)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Handle bar click
  const handleBarClick = (data: any, index: number) => {
    if (onBarClick && data && data.payload) {
      onBarClick(data.payload);
    }
  };

  // Calculate Y-axis domain for better visualization
  const yDomain = useMemo(() => {
    return calculateYDomain(data);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm">Unable to display TVL chart</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60
          }}
          barSize={data.length > 20 ? 8 : 12}
          onClick={handleBarClick}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              vertical={false}
            />
          )}
          
          <XAxis 
            dataKey="formattedDate"
            tick={{
              fontSize: 11,
              fill: '#6b7280'
            }}
            tickLine={false}
            axisLine={false}
            interval={calculateLabelInterval(chartData.length)}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          
          <YAxis 
            tick={{
              fontSize: 11,
              fill: '#6b7280'
            }}
            tickLine={false}
            axisLine={false}
            domain={yDomain}
            tickFormatter={formatYAxisTick}
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ 
              fill: '#f3f4f6',
              opacity: 0.3
            }}
          />
          
          <Bar
            dataKey="tvl"
            radius={[4, 4, 0, 0]}
            animationDuration={showAnimation ? 300 : 0}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                stroke={entry.stroke}
                strokeWidth={1}
                className="cursor-pointer transition-all duration-200 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Export utility functions for reuse
export const TVLChartUtils = {
  formatYAxisTick,
  createCustomTooltip: createTVLTooltipData,
  calculateYDomain
};