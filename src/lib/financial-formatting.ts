// Professional Financial Formatting Utilities
// Designed for cryptocurrency and financial dashboards
// Following Bloomberg, Reuters, and Yahoo Finance standards

export interface FormatOptions {
  style?: 'compact' | 'detailed' | 'smart';
  maxDigits?: number;
  showCurrency?: boolean;
  decimals?: number;
  context?: 'card' | 'chart' | 'table' | 'report';
  currency?: string;
}

export interface FormattedValue {
  compact: string;      // "$44.48B"
  detailed: string;     // "$44,480,499,366.74"
  short: string;       // "44.48B"
  raw: number;          // Original value
}

/**
 * Professional Financial Formatter for cryptocurrency and financial data
 * Follows industry standards from Bloomberg, Reuters, and Yahoo Finance
 */
export class FinancialFormatter {
  private static readonly thresholds = {
    thousand: 1e3,
    million: 1e6,
    billion: 1e9,
    trillion: 1e12,
    quadrillion: 1e15,
  };

  private static readonly suffixes = {
    thousand: 'K',
    million: 'M',
    billion: 'B',
    trillion: 'T',
    quadrillion: 'Q',
  };

  /**
   * Format value in compact style (primary dashboard display)
   * Examples: "$44.48B", "$395.07M", "$2.45T"
   */
  static formatCompact(
    value: number | null | undefined,
    options: FormatOptions = {}
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    const { 
      maxDigits = 8, 
      showCurrency = true, 
      decimals = 2,
      currency = 'USD'
    } = options;
    
    const numValue = Math.abs(value);
    
    // Handle very large values
    if (numValue >= this.thresholds.quadrillion) {
      const formatted = (value / this.thresholds.quadrillion).toFixed(decimals);
      return showCurrency ? `$${formatted}Q` : `${formatted}Q`;
    }
    
    if (numValue >= this.thresholds.trillion) {
      const formatted = (value / this.thresholds.trillion).toFixed(decimals);
      return showCurrency ? `$${formatted}T` : `${formatted}T`;
    }
    
    if (numValue >= this.thresholds.billion) {
      const formatted = (value / this.thresholds.billion).toFixed(decimals);
      return showCurrency ? `$${formatted}B` : `${formatted}B`;
    }
    
    if (numValue >= this.thresholds.million) {
      const formatted = (value / this.thresholds.million).toFixed(decimals);
      return showCurrency ? `$${formatted}M` : `${formatted}M`;
    }
    
    if (numValue >= this.thresholds.thousand) {
      const formatted = (value / this.thresholds.thousand).toFixed(decimals);
      return showCurrency ? `$${formatted}K` : `${formatted}K`;
    }
    
    // For values less than 1K, use standard currency format
    if (showCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    }
    
    return value.toFixed(decimals);
  }

  /**
   * Format value in detailed style (full precision)
   * Examples: "$44,480,499,366.74", "$395,066,001,931.13"
   */
  static formatDetailed(
    value: number | null | undefined,
    options: FormatOptions = {}
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    const { 
      decimals = 2,
      currency = 'USD'
    } = options;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Format value in short style (no currency symbol)
   * Examples: "44.48B", "395.07M", "2.45T"
   */
  static formatShort(
    value: number | null | undefined,
    options: FormatOptions = {}
  ): string {
    const optionsWithoutCurrency = { ...options, showCurrency: false };
    return this.formatCompact(value, optionsWithoutCurrency);
  }

  /**
   * Smart formatting based on context and available space
   */
  static formatSmart(
    value: number | null | undefined,
    context: 'card' | 'chart' | 'table' | 'report' = 'card',
    options: FormatOptions = {}
  ): string {
    const contextOptions: FormatOptions = { ...options, context };
    
    switch (context) {
      case 'card':
        // Cards need compact formatting due to space constraints
        return this.formatCompact(value, { ...contextOptions, maxDigits: 6, decimals: 2 });
      
      case 'chart':
        // Charts often need no currency symbol and shorter format
        return this.formatCompact(value, { ...contextOptions, showCurrency: false, maxDigits: 8, decimals: 1 });
      
      case 'table':
        // Tables can handle slightly longer formats
        return this.formatCompact(value, { ...contextOptions, maxDigits: 10, decimals: 2 });
      
      case 'report':
        // Reports should show full precision
        return this.formatDetailed(value, contextOptions);
      
      default:
        return this.formatCompact(value, contextOptions);
    }
  }

  /**
   * Get all formatted versions of a value
   * Useful for tooltips, exports, and multiple display contexts
   */
  static formatAll(
    value: number | null | undefined,
    options: FormatOptions = {}
  ): FormattedValue {
    if (value === null || value === undefined || isNaN(value)) {
      return {
        compact: 'N/A',
        detailed: 'N/A',
        short: 'N/A',
        raw: 0,
      };
    }

    return {
      compact: this.formatCompact(value, options),
      detailed: this.formatDetailed(value, options),
      short: this.formatShort(value, options),
      raw: value,
    };
  }

  /**
   * Format percentage values
   */
  static formatPercent(
    value: number | null | undefined,
    decimals: number = 2,
    showSign: boolean = true
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  }

  /**
   * Format large numbers without currency (for market cap, volume, etc.)
   */
  static formatLargeNumber(
    value: number | null | undefined,
    options: FormatOptions = {}
  ): string {
    return this.formatCompact(value, { ...options, showCurrency: false });
  }

  /**
   * Get the appropriate suffix for a value
   */
  static getSuffix(value: number): string {
    const absValue = Math.abs(value);
    
    if (absValue >= this.thresholds.quadrillion) return this.suffixes.quadrillion;
    if (absValue >= this.thresholds.trillion) return this.suffixes.trillion;
    if (absValue >= this.thresholds.billion) return this.suffixes.billion;
    if (absValue >= this.thresholds.million) return this.suffixes.million;
    if (absValue >= this.thresholds.thousand) return this.suffixes.thousand;
    
    return '';
  }

  /**
   * Check if a value should be formatted as compact
   */
  static shouldUseCompactFormat(value: number, threshold: number = 1e6): boolean {
    return Math.abs(value) >= threshold;
  }

  /**
   * Auto-detect the best format based on value and context
   */
  static autoFormat(
    value: number | null | undefined,
    context: 'card' | 'chart' | 'table' | 'report' = 'card'
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    // Auto-detect if compact format should be used
    if (this.shouldUseCompactFormat(value)) {
      return this.formatSmart(value, context);
    }
    
    // For smaller values, use detailed format
    return this.formatDetailed(value);
  }
}

// Export convenience functions for backward compatibility
export const formatFinancialCurrency = (value: number | null | undefined, options?: FormatOptions) => 
  FinancialFormatter.formatCompact(value, options);

export const formatFinancialDetailed = (value: number | null | undefined, options?: FormatOptions) => 
  FinancialFormatter.formatDetailed(value, options);

export const formatFinancialSmart = (value: number | null | undefined, context: 'card' | 'chart' | 'table' | 'report' = 'card', options?: FormatOptions) => 
  FinancialFormatter.formatSmart(value, context, options);

export const formatFinancialPercent = (value: number | null | undefined, decimals?: number, showSign?: boolean) => 
  FinancialFormatter.formatPercent(value, decimals, showSign);

// Default export
export default FinancialFormatter;