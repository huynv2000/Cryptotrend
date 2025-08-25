// Data Validation Layer

import type { HistoricalDataPoint } from '@/lib/types';

export interface ValidationRule {
  name: string;
  severity: 'error' | 'warning' | 'info';
  validate: (data: HistoricalDataPoint[]) => boolean;
  message: (data: HistoricalDataPoint[]) => string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  score: number; // 0-100 confidence score
  details: {
    totalPoints: number;
    validPoints: number;
    outlierCount: number;
    missingTimestamps: number;
    duplicateTimestamps: number;
    timeGaps: number;
    dataRange: { min: number; max: number };
    timeRange: { start: Date; end: Date };
  };
}

export interface ValidationConfig {
  requiredDataPoints: number;
  maxOutlierPercentage: number;
  maxMissingDataPercentage: number;
  maxTimeGapHours: number;
  valueRange: { min?: number; max?: number };
  timeRange: { minHours?: number; maxHours?: number };
  customRules?: ValidationRule[];
}

export class DataValidator {
  private defaultConfig: ValidationConfig;
  private customRules: Map<string, ValidationRule[]> = new Map();

  constructor() {
    this.defaultConfig = {
      requiredDataPoints: 5,
      maxOutlierPercentage: 10, // 10% of data can be outliers
      maxMissingDataPercentage: 20, // 20% of data can be missing
      maxTimeGapHours: 24, // Maximum 24 hour gap
      valueRange: { min: 0 }, // Values should be non-negative
      timeRange: { minHours: 1, maxHours: 90 * 24 } // 1 hour to 90 days
    };

    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Default validation rules for all data types
    this.customRules.set('default', [
      {
        name: 'minimum_data_points',
        severity: 'error',
        validate: (data) => data.length >= this.defaultConfig.requiredDataPoints,
        message: (data) => `Insufficient data points: ${data.length} < ${this.defaultConfig.requiredDataPoints}`
      },
      {
        name: 'chronological_order',
        severity: 'error',
        validate: (data) => {
          for (let i = 1; i < data.length; i++) {
            if (data[i].timestamp.getTime() < data[i - 1].timestamp.getTime()) {
              return false;
            }
          }
          return true;
        },
        message: () => 'Data points are not in chronological order'
      },
      {
        name: 'no_future_timestamps',
        severity: 'warning',
        validate: (data) => {
          const now = Date.now();
          return !data.some(point => point.timestamp.getTime() > now);
        },
        message: (data) => {
          const futureCount = data.filter(point => point.timestamp.getTime() > Date.now()).length;
          return `${futureCount} data points have future timestamps`;
        }
      },
      {
        name: 'no_duplicate_timestamps',
        severity: 'warning',
        validate: (data) => {
          const timestamps = data.map(d => d.timestamp.getTime());
          const uniqueTimestamps = new Set(timestamps);
          return uniqueTimestamps.size === timestamps.length;
        },
        message: (data) => {
          const timestamps = data.map(d => d.timestamp.getTime());
          const uniqueTimestamps = new Set(timestamps);
          return `Duplicate timestamps detected: ${timestamps.length - uniqueTimestamps.size} duplicates`;
        }
      },
      {
        name: 'value_range',
        severity: 'warning',
        validate: (data) => {
          const values = data.map(d => d.value);
          const { min, max } = this.defaultConfig.valueRange;
          
          if (min !== undefined && max !== undefined) {
            return values.every(v => v >= min && v <= max);
          } else if (min !== undefined) {
            return values.every(v => v >= min);
          } else if (max !== undefined) {
            return values.every(v => v <= max);
          }
          return true;
        },
        message: (data) => {
          const values = data.map(d => d.value);
          const { min, max } = this.defaultConfig.valueRange;
          const outOfRange = values.filter(v => {
            if (min !== undefined && max !== undefined) {
              return v < min || v > max;
            } else if (min !== undefined) {
              return v < min;
            } else if (max !== undefined) {
              return v > max;
            }
            return false;
          });
          return `${outOfRange.length} values out of range [${min || '-∞'}, ${max || '+∞'}]`;
        }
      },
      {
        name: 'finite_values',
        severity: 'error',
        validate: (data) => data.every(point => 
          isFinite(point.value) && !isNaN(point.value)
        ),
        message: (data) => {
          const invalidCount = data.filter(point => 
            !isFinite(point.value) || isNaN(point.value)
          ).length;
          return `${invalidCount} data points have invalid (non-finite) values`;
        }
      }
    ]);

    // Bridge flows specific rules
    this.customRules.set('bridge_flows', [
      {
        name: 'bridge_flow_volatility',
        severity: 'warning',
        validate: (data) => {
          if (data.length < 2) return true;
          const values = data.map(d => d.value);
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          const coefficientOfVariation = stdDev / mean;
          return coefficientOfVariation <= 5; // CV should be <= 500%
        },
        message: (data) => {
          if (data.length < 2) return 'Insufficient data for volatility check';
          const values = data.map(d => d.value);
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          const cv = (stdDev / mean * 100).toFixed(1);
          return `High volatility detected: coefficient of variation = ${cv}%`;
        }
      }
    ]);

    // Exchange flows specific rules
    this.customRules.set('exchange_flows', [
      {
        name: 'exchange_flow_balance',
        severity: 'info',
        validate: (data) => {
          // Exchange flows should have both positive and negative values
          const hasPositive = data.some(d => d.value > 0);
          const hasNegative = data.some(d => d.value < 0);
          return hasPositive && hasNegative;
        },
        message: (data) => {
          const positiveCount = data.filter(d => d.value > 0).length;
          const negativeCount = data.filter(d => d.value < 0).length;
          return `Exchange flow balance: ${positiveCount} inflows, ${negativeCount} outflows`;
        }
      }
    ]);

    // Staking metrics specific rules
    this.customRules.set('staking_metrics', [
      {
        name: 'staking_rate_range',
        severity: 'error',
        validate: (data) => {
          return data.every(point => point.value >= 0 && point.value <= 100);
        },
        message: (data) => {
          const outOfRange = data.filter(point => point.value < 0 || point.value > 100);
          return `${outOfRange.length} staking rates outside valid range [0, 100]%`;
        }
      }
    ]);

    // Mining validation specific rules
    this.customRules.set('mining_validation', [
      {
        name: 'mining_positive_values',
        severity: 'error',
        validate: (data) => data.every(point => point.value > 0),
        message: (data) => {
          const nonPositive = data.filter(point => point.value <= 0);
          return `${nonPositive.length} mining metrics have non-positive values`;
        }
      }
    ]);
  }

  validateData(
    data: HistoricalDataPoint[], 
    dataType?: string,
    config?: Partial<ValidationConfig>
  ): ValidationResult {
    const validationConfig = { ...this.defaultConfig, ...config };
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    // Get rules for data type
    const rules = this.getValidationRules(dataType);

    // Apply all validation rules
    for (const rule of rules) {
      try {
        const isValid = rule.validate(data);
        const message = rule.message(data);
        
        if (!isValid) {
          switch (rule.severity) {
            case 'error':
              errors.push(message);
              break;
            case 'warning':
              warnings.push(message);
              break;
            case 'info':
              info.push(message);
              break;
          }
        } else if (rule.severity === 'info') {
          // Include info messages even for valid data
          info.push(message);
        }
      } catch (error) {
        errors.push(`Validation rule '${rule.name}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Calculate detailed statistics
    const details = this.calculateDataDetails(data);

    // Additional validation based on statistics
    this.validateStatistics(details, validationConfig, errors, warnings);

    // Calculate confidence score
    const score = this.calculateConfidenceScore(errors, warnings, info, details, validationConfig);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      score,
      details
    };
  }

  private getValidationRules(dataType?: string): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    // Always include default rules
    const defaultRules = this.customRules.get('default') || [];
    rules.push(...defaultRules);

    // Add data type specific rules
    if (dataType && this.customRules.has(dataType)) {
      const specificRules = this.customRules.get(dataType) || [];
      rules.push(...specificRules);
    }

    return rules;
  }

  private calculateDataDetails(data: HistoricalDataPoint[]) {
    if (data.length === 0) {
      return {
        totalPoints: 0,
        validPoints: 0,
        outlierCount: 0,
        missingTimestamps: 0,
        duplicateTimestamps: 0,
        timeGaps: 0,
        dataRange: { min: 0, max: 0 },
        timeRange: { start: new Date(), end: new Date() }
      };
    }

    const values = data.map(d => d.value);
    const timestamps = data.map(d => d.timestamp.getTime());

    // Count outliers using IQR method
    const sortedValues = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedValues.length * 0.25);
    const q3Index = Math.floor(sortedValues.length * 0.75);
    const q1 = sortedValues[q1Index];
    const q3 = sortedValues[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = values.filter(v => v < lowerBound || v > upperBound);

    // Count duplicate timestamps
    const uniqueTimestamps = new Set(timestamps);
    const duplicateTimestamps = timestamps.length - uniqueTimestamps.size;

    // Count time gaps (> 1 hour)
    const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
    let timeGaps = 0;
    for (let i = 1; i < sortedTimestamps.length; i++) {
      const gap = sortedTimestamps[i] - sortedTimestamps[i - 1];
      if (gap > 60 * 60 * 1000) { // > 1 hour
        timeGaps++;
      }
    }

    return {
      totalPoints: data.length,
      validPoints: data.filter(d => isFinite(d.value) && !isNaN(d.value)).length,
      outlierCount: outliers.length,
      missingTimestamps: 0, // Would need expected timestamps to calculate this
      duplicateTimestamps,
      timeGaps,
      dataRange: { min: Math.min(...values), max: Math.max(...values) },
      timeRange: { 
        start: new Date(Math.min(...timestamps)), 
        end: new Date(Math.max(...timestamps)) 
      }
    };
  }

  private validateStatistics(
    details: ValidationResult['details'],
    config: ValidationConfig,
    errors: string[],
    warnings: string[]
  ): void {
    // Check outlier percentage
    const outlierPercentage = (details.outlierCount / details.totalPoints) * 100;
    if (outlierPercentage > config.maxOutlierPercentage) {
      warnings.push(`High outlier percentage: ${outlierPercentage.toFixed(1)}% > ${config.maxOutlierPercentage}%`);
    }

    // Check time range
    const timeRangeHours = (details.timeRange.end.getTime() - details.timeRange.start.getTime()) / (1000 * 60 * 60);
    if (config.timeRange.minHours && timeRangeHours < config.timeRange.minHours) {
      warnings.push(`Time range too short: ${timeRangeHours.toFixed(1)} hours < ${config.timeRange.minHours} hours`);
    }
    if (config.timeRange.maxHours && timeRangeHours > config.timeRange.maxHours) {
      warnings.push(`Time range too long: ${timeRangeHours.toFixed(1)} hours > ${config.timeRange.maxHours} hours`);
    }

    // Check for data consistency
    if (details.validPoints < details.totalPoints) {
      const invalidPercentage = ((details.totalPoints - details.validPoints) / details.totalPoints) * 100;
      if (invalidPercentage > config.maxMissingDataPercentage) {
        errors.push(`Too many invalid data points: ${invalidPercentage.toFixed(1)}% > ${config.maxMissingDataPercentage}%`);
      }
    }
  }

  private calculateConfidenceScore(
    errors: string[],
    warnings: string[],
    info: string[],
    details: ValidationResult['details'],
    config: ValidationConfig
  ): number {
    let score = 100;

    // Deduct for errors
    score -= errors.length * 20; // Each error costs 20 points

    // Deduct for warnings
    score -= warnings.length * 5; // Each warning costs 5 points

    // Deduct for data quality issues
    const outlierPercentage = (details.outlierCount / details.totalPoints) * 100;
    if (outlierPercentage > config.maxOutlierPercentage) {
      score -= Math.min(outlierPercentage - config.maxOutlierPercentage, 20);
    }

    // Deduct for time gaps
    if (details.timeGaps > 0) {
      score -= Math.min(details.timeGaps * 2, 10);
    }

    // Deduct for duplicate timestamps
    if (details.duplicateTimestamps > 0) {
      score -= Math.min(details.duplicateTimestamps, 10);
    }

    // Bonus for good data quality
    if (errors.length === 0 && warnings.length === 0) {
      score += 10; // Bonus for perfect validation
    }

    return Math.max(0, Math.min(100, score));
  }

  // Add custom validation rule
  addCustomRule(dataType: string, rule: ValidationRule): void {
    if (!this.customRules.has(dataType)) {
      this.customRules.set(dataType, []);
    }
    this.customRules.get(dataType)!.push(rule);
  }

  // Get validation configuration
  getConfig(): ValidationConfig {
    return { ...this.defaultConfig };
  }

  // Update validation configuration
  updateConfig(config: Partial<ValidationConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  // Validate single data point
  validateDataPoint(point: HistoricalDataPoint, dataType?: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Basic validation
    if (!point.timestamp || isNaN(point.timestamp.getTime())) {
      issues.push('Invalid timestamp');
    }

    if (!isFinite(point.value) || isNaN(point.value)) {
      issues.push('Invalid value');
    }

    if (point.volume !== undefined && (!isFinite(point.volume) || isNaN(point.volume))) {
      issues.push('Invalid volume');
    }

    // Data type specific validation
    if (dataType === 'staking_metrics' && (point.value < 0 || point.value > 100)) {
      issues.push('Staking rate must be between 0 and 100');
    }

    if (dataType === 'mining_validation' && point.value <= 0) {
      issues.push('Mining metrics must be positive');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Singleton instance
export const dataValidator = new DataValidator();