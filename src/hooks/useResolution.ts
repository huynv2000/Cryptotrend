'use client';

import { useState, useEffect } from 'react';

interface ResolutionConfig {
  fontSize: string;
  cardPadding: string;
  headerHeight: string;
  gridGap: string;
  marketOverviewCols: number;
  defiMetricsCols: number;
  textScale: number;
}

export const useResolution = () => {
  const [resolution, setResolution] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });
  
  const [config, setConfig] = useState<ResolutionConfig>({
    fontSize: 'base',
    cardPadding: '6',
    headerHeight: '16',
    gridGap: '6',
    marketOverviewCols: 7,
    defiMetricsCols: 3,
    textScale: 1,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setResolution({ width, height });
      
      // Tự động điều chỉnh cấu hình dựa trên độ phân giải
      let newConfig: ResolutionConfig;
      
      if (width >= 2560) { // 4K hoặc cao hơn
        newConfig = {
          fontSize: 'xl',
          cardPadding: '8',
          headerHeight: '20',
          gridGap: '8',
          marketOverviewCols: 7,
          defiMetricsCols: 3,
          textScale: 1.4,
        };
      } else if (width >= 1920) { // Full HD
        newConfig = {
          fontSize: 'lg',
          cardPadding: '6',
          headerHeight: '16',
          gridGap: '6',
          marketOverviewCols: 7,
          defiMetricsCols: 3,
          textScale: 1.2,
        };
      } else if (width >= 1440) { // Laptop lớn
        newConfig = {
          fontSize: 'base',
          cardPadding: '4',
          headerHeight: '14',
          gridGap: '4',
          marketOverviewCols: 6,
          defiMetricsCols: 3,
          textScale: 1.0,
        };
      } else if (width >= 1024) { // Tablet
        newConfig = {
          fontSize: 'sm',
          cardPadding: '4',
          headerHeight: '12',
          gridGap: '4',
          marketOverviewCols: 4,
          defiMetricsCols: 2,
          textScale: 0.9,
        };
      } else { // Mobile
        newConfig = {
          fontSize: 'xs',
          cardPadding: '3',
          headerHeight: '12',
          gridGap: '3',
          marketOverviewCols: 2,
          defiMetricsCols: 1,
          textScale: 0.8,
        };
      }
      
      setConfig(newConfig);
    };

    // Khởi tạo
    handleResize();
    
    // Thêm event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getFontSizeClass = (type: 'xs' | 'sm' | 'base' | 'lg' | 'xl' = 'base') => {
    const sizeMap = {
      xs: { xs: 'text-xs', sm: 'text-xs', base: 'text-xs', lg: 'text-sm', xl: 'text-base' },
      sm: { xs: 'text-xs', sm: 'text-sm', base: 'text-sm', lg: 'text-base', xl: 'text-lg' },
      base: { xs: 'text-sm', sm: 'text-base', base: 'text-base', lg: 'text-lg', xl: 'text-xl' },
      lg: { xs: 'text-base', sm: 'text-lg', base: 'text-lg', lg: 'text-xl', xl: 'text-2xl' },
      xl: { xs: 'text-lg', sm: 'text-xl', base: 'text-xl', lg: 'text-2xl', xl: 'text-3xl' },
    };
    
    return sizeMap[config.fontSize][type];
  };

  const getPaddingClass = () => {
    return `p-${config.cardPadding}`;
  };

  const getGapClass = () => {
    return `gap-${config.gridGap}`;
  };

  return {
    resolution,
    config,
    getFontSizeClass,
    getPaddingClass,
    getGapClass,
    textScale: config.textScale,
  };
};