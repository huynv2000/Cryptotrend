// Value Hierarchy Component
// Displays visual hierarchy indicators for financial values

'use client';

import { Crown, Gem, Star, TrendingUp, DollarSign } from 'lucide-react';
import { cn, getValueHierarchy } from '@/lib/utils';

interface ValueHierarchyProps {
  value: number;
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ValueHierarchy({
  value,
  className,
  showIcon = true,
  showText = true,
  size = 'md'
}: ValueHierarchyProps) {
  const hierarchy = getValueHierarchy(value);
  
  const getIcon = () => {
    switch (hierarchy.icon) {
      case 'crown':
        return <Crown className="h-3 w-3" />;
      case 'gem':
        return <Gem className="h-3 w-3" />;
      case 'star':
        return <Star className="h-3 w-3" />;
      case 'trending-up':
        return <TrendingUp className="h-3 w-3" />;
      case 'dollar-sign':
        return <DollarSign className="h-3 w-3" />;
      default:
        return <DollarSign className="h-3 w-3" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-sm';
      default:
        return 'text-xs';
    }
  };

  const getIconSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2 w-2';
      case 'lg':
        return 'h-4 w-4';
      default:
        return 'h-3 w-3';
    }
  };

  return (
    <div className={cn("flex items-center space-x-1", hierarchy.color, getSizeClasses(), className)}>
      {showIcon && (
        <div className={getIconSizeClasses()}>
          {getIcon()}
        </div>
      )}
      {showText && (
        <span className="font-medium uppercase tracking-wide">
          {hierarchy.level}
        </span>
      )}
    </div>
  );
}

// Enhanced version with more visual indicators
interface EnhancedValueHierarchyProps extends ValueHierarchyProps {
  showThreshold?: boolean;
  showPercentage?: boolean;
  totalValue?: number;
}

export function EnhancedValueHierarchy({
  value,
  className,
  showIcon = true,
  showText = true,
  size = 'md',
  showThreshold = false,
  showPercentage = false,
  totalValue
}: EnhancedValueHierarchyProps) {
  const hierarchy = getValueHierarchy(value);
  
  const getPercentage = () => {
    if (!totalValue || totalValue === 0) return 0;
    return (value / totalValue) * 100;
  };

  const percentage = showPercentage ? getPercentage() : null;

  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      <div className="flex items-center space-x-2">
        <ValueHierarchy
          value={value}
          showIcon={showIcon}
          showText={showText}
          size={size}
        />
        {showThreshold && (
          <span className="text-xs text-muted-foreground">
            ≥ {hierarchy.threshold >= 1e9 ? `${hierarchy.threshold / 1e9}B` : hierarchy.threshold >= 1e6 ? `${hierarchy.threshold / 1e6}M` : hierarchy.threshold}
          </span>
        )}
      </div>
      {percentage !== null && (
        <div className="flex items-center space-x-2">
          <div className="w-full bg-muted rounded-full h-1">
            <div 
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                hierarchy.level === 'trillion' ? 'bg-purple-500' :
                hierarchy.level === 'billion' ? 'bg-blue-500' :
                hierarchy.level === 'million' ? 'bg-green-500' :
                hierarchy.level === 'thousand' ? 'bg-orange-500' : 'bg-gray-500'
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for tight spaces
interface CompactValueHierarchyProps {
  value: number;
  className?: string;
}

export function CompactValueHierarchy({
  value,
  className
}: CompactValueHierarchyProps) {
  const hierarchy = getValueHierarchy(value);
  
  const getColorDot = () => {
    const colors = {
      trillion: 'bg-purple-500',
      billion: 'bg-blue-500',
      million: 'bg-green-500',
      thousand: 'bg-orange-500',
      unit: 'bg-gray-500'
    };
    
    return (
      <div className={cn(
        "w-2 h-2 rounded-full",
        colors[hierarchy.level]
      )} />
    );
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {getColorDot()}
      <span className={cn("text-xs font-medium uppercase", hierarchy.color)}>
        {hierarchy.level.charAt(0)}
      </span>
    </div>
  );
}