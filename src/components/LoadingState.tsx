'use client';

import { useResolutionContext } from '@/contexts/ResolutionContext';
import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState = ({ 
  message = 'Đang tải dữ liệu...', 
  submessage = 'Vui lòng chờ trong giây lát' 
}: LoadingStateProps) => {
  const { getFontSizeClass, config } = useResolutionContext();
  
  // Adjust icon size based on resolution
  const getIconSize = () => {
    switch (config.fontSize) {
      case 'xs': return 'h-6 w-6';
      case 'sm': return 'h-7 w-7';
      case 'base': return 'h-8 w-8';
      case 'lg': return 'h-10 w-10';
      case 'xl': return 'h-12 w-12';
      default: return 'h-8 w-8';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <RefreshCw className={`${getIconSize()} animate-spin text-blue-600 mb-4`} />
          <h2 className={`${getFontSizeClass('xl')} font-semibold text-gray-800 text-center mb-2`}>
            {message}
          </h2>
          <p className={`${getFontSizeClass('base')} text-gray-600 text-center`}>
            {submessage}
          </p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};