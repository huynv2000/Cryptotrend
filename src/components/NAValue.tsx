'use client';

import { useResolutionContext } from '@/contexts/ResolutionContext';
import { isValidValue } from '@/hooks/useDataWithNA';

interface NAValueProps {
  value: any;
  formatter?: (value: any) => string;
  naString?: string;
  className?: string;
  showIcon?: boolean;
}

export const NAValue = ({ 
  value, 
  formatter, 
  naString = 'N/A', 
  className = '',
  showIcon = false 
}: NAValueProps) => {
  const { getFontSizeClass } = useResolutionContext();
  
  const isNA = !isValidValue(value);
  
  if (isNA) {
    return (
      <span className={`${getFontSizeClass('base')} text-gray-400 ${className}`}>
        {showIcon && '⚠️ '}
        {naString}
      </span>
    );
  }
  
  const formattedValue = formatter ? formatter(value) : String(value);
  
  return (
    <span className={`${getFontSizeClass('base')} text-gray-900 ${className}`}>
      {formattedValue}
    </span>
  );
};

interface NACardProps {
  title: string;
  value: any;
  formatter?: (value: any) => string;
  naString?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export const NACard = ({ 
  title, 
  value, 
  formatter, 
  naString = 'N/A', 
  icon, 
  trend = 'neutral',
  subtitle 
}: NACardProps) => {
  const { getFontSizeClass } = useResolutionContext();
  const isNA = !isValidValue(value);
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };
  
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="text-center">
      <div className={`${getFontSizeClass('sm')} text-gray-600 mb-1 flex items-center justify-center`}>
        {icon && <span className="mr-1">{icon}</span>}
        {title}
      </div>
      <div className={`${getFontSizeClass('lg')} font-bold ${isNA ? 'text-gray-400' : 'text-gray-900'}`}>
        <NAValue 
          value={value} 
          formatter={formatter || ((val: any) => val?.toString() || '')}
          naString={naString}
        />
      </div>
      {subtitle && (
        <div className={`${getFontSizeClass('xs')} ${getTrendColor()} mt-1`}>
          {getTrendIcon()} {subtitle}
        </div>
      )}
    </div>
  );
};