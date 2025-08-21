/**
 * Chart utility functions for formatting and data processing
 */

/**
 * Format Y-axis tick values for currency display
 * @param value - The numeric value to format
 * @returns Formatted string with appropriate currency suffix
 */
export function formatYAxisTick(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format large numbers with appropriate suffixes
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places to show
 * @returns Formatted string with appropriate suffix
 */
export function formatLargeNumber(value: number, decimals: number = 1): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(decimals)}B`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  }
  return value.toString();
}

/**
 * Calculate Y-axis domain with padding for better visualization
 * @param data - Array of data points with TVL values
 * @param paddingPercentage - Percentage of padding to add (default: 0.1)
 * @returns Tuple of [min, max] for Y-axis domain
 */
export function calculateYDomain(data: { tvl: number }[], paddingPercentage: number = 0.1): [number, number] {
  if (data.length === 0) return [0, 100];
  
  const tvls = data.map(d => d.tvl);
  const min = Math.min(...tvls);
  const max = Math.max(...tvls);
  const range = max - min;
  const padding = range * paddingPercentage;
  
  return [Math.max(0, min - padding), max + padding];
}

/**
 * Generate chart colors based on performance (positive/negative)
 * @param isPositive - Whether the value is positive
 * @returns Object with fill and stroke colors
 */
export function getPerformanceColors(isPositive: boolean) {
  return {
    fill: isPositive ? '#10b981' : '#ef4444',
    stroke: isPositive ? '#059669' : '#dc2626'
  };
}

/**
 * Format date for chart display
 * @param date - Date string or Date object
 * @param format - Format string (default: 'MMM dd')
 * @returns Formatted date string
 */
export function formatChartDate(date: string | Date, formatStr: string = 'MMM dd'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Simple date formatting (you can enhance this or use date-fns)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  
  if (formatStr === 'MMM dd') {
    return `${month} ${day}`;
  }
  
  return dateObj.toLocaleDateString();
}

/**
 * Calculate optimal interval for X-axis labels to avoid crowding
 * @param dataLength - Number of data points
 * @param maxLabels - Maximum number of labels to show (default: 10)
 * @returns Optimal interval for label display
 */
export function calculateLabelInterval(dataLength: number, maxLabels: number = 10): number {
  return Math.ceil(dataLength / maxLabels);
}

/**
 * Create tooltip data for TVL charts
 * @param active - Whether tooltip is active
 * @param payload - Tooltip payload data
 * @param label - Tooltip label
 * @returns Object with tooltip data or null if not active
 */
export function createTVLTooltipData(active: boolean, payload: any[], label: string) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const changePercent = data.changePercent || 0;
    const isPositive = changePercent >= 0;
    
    return {
      fullDate: data.fullDate || label,
      formattedTVL: data.formattedTVL,
      changePercent: data.changePercent,
      isPositive,
      dominance: data.dominance
    };
  }
  
  return null;
}