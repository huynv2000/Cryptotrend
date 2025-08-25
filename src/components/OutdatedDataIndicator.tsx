'use client';

import { useResolutionContext } from '@/contexts/ResolutionContext';
import { Clock, AlertTriangle, Info } from 'lucide-react';

interface OutdatedDataIndicatorProps {
  isOutdated?: boolean;
  hoursAgo?: number;
  lastUpdated?: Date | string;
  className?: string;
  showDetails?: boolean;
}

export const OutdatedDataIndicator = ({ 
  isOutdated = false, 
  hoursAgo, 
  lastUpdated, 
  className = '',
  showDetails = true 
}: OutdatedDataIndicatorProps) => {
  const { getFontSizeClass } = useResolutionContext();

  if (!isOutdated) {
    return null;
  }

  const formatTimeAgo = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const getOutdatedSeverity = () => {
    if (hoursAgo === undefined) return 'warning';
    if (hoursAgo < 1) return 'info';      // Less than 1 hour
    if (hoursAgo < 6) return 'warning';   // 1-6 hours
    return 'error';                       // More than 6 hours
  };

  const getSeverityColor = () => {
    switch (getOutdatedSeverity()) {
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = () => {
    switch (getOutdatedSeverity()) {
      case 'info': return <Info className="h-3 w-3" />;
      case 'warning': return <AlertTriangle className="h-3 w-3" />;
      case 'error': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getSeverityText = () => {
    switch (getOutdatedSeverity()) {
      case 'info': return 'Dữ liệu gần đây';
      case 'warning': return 'Dữ liệu đã cũ';
      case 'error': return 'Dữ liệu quá cũ';
      default: return 'Dữ liệu lưu trữ';
    }
  };

  if (!showDetails) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded border text-xs ${getSeverityColor()} ${className}`}>
        {getSeverityIcon()}
        <Clock className="h-3 w-3" />
        <span>{formatTimeAgo(lastUpdated)}</span>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-3 ${getSeverityColor()} ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        {getSeverityIcon()}
        <span className={`${getFontSizeClass('xs')} font-medium`}>
          {getSeverityText()}
        </span>
      </div>
      
      <div className="text-xs opacity-75 space-y-1">
        <div className="flex items-center justify-between">
          <span>Cập nhật lần cuối:</span>
          <span className="font-medium">{formatTimeAgo(lastUpdated)}</span>
        </div>
        
        {hoursAgo !== undefined && (
          <div className="flex items-center justify-between">
            <span>Thời gian trễ:</span>
            <span className="font-medium">{hoursAgo} giờ</span>
          </div>
        )}
        
        <div className="text-xs mt-2 opacity-90">
          Hệ thống đang sử dụng dữ liệu lưu trữ do không thể kết nối đến nguồn dữ liệu real-time.
        </div>
      </div>
    </div>
  );
};

interface DataWithStatusProps {
  value: any;
  formatter?: (value: any) => string;
  isOutdated?: boolean;
  hoursAgo?: number;
  lastUpdated?: Date | string;
  naString?: string;
  className?: string;
  showOutdatedIndicator?: boolean;
}

export const DataWithStatus = ({ 
  value, 
  formatter, 
  isOutdated = false, 
  hoursAgo, 
  lastUpdated, 
  naString = 'N/A',
  className = '',
  showOutdatedIndicator = true 
}: DataWithStatusProps) => {
  const { getFontSizeClass } = useResolutionContext();
  
  const isValid = value !== null && value !== undefined && 
                 !(typeof value === 'number' && (isNaN(value) || !isFinite(value)));

  if (!isValid) {
    return (
      <div className={className}>
        <span className={`${getFontSizeClass('base')} text-gray-400`}>
          {naString}
        </span>
      </div>
    );
  }

  const formattedValue = formatter ? formatter(value) : String(value);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className={`${getFontSizeClass('base')} text-gray-900`}>
        {formattedValue}
      </div>
      
      {isOutdated && showOutdatedIndicator && (
        <OutdatedDataIndicator 
          isOutdated={isOutdated}
          {...(hoursAgo !== undefined && { hoursAgo })}
          {...(lastUpdated !== undefined && { lastUpdated })}
          showDetails={false}
        />
      )}
    </div>
  );
};