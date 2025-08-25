'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable';
  strength?: number; // 0-1 value indicating trend strength
  showIcon?: boolean;
  showPercentage?: boolean;
  percentage?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrendIndicator({
  trend,
  strength = 0.5,
  showIcon = true,
  showPercentage = false,
  percentage,
  size = 'md',
  className
}: TrendIndicatorProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return strength > 0.7 ? 'text-green-600' : 'text-green-500';
      case 'down':
        return strength > 0.7 ? 'text-red-600' : 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const getStrengthDots = () => {
    if (trend === 'stable') return null;
    
    return (
      <div className="flex items-center space-x-1 ml-2">
        {[1, 2, 3].map((dot) => (
          <div
            key={dot}
            className={cn(
              'w-1 h-1 rounded-full transition-all duration-200',
              dot <= Math.ceil(strength * 3)
                ? trend === 'up' 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
                : 'bg-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={cn(
      'flex items-center space-x-1',
      getTrendColor(),
      getSizeClasses(),
      className
    )}>
      {showIcon && getTrendIcon()}
      <span className="font-medium capitalize">
        {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
      </span>
      {getStrengthDots()}
      {showPercentage && percentage !== undefined && (
        <span className="ml-1">
          ({percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)
        </span>
      )}
    </div>
  );
}