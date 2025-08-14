'use client';

import React, { createContext, ReactNode, useContext } from 'react';
import { useResolution } from '@/hooks/useResolution';

interface ResolutionContextType {
  resolution: { width: number; height: number };
  config: {
    fontSize: string;
    cardPadding: string;
    headerHeight: string;
    gridGap: string;
    marketOverviewCols: number;
    defiMetricsCols: number;
    textScale: number;
  };
  getFontSizeClass: (type?: 'xs' | 'sm' | 'base' | 'lg' | 'xl') => string;
  getPaddingClass: () => string;
  getGapClass: () => string;
  textScale: number;
}

const ResolutionContext = React.createContext<ResolutionContextType | undefined>(undefined);

export const ResolutionProvider = ({ children }: { children: ReactNode }) => {
  const resolutionData = useResolution();
  
  return (
    <ResolutionContext.Provider value={resolutionData}>
      {children}
    </ResolutionContext.Provider>
  );
};

// Custom hook để sử dụng context
export const useResolutionContext = () => {
  const context = useContext(ResolutionContext);
  if (!context) {
    throw new Error('useResolutionContext must be used within ResolutionProvider');
  }
  return context;
};

export { useResolution };