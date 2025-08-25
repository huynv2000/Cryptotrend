// Responsive Value Display Component
// Adapts display format based on screen size and user preferences

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatFinancialValue } from '@/lib/utils';

interface ResponsiveValueDisplayProps {
  value: number;
  formatType?: 'currency' | 'number' | 'percent';
  className?: string;
  mobileStyle?: 'full' | 'compact' | 'abbreviated';
  desktopStyle?: 'full' | 'compact' | 'abbreviated';
  precision?: number;
  showCurrency?: boolean;
  animateChange?: boolean;
  previousValue?: number;
}

export default function ResponsiveValueDisplay({
  value,
  formatType = 'currency',
  className,
  mobileStyle = 'compact',
  desktopStyle = 'full',
  precision = 2,
  showCurrency = true,
  animateChange = false,
  previousValue
}: ResponsiveValueDisplayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (animateChange && previousValue !== undefined && previousValue !== value) {
      setIsAnimating(true);
      // Animate the value change
      const duration = 500; // ms
      const steps = 20;
      const stepValue = (value - previousValue) / steps;
      let currentStep = 0;
      
      const animate = () => {
        currentStep++;
        const newValue = previousValue + (stepValue * currentStep);
        setDisplayValue(newValue);
        
        if (currentStep < steps) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
          setIsAnimating(false);
        }
      };
      
      animate();
    } else {
      setDisplayValue(value);
    }
  }, [value, previousValue, animateChange]);

  const formatValue = (val: number) => {
    const style = isMobile ? mobileStyle : desktopStyle;
    
    return formatFinancialValue(val, {
      style,
      precision,
      showCurrency: formatType === 'currency' && showCurrency
    });
  };

  const getChangeColor = () => {
    if (!animateChange || previousValue === undefined) return '';
    return value > previousValue ? 'text-green-600' : value < previousValue ? 'text-red-600' : '';
  };

  return (
    <div className={cn(
      "font-semibold transition-all duration-300",
      getChangeColor(),
      isAnimating && 'scale-105',
      className
    )}>
      {formatValue(displayValue)}
    </div>
  );
}

// Compact version for cards and tight spaces
interface CompactValueDisplayProps {
  value: number;
  formatType?: 'currency' | 'number' | 'percent';
  className?: string;
  maxCharacters?: number;
}

export function CompactValueDisplay({
  value,
  formatType = 'currency',
  className,
  maxCharacters = 12
}: CompactValueDisplayProps) {
  const getCompactFormat = () => {
    const absValue = Math.abs(value);
    
    if (absValue >= 1e12) {
      return { style: 'compact' as const, precision: 1 };
    } else if (absValue >= 1e9) {
      return { style: 'compact' as const, precision: 1 };
    } else if (absValue >= 1e6) {
      return { style: 'compact' as const, precision: 1 };
    } else if (absValue >= 1e3) {
      return { style: 'compact' as const, precision: 0 };
    } else {
      return { style: 'full' as const, precision: 2 };
    }
  };

  const { style, precision } = getCompactFormat();
  
  const formattedValue = formatFinancialValue(value, {
    style,
    precision,
    showCurrency: formatType === 'currency'
  });

  // Truncate if still too long
  const displayValue = formattedValue.length > maxCharacters 
    ? formattedValue.substring(0, maxCharacters - 3) + '...'
    : formattedValue;

  return (
    <div className={cn("font-semibold", className)}>
      {displayValue}
    </div>
  );
}

// Large display for headers and important metrics
interface LargeValueDisplayProps {
  value: number;
  formatType?: 'currency' | 'number' | 'percent';
  className?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

export function LargeValueDisplay({
  value,
  formatType = 'currency',
  className,
  subtitle,
  trend,
  trendValue
}: LargeValueDisplayProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <div className={cn("text-center space-y-1", className)}>
      <div className="text-3xl font-bold">
        {formatFinancialValue(value, {
          style: 'full',
          precision: 2,
          showCurrency: formatType === 'currency'
        })}
      </div>
      {subtitle && (
        <div className="text-sm text-muted-foreground">
          {subtitle}
        </div>
      )}
      {trend && trendValue !== undefined && (
        <div className={cn("flex items-center justify-center space-x-1 text-sm", getTrendColor())}>
          <span>{getTrendIcon()}</span>
          <span>
            {trendValue >= 0 ? '+' : ''}{trendValue.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Grid display for comparing multiple values
interface ValueGridDisplayProps {
  values: Array<{
    label: string;
    value: number;
    formatType?: 'currency' | 'number' | 'percent';
    color?: string;
  }>;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function ValueGridDisplay({
  values,
  className,
  columns = 2
}: ValueGridDisplayProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }[columns];

  return (
    <div className={cn("grid", gridCols, "gap-4", className)}>
      {values.map((item, index) => (
        <div key={index} className="text-center space-y-1">
          <div className={cn("text-lg font-bold", item.color || 'text-foreground')}>
            {formatFinancialValue(item.value, {
              style: 'compact',
              precision: 1,
              showCurrency: item.formatType === 'currency'
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}