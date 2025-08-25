'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { formatYAxisTick, calculateYDomain } from '@/lib/chart-utils';

interface TVLDataPointWithMA {
  date: string;
  tvl: number;
  movingAverage: number;
  maDeviation: number;
  changePercent?: number;
  dominance?: number;
}

interface MovingAverageLineProps {
  data: TVLDataPointWithMA[];
  period?: number;
  height?: number;
  showDots?: boolean;
  showAnimation?: boolean;
  showReferenceLines?: boolean;
  className?: string;
  color?: string;
  onPointClick?: (data: TVLDataPointWithMA) => void;
}

export default function MovingAverageLine({
  data,
  period = 30,
  height = 400,
  showDots = false,
  showAnimation = true,
  showReferenceLines = true,
  className,
  color = '#f59e0b',
  onPointClick
}: MovingAverageLineProps) {
  // Format data for chart display
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const date = new Date(item.date);
      const isPositive = (item.changePercent || 0) >= 0;
      const deviation = item.maDeviation || 0;
      
      return {
        ...item,
        formattedDate: format(date, 'MMM dd'),
        fullDate: format(date, 'MMM dd, yyyy'),
        formattedTVL: formatCurrency(item.tvl),
        formattedMA: formatCurrency(item.movingAverage),
        formattedDeviation: deviation !== null && deviation !== undefined 
          ? `${deviation >= 0 ? '+' : ''}${Number(deviation).toFixed(2)}%` 
          : 'N/A',
        deviationColor: deviation >= 0 ? '#10b981' : '#ef4444',
        isPositive,
        index
      };
    });
  }, [data]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    const allValues = chartData.flatMap(d => [d.tvl, d.movingAverage]);
    return calculateYDomain(allValues.map(tvl => ({ tvl })), 0.15); // 15% padding for better visualization
  }, [chartData]);

  // Calculate reference lines (support/resistance levels)
  const referenceLines = useMemo(() => {
    if (!showReferenceLines || chartData.length === 0) return [];
    
    const tvls = chartData.map(d => d.tvl);
    const mas = chartData.map(d => d.movingAverage);
    
    const currentTVL = tvls[tvls.length - 1];
    const currentMA = mas[mas.length - 1];
    
    return [
      {
        y: currentMA,
        label: `${period}-Day MA`,
        color: '#f59e0b',
        strokeDasharray: '5 5'
      },
      {
        y: currentTVL,
        label: 'Current TVL',
        color: (currentTVL || 0) >= (currentMA || 0) ? '#10b981' : '#ef4444',
        strokeDasharray: '3 3'
      }
    ];
  }, [chartData, showReferenceLines, period]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const deviation = data.maDeviation || 0;
      const isAboveMA = deviation >= 0;
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[250px]">
          <div className="font-medium text-gray-900 mb-3">
            {data.fullDate}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">TVL:</span>
              <span className="text-sm font-medium text-gray-900">{data.formattedTVL}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{period}-Day MA:</span>
              <span className="text-sm font-medium" style={{ color }}>
                {data.formattedMA}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Deviation:</span>
              <span className={cn(
                "text-sm font-medium",
                isAboveMA ? "text-green-600" : "text-red-600"
              )}>
                {data.formattedDeviation}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Position:</span>
              <span className={cn(
                "text-xs px-2 py-1 rounded-full font-medium",
                isAboveMA ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              )}>
                {isAboveMA ? 'Above MA' : 'Below MA'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle point click
  const handlePointClick = (data: any, index: number) => {
    if (onPointClick && data && data.payload) {
      onPointClick(data.payload);
    }
  };

  // Custom dot component
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    
    if (!showDots) return null;
    
    const deviation = payload.maDeviation || 0;
    const isAboveMA = deviation >= 0;
    
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={4}
        fill={isAboveMA ? '#10b981' : '#ef4444'}
        stroke={color}
        strokeWidth={2}
        className="cursor-pointer hover:r-6 transition-all duration-200"
      />
    );
  };

  // Active dot component
  const CustomActiveDot = (props: any) => {
    const { cx, cy, payload } = props;
    
    const deviation = payload.maDeviation || 0;
    const isAboveMA = deviation >= 0;
    
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={6}
        fill={isAboveMA ? '#10b981' : '#ef4444'}
        stroke={color}
        strokeWidth={2}
        className="cursor-pointer"
      />
    );
  };

  if (chartData.length === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">No Moving Average Data</div>
          <div className="text-sm">Unable to display moving average line</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full relative", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60
          }}
          onClick={handlePointClick}
        >
          <XAxis 
            dataKey="formattedDate"
            tick={{
              fontSize: 11,
              fill: '#6b7280'
            }}
            tickLine={false}
            axisLine={false}
            interval={Math.ceil(chartData.length / 10)}
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
              stroke: '#d1d5db',
              strokeWidth: 1,
              strokeDasharray: '3 3'
            }}
          />
          
          {/* Reference lines */}
          {referenceLines.map((line, index) => (
            line.y !== undefined && (
              <ReferenceLine
                key={index}
                y={line.y}
                stroke={line.color}
                strokeWidth={1}
                strokeDasharray={line.strokeDasharray}
              label={{
                value: line.label,
                position: 'top',
                fill: line.color,
                fontSize: 11,
                fontWeight: 500
              }}
            />
            )
          ))}
          
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke={color}
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={<CustomActiveDot />}
            animationDuration={showAnimation ? 500 : 0}
            animationEasing="ease-out"
            connectNulls={false}
            name={`${period}-Day Moving Average`}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-medium text-gray-700">
            {period}-Day MA
          </span>
        </div>
      </div>
    </div>
  );
}

// Export utility functions for reuse
export const MovingAverageUtils = {
  calculateMovingAverage: (data: { tvl: number }[], period: number) => {
    return data.map((item, index) => {
      const start = Math.max(0, index - period + 1);
      const subset = data.slice(start, index + 1);
      const sum = subset.reduce((acc, curr) => acc + curr.tvl, 0);
      const ma = sum / subset.length;
      
      return {
        ...item,
        movingAverage: ma,
        maDeviation: ma > 0 ? ((item.tvl - ma) / ma) * 100 : 0
      };
    });
  },
  
  generateSignal: (deviation: number, trend: 'up' | 'down' | 'stable') => {
    if (Math.abs(deviation) > 15) {
      return deviation > 0 ? 'overbought' : 'oversold';
    }
    
    if (trend === 'up' && deviation < -5) {
      return 'buy_signal';
    }
    
    if (trend === 'down' && deviation > 5) {
      return 'sell_signal';
    }
    
    return 'neutral';
  }
};