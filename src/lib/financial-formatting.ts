// Financial Formatting Utilities
// Professional formatting for large financial values based on industry standards

/**
 * FinancialFormatter class for professional financial value formatting
 * Follows Bloomberg, Reuters, and Yahoo Finance standards
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
   * Format values in compact style (primary dashboard display)
   * Examples: $44.48B, $395.07B, $2.45M, $1.23T
   */
  static formatCompact(
    value: number | null | undefined,
    options: {
      maxDigits?: number;
      showCurrency?: boolean;
      decimals?: number;
      currency?: string;
    } = {}
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

    // Handle extremely large values
    if (numValue >= this.thresholds.quadrillion) {
      const formatted = (value / this.thresholds.quadrillion).toFixed(decimals);
      return showCurrency ? `$${formatted}Q` : `${formatted}Q`;
    }

    // Handle trillion values
    if (numValue >= this.thresholds.trillion) {
      const formatted = (value / this.thresholds.trillion).toFixed(decimals);
      return showCurrency ? `$${formatted}T` : `${formatted}T`;
    }

    // Handle billion values (most common for crypto/DeFi)
    if (numValue >= this.thresholds.billion) {
      const formatted = (value / this.thresholds.billion).toFixed(decimals);
      return showCurrency ? `$${formatted}B` : `${formatted}B`;
    }

    // Handle million values
    if (numValue >= this.thresholds.million) {
      const formatted = (value / this.thresholds.million).toFixed(decimals);
      return showCurrency ? `$${formatted}M` : `${formatted}M`;
    }

    // Handle thousand values
    if (numValue >= this.thresholds.thousand) {
      const formatted = (value / this.thresholds.thousand).toFixed(decimals);
      return showCurrency ? `$${formatted}K` : `${formatted}K`;
    }

    // For values less than 1K, use standard currency format
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Format values in detailed style (full precision)
   * Examples: $44,480,499,366.74, $395,066,001,931.13
   */
  static formatDetailed(
    value: number | null | undefined,
    options: {
      currency?: string;
      decimals?: number;
    } = {}
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    const { currency = 'USD', decimals = 2 } = options;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Format values in short style (numbers only, no currency symbol)
   * Examples: 44.48B, 395.07B, 2.45M
   */
  static formatShort(
    value: number | null | undefined,
    options: {
      decimals?: number;
    } = {}
  ): string {
    return this.formatCompact(value, {
      ...options,
      showCurrency: false,
    });
  }

  /**
   * Smart formatting based on context and available space
   */
  static formatSmart(
    value: number | null | undefined,
    context: 'card' | 'chart' | 'table' | 'report' | 'tooltip' = 'card',
    options: {
      availableSpace?: number;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    const { availableSpace = 100, priority = 'medium' } = options;

    switch (context) {
      case 'card':
        // Cards need compact formatting for space efficiency
        if (availableSpace < 80) {
          return this.formatCompact(value, { maxDigits: 6, decimals: 1 });
        }
        return this.formatCompact(value, { maxDigits: 8, decimals: 2 });

      case 'chart':
        // Charts often need shorter labels
        return this.formatShort(value, { decimals: 1 });

      case 'table':
        // Tables can handle slightly longer formats
        return this.formatCompact(value, { maxDigits: 10, decimals: 2 });

      case 'report':
        // Reports show full precision
        return this.formatDetailed(value);

      case 'tooltip':
        // Tooltips show detailed values
        return this.formatDetailed(value);

      default:
        return this.formatCompact(value);
    }
  }

  /**
   * Format percentage values with consistent styling
   */
  static formatPercent(
    value: number | null | undefined,
    options: {
      decimals?: number;
      showSign?: boolean;
      style?: 'compact' | 'detailed';
    } = {}
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    const { decimals = 2, showSign = true, style = 'compact' } = options;

    const formattedValue = value.toFixed(decimals);
    const sign = showSign && value > 0 ? '+' : '';

    return style === 'compact' 
      ? `${sign}${formattedValue}%`
      : `${sign}${formattedValue}%`;
  }

  /**
   * Get multiple format variations for a single value
   * Useful for responsive design and tooltips
   */
  static getAllFormats(
    value: number | null | undefined,
    options: {
      currency?: string;
      decimals?: number;
    } = {}
  ) {
    if (value === null || value === undefined || isNaN(value)) {
      return {
        compact: 'N/A',
        detailed: 'N/A',
        short: 'N/A',
        raw: null,
      };
    }

    const { currency = 'USD', decimals = 2 } = options;

    return {
      compact: this.formatCompact(value, { currency, decimals }),
      detailed: this.formatDetailed(value, { currency, decimals }),
      short: this.formatShort(value, { decimals }),
      raw: value,
    };
  }

  /**
   * Format large numbers with custom thresholds
   * Useful for specific use cases that need non-standard formatting
   */
  static formatWithCustomThresholds(
    value: number | null | undefined,
    thresholds: {
      million?: number;
      billion?: number;
      trillion?: number;
    },
    options: {
      decimals?: number;
      showCurrency?: boolean;
    } = {}
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    const { decimals = 2, showCurrency = true } = options;
    const customThresholds = { ...this.thresholds, ...thresholds };
    const numValue = Math.abs(value);

    if (numValue >= (customThresholds.trillion || this.thresholds.trillion)) {
      const formatted = (value / (customThresholds.trillion || this.thresholds.trillion)).toFixed(decimals);
      return showCurrency ? `$${formatted}T` : `${formatted}T`;
    }

    if (numValue >= (customThresholds.billion || this.thresholds.billion)) {
      const formatted = (value / (customThresholds.billion || this.thresholds.billion)).toFixed(decimals);
      return showCurrency ? `$${formatted}B` : `${formatted}B`;
    }

    if (numValue >= (customThresholds.million || this.thresholds.million)) {
      const formatted = (value / (customThresholds.million || this.thresholds.million)).toFixed(decimals);
      return showCurrency ? `$${formatted}M` : `${formatted}M`;
    }

    return this.formatCompact(value, { decimals, showCurrency });
  }

  /**
   * Check if a value should be formatted as compact
   */
  static shouldUseCompactFormat(value: number | null | undefined): boolean {
    if (value === null || value === undefined || isNaN(value)) {
      return false;
    }
    return Math.abs(value) >= this.thresholds.million;
  }

  /**
   * Get the appropriate suffix for a value
   */
  static getSuffix(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '';
    }

    const numValue = Math.abs(value);

    if (numValue >= this.thresholds.quadrillion) return this.suffixes.quadrillion;
    if (numValue >= this.thresholds.trillion) return this.suffixes.trillion;
    if (numValue >= this.thresholds.billion) return this.suffixes.billion;
    if (numValue >= this.thresholds.million) return this.suffixes.million;
    if (numValue >= this.thresholds.thousand) return this.suffixes.thousand;
    return '';
  }

  /**
   * Parse a formatted string back to number
   * Useful for user input processing
   */
  static parseFormatted(formattedString: string): number | null {
    if (!formattedString || formattedString === 'N/A') {
      return null;
    }

    // Remove currency symbols and commas
    const cleanString = formattedString.replace(/[$,\s]/g, '');
    
    // Extract number and suffix
    const match = cleanString.match(/^(-?\d+\.?\d*)([KMBTQ])?$/i);
    if (!match) {
      return null;
    }

    const [, numberStr, suffix] = match;
    const number = parseFloat(numberStr);

    if (isNaN(number)) {
      return null;
    }

    // Apply multiplier based on suffix
    const multiplier = suffix ? {
      'K': this.thresholds.thousand,
      'M': this.thresholds.million,
      'B': this.thresholds.billion,
      'T': this.thresholds.trillion,
      'Q': this.thresholds.quadrillion,
    }[suffix.toUpperCase()] : 1;

    return number * multiplier;
  }
}

// Export convenience functions for easier usage
export const formatFinancialCompact = (value: number | null | undefined, options?: Parameters<typeof FinancialFormatter.formatCompact>[1]) =>
  FinancialFormatter.formatCompact(value, options);

export const formatFinancialDetailed = (value: number | null | undefined, options?: Parameters<typeof FinancialFormatter.formatDetailed>[1]) =>
  FinancialFormatter.formatDetailed(value, options);

export const formatFinancialSmart = (value: number | null | undefined, context: Parameters<typeof FinancialFormatter.formatSmart>[1], options?: Parameters<typeof FinancialFormatter.formatSmart>[2]) =>
  FinancialFormatter.formatSmart(value, context, options);

export const formatFinancialPercent = (value: number | null | undefined, options?: Parameters<typeof FinancialFormatter.formatPercent>[1]) =>
  FinancialFormatter.formatPercent(value, options);

export const getAllFinancialFormats = (value: number | null | undefined, options?: Parameters<typeof FinancialFormatter.getAllFormats>[1]) =>
  FinancialFormatter.getAllFormats(value, options);

// Default export
export default FinancialFormatter;