// Data Transformation Pipeline

import type { HistoricalDataPoint } from '@/lib/types';
import type { HistoricalDataRequest } from '@/lib/data-sources/historical-data';

export interface TransformationConfig {
  metricType: 'bridge' | 'exchange' | 'staking' | 'mining';
  normalization: {
    scale: number; // Scale factor for normalization
    unit: string; // Target unit
  };
  filtering: {
    removeOutliers: boolean;
    outlierThreshold: number; // Standard deviations
    minValues: number; // Minimum data points required
  };
  aggregation: {
    enabled: boolean;
    window: string; // '1h', '24h', '7d'
    method: 'avg' | 'sum' | 'max' | 'min';
  };
}

export interface TransformationResult {
  success: boolean;
  data: HistoricalDataPoint[];
  metadata: {
    originalCount: number;
    transformedCount: number;
    outliersRemoved: number;
    normalizationScale: number;
    transformationTime: number;
  };
  warnings: string[];
  errors: string[];
}

export class DataTransformer {
  private configs: Map<string, TransformationConfig> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs(): void {
    // Bridge flows configuration
    this.configs.set('bridge_flows', {
      metricType: 'bridge',
      normalization: {
        scale: 1e9, // Convert to billions
        unit: 'B USD'
      },
      filtering: {
        removeOutliers: true,
        outlierThreshold: 3,
        minValues: 5
      },
      aggregation: {
        enabled: false,
        window: '24h',
        method: 'avg'
      }
    });

    // Exchange flows configuration
    this.configs.set('exchange_flows', {
      metricType: 'exchange',
      normalization: {
        scale: 1e6, // Convert to millions
        unit: 'M USD'
      },
      filtering: {
        removeOutliers: true,
        outlierThreshold: 2.5,
        minValues: 5
      },
      aggregation: {
        enabled: false,
        window: '24h',
        method: 'avg'
      }
    });

    // Staking metrics configuration
    this.configs.set('staking_metrics', {
      metricType: 'staking',
      normalization: {
        scale: 1, // Keep as percentage
        unit: '%'
      },
      filtering: {
        removeOutliers: true,
        outlierThreshold: 2,
        minValues: 7
      },
      aggregation: {
        enabled: true,
        window: '24h',
        method: 'avg'
      }
    });

    // Mining validation configuration
    this.configs.set('mining_validation', {
      metricType: 'mining',
      normalization: {
        scale: 1e15, // Convert to PH/s (Petahash per second)
        unit: 'PH/s'
      },
      filtering: {
        removeOutliers: true,
        outlierThreshold: 3.5,
        minValues: 5
      },
      aggregation: {
        enabled: false,
        window: '24h',
        method: 'avg'
      }
    });
  }

  async transformData(
    rawData: any,
    request: HistoricalDataRequest
  ): Promise<TransformationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Get configuration for metric type
      const config = this.configs.get(request.metric);
      if (!config) {
        throw new Error(`No configuration found for metric: ${request.metric}`);
      }

      // Step 1: Parse raw data
      let parsedData = this.parseRawData(rawData, request.metric);
      const originalCount = parsedData.length;

      // Step 2: Validate minimum data points
      if (parsedData.length < config.filtering.minValues) {
        errors.push(`Insufficient data points: ${parsedData.length} < ${config.filtering.minValues}`);
        return {
          success: false,
          data: [],
          metadata: {
            originalCount,
            transformedCount: 0,
            outliersRemoved: 0,
            normalizationScale: config.normalization.scale,
            transformationTime: Date.now() - startTime
          },
          warnings,
          errors
        };
      }

      // Step 3: Sort data by timestamp
      parsedData = this.sortByTimestamp(parsedData);

      // Step 4: Remove outliers if enabled
      let outliersRemoved = 0;
      if (config.filtering.removeOutliers) {
        const outlierResult = this.removeOutliers(parsedData, config.filtering.outlierThreshold);
        parsedData = outlierResult.data;
        outliersRemoved = outlierResult.removedCount;
        
        if (outlierResult.removedCount > 0) {
          warnings.push(`Removed ${outlierResult.removedCount} outliers using ${config.filtering.outlierThreshold}σ threshold`);
        }
      }

      // Step 5: Normalize values
      parsedData = this.normalizeValues(parsedData, config.normalization.scale);

      // Step 6: Aggregate data if enabled
      if (config.aggregation.enabled) {
        parsedData = await this.aggregateData(parsedData, config.aggregation);
      }

      // Step 7: Fill missing data points
      parsedData = this.fillMissingData(parsedData, request.timeframe);

      // Step 8: Validate final data
      const validationResult = this.validateTransformedData(parsedData);
      warnings.push(...validationResult.warnings);
      errors.push(...validationResult.errors);

      const transformedCount = parsedData.length;

      return {
        success: errors.length === 0,
        data: parsedData,
        metadata: {
          originalCount,
          transformedCount,
          outliersRemoved,
          normalizationScale: config.normalization.scale,
          transformationTime: Date.now() - startTime
        },
        warnings,
        errors
      };
    } catch (error) {
      errors.push(`Transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        data: [],
        metadata: {
          originalCount: 0,
          transformedCount: 0,
          outliersRemoved: 0,
          normalizationScale: 1,
          transformationTime: Date.now() - startTime
        },
        warnings,
        errors
      };
    }
  }

  private parseRawData(rawData: any, metricType: string): HistoricalDataPoint[] {
    if (!rawData || typeof rawData !== 'object') {
      return [];
    }

    // Handle different data formats
    if (Array.isArray(rawData)) {
      return rawData.map(item => this.parseDataPoint(item, metricType)).filter(Boolean);
    }

    // Handle nested data structure
    if (rawData.data && Array.isArray(rawData.data)) {
      return rawData.data.map(item => this.parseDataPoint(item, metricType)).filter(Boolean);
    }

    // Handle single data point
    if (rawData.timestamp && rawData.value !== undefined) {
      const point = this.parseDataPoint(rawData, metricType);
      return point ? [point] : [];
    }

    return [];
  }

  private parseDataPoint(item: any, metricType: string): HistoricalDataPoint | null {
    try {
      // Parse timestamp
      let timestamp: Date;
      if (item.timestamp) {
        timestamp = new Date(item.timestamp);
      } else if (item.time) {
        timestamp = new Date(item.time);
      } else if (item.t) {
        timestamp = new Date(item.t * 1000); // Unix timestamp
      } else {
        return null;
      }

      // Validate timestamp
      if (isNaN(timestamp.getTime())) {
        return null;
      }

      // Parse value
      let value: number;
      if (item.value !== undefined) {
        value = Number(item.value);
      } else if (item.v !== undefined) {
        value = Number(item.v);
      } else if (metricType === 'staking_metrics' && item.staking_rate !== undefined) {
        value = Number(item.staking_rate);
      } else if (metricType === 'mining_validation' && item.hashrate !== undefined) {
        value = Number(item.hashrate);
      } else {
        return null;
      }

      // Validate value
      if (isNaN(value) || !isFinite(value)) {
        return null;
      }

      // Parse volume (optional)
      let volume: number = 0;
      if (item.volume !== undefined) {
        volume = Number(item.volume);
      } else if (metricType === 'staking_metrics' && item.total_staked !== undefined) {
        volume = Number(item.total_staked);
      } else if (metricType === 'mining_validation' && item.blocks_mined !== undefined) {
        volume = Number(item.blocks_mined);
      }

      return {
        timestamp,
        value,
        volume: isNaN(volume) ? 0 : volume
      };
    } catch (error) {
      return null;
    }
  }

  private sortByTimestamp(data: HistoricalDataPoint[]): HistoricalDataPoint[] {
    return [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private removeOutliers(data: HistoricalDataPoint[], threshold: number): { data: HistoricalDataPoint[]; removedCount: number } {
    if (data.length < 3) {
      return { data, removedCount: 0 };
    }

    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const filteredData = data.filter(point => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      return zScore <= threshold;
    });

    return {
      data: filteredData,
      removedCount: data.length - filteredData.length
    };
  }

  private normalizeValues(data: HistoricalDataPoint[], scale: number): HistoricalDataPoint[] {
    return data.map(point => ({
      ...point,
      value: point.value / scale
    }));
  }

  private async aggregateData(
    data: HistoricalDataPoint[],
    config: { window: string; method: 'avg' | 'sum' | 'max' | 'min' }
  ): Promise<HistoricalDataPoint[]> {
    const windowMs = this.parseWindowToMs(config.window);
    if (windowMs <= 0) {
      return data;
    }

    const aggregated: HistoricalDataPoint[] = [];
    let currentWindow: HistoricalDataPoint[] = [];
    let windowStart = data[0]?.timestamp.getTime() || Date.now();

    for (const point of data) {
      const pointTime = point.timestamp.getTime();

      if (pointTime - windowStart >= windowMs) {
        // Aggregate current window
        if (currentWindow.length > 0) {
          aggregated.push(this.aggregateWindow(currentWindow, config.method, windowStart));
        }
        
        // Start new window
        currentWindow = [point];
        windowStart = pointTime;
      } else {
        currentWindow.push(point);
      }
    }

    // Aggregate last window
    if (currentWindow.length > 0) {
      aggregated.push(this.aggregateWindow(currentWindow, config.method, windowStart));
    }

    return aggregated;
  }

  private parseWindowToMs(window: string): number {
    switch (window) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  }

  private aggregateWindow(
    window: HistoricalDataPoint[],
    method: 'avg' | 'sum' | 'max' | 'min',
    timestamp: number
  ): HistoricalDataPoint {
    const values = window.map(w => w.value);
    const volumes = window.map(w => w.volume);

    let aggregatedValue: number;
    let aggregatedVolume: number;

    switch (method) {
      case 'avg':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        aggregatedVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        break;
      case 'sum':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0);
        aggregatedVolume = volumes.reduce((sum, vol) => sum + vol, 0);
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        aggregatedVolume = Math.max(...volumes);
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        aggregatedVolume = Math.min(...volumes);
        break;
    }

    return {
      timestamp: new Date(timestamp),
      value: aggregatedValue,
      volume: aggregatedVolume
    };
  }

  private fillMissingData(data: HistoricalDataPoint[], timeframe: string): HistoricalDataPoint[] {
    if (data.length < 2) {
      return data;
    }

    const result: HistoricalDataPoint[] = [];
    const expectedInterval = this.getExpectedInterval(timeframe);

    for (let i = 0; i < data.length - 1; i++) {
      const current = data[i];
      const next = data[i + 1];
      
      result.push(current);

      const timeDiff = next.timestamp.getTime() - current.timestamp.getTime();
      const gaps = Math.floor(timeDiff / expectedInterval) - 1;

      // Fill gaps with interpolated values
      for (let j = 1; j <= gaps; j++) {
        const ratio = j / (gaps + 1);
        const interpolatedValue = current.value + (next.value - current.value) * ratio;
        const interpolatedVolume = current.volume + (next.volume - current.volume) * ratio;
        
        result.push({
          timestamp: new Date(current.timestamp.getTime() + j * expectedInterval),
          value: interpolatedValue,
          volume: interpolatedVolume
        });
      }
    }

    result.push(data[data.length - 1]);
    return result;
  }

  private getExpectedInterval(timeframe: string): number {
    switch (timeframe) {
      case '7d': return 24 * 60 * 60 * 1000; // 1 day
      case '30d': return 24 * 60 * 60 * 1000; // 1 day
      case '90d': return 7 * 24 * 60 * 60 * 1000; // 1 week
      default: return 24 * 60 * 60 * 1000; // 1 day
    }
  }

  private validateTransformedData(data: HistoricalDataPoint[]): { warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (data.length === 0) {
      errors.push('No data points after transformation');
      return { warnings, errors };
    }

    // Check for future timestamps
    const now = Date.now();
    const futurePoints = data.filter(d => d.timestamp.getTime() > now);
    if (futurePoints.length > 0) {
      warnings.push(`${futurePoints.length} data points have future timestamps`);
    }

    // Check for duplicate timestamps
    const timestamps = data.map(d => d.timestamp.getTime());
    const uniqueTimestamps = new Set(timestamps);
    if (uniqueTimestamps.size !== timestamps.length) {
      warnings.push('Duplicate timestamps detected');
    }

    // Check for extreme values
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    if (maxValue > 1e12) {
      warnings.push('Extremely large values detected - check normalization');
    }
    
    if (minValue < 0) {
      warnings.push('Negative values detected');
    }

    // Check time series continuity
    const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 1; i < sortedData.length; i++) {
      const timeDiff = sortedData[i].timestamp.getTime() - sortedData[i - 1].timestamp.getTime();
      if (timeDiff < 0) {
        errors.push('Data points are not in chronological order');
        break;
      }
    }

    return { warnings, errors };
  }

  // Get transformation configuration for a metric
  getConfig(metricType: string): TransformationConfig | undefined {
    return this.configs.get(metricType);
  }

  // Add custom configuration
  addConfig(metricType: string, config: TransformationConfig): void {
    this.configs.set(metricType, config);
  }

  // Get all available configurations
  getAllConfigs(): Map<string, TransformationConfig> {
    return new Map(this.configs);
  }
}

// Singleton instance
export const dataTransformer = new DataTransformer();