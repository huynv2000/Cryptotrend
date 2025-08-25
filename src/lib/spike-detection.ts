// Type definitions for Spike Detection
export interface SpikeDetectionResult {
  isSpike: boolean;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  message: string;
  threshold: number;
  currentValue: number;
  baseline: number;
  deviation: number;
}

import SpikeDetectionCache from './spike-detection-cache';

/**
 * Spike Detection Algorithm for Financial Metrics
 * Implements statistical analysis to detect unusual spikes in blockchain metrics
 */
export class SpikeDetectionEngine {
  private static readonly DEFAULT_THRESHOLD = 2.5; // Standard deviations
  private static readonly MIN_DATA_POINTS = 10;
  private static readonly SPIKE_CONFIDENCE_THRESHOLD = 0.7;

  /**
   * Detect spikes in time series data
   * @param data Array of historical data points
   * @param currentValue Current metric value
   * @param metricName Name of the metric for context
   * @returns SpikeDetectionResult with analysis details
   */
  static detectSpike(
    data: Array<{ timestamp: Date; value: number }>,
    currentValue: number,
    metricName: string
  ): SpikeDetectionResult {
    // Validate input data
    if (!data || data.length < this.MIN_DATA_POINTS) {
      return this.createNoSpikeResult(currentValue, 0, 'Insufficient historical data');
    }

    // Calculate baseline statistics
    const values = data.map(point => point.value);
    const baseline = this.calculateMovingAverage(values, 7); // 7-day moving average
    const standardDeviation = this.calculateStandardDeviation(values);
    const threshold = baseline + (this.DEFAULT_THRESHOLD * standardDeviation);

    // Calculate deviation percentage
    const deviation = currentValue > baseline ? 
      ((currentValue - baseline) / baseline) * 100 : 
      ((baseline - currentValue) / baseline) * 100;

    // Determine if this is a spike
    const isSpike = currentValue > threshold && deviation > 20; // 20% minimum deviation
    const confidence = this.calculateConfidence(currentValue, baseline, standardDeviation);
    
    if (!isSpike || confidence < this.SPIKE_CONFIDENCE_THRESHOLD) {
      return this.createNoSpikeResult(currentValue, baseline, 'No significant spike detected');
    }

    // Determine severity based on deviation
    const severity = this.determineSeverity(deviation);
    const message = this.generateSpikeMessage(metricName, deviation, severity);

    return {
      isSpike: true,
      severity,
      confidence,
      message,
      threshold,
      currentValue,
      baseline,
      deviation
    };
  }

  /**
   * Calculate moving average for baseline - optimized with early return
   */
  private static calculateMovingAverage(values: number[], window: number): number {
    const len = values.length;
    if (len <= window) {
      return values.reduce((sum, val) => sum + val, 0) / len;
    }

    // Use slice for better performance with large arrays
    const recentValues = values.slice(-window);
    const sum = recentValues.reduce((sum, val) => sum + val, 0);
    return sum / window;
  }

  /**
   * Calculate standard deviation - optimized with single pass
   */
  private static calculateStandardDeviation(values: number[]): number {
    const len = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / len;
    
    // Single pass calculation for better performance
    let sumSquaredDifferences = 0;
    for (let i = 0; i < len; i++) {
      const diff = values[i] - mean;
      sumSquaredDifferences += diff * diff;
    }
    
    const variance = sumSquaredDifferences / len;
    return Math.sqrt(variance);
  }

  /**
   * Calculate confidence score for spike detection
   */
  private static calculateConfidence(currentValue: number, baseline: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    
    const zScore = Math.abs((currentValue - baseline) / stdDev);
    // Normalize confidence to 0-1 range
    return Math.min(zScore / 4, 1); // Cap at 4 standard deviations
  }

  /**
   * Determine severity level based on deviation percentage
   */
  private static determineSeverity(deviation: number): 'low' | 'medium' | 'high' {
    if (deviation < 50) return 'low';
    if (deviation < 100) return 'medium';
    return 'high';
  }

  /**
   * Generate human-readable spike message
   */
  private static generateSpikeMessage(metricName: string, deviation: number, severity: 'low' | 'medium' | 'high'): string {
    const severityText = {
      low: 'moderate',
      medium: 'significant',
      high: 'critical'
    }[severity];

    return `${metricName} shows ${severityText} spike of ${deviation.toFixed(1)}% above normal levels`;
  }

  /**
   * Create result object for no spike case
   */
  private static createNoSpikeResult(currentValue: number, baseline: number, message: string): SpikeDetectionResult {
    return {
      isSpike: false,
      severity: 'low',
      confidence: 0,
      message,
      threshold: baseline * 1.2, // 20% threshold as default
      currentValue,
      baseline,
      deviation: 0
    };
  }

  /**
   * Batch process multiple metrics for spike detection with caching - optimized
   */
  static detectSpikesBatch(
    historicalData: Record<string, Array<{ timestamp: Date; value: number }>>,
    currentValues: Record<string, number>,
    blockchain: string = 'default',
    timeframe: string = '24h',
    metricType: 'usage' | 'tvl' | 'cashflow' = 'usage'
  ): Record<string, SpikeDetectionResult> {
    const cache = SpikeDetectionCache.getInstance();
    
    // Try to get from cache first - early return for cache hit
    const cached = cache.get(blockchain, timeframe, metricType);
    if (cached) {
      return cached;
    }

    // Pre-validate and filter metrics to avoid unnecessary processing
    const validMetrics: Array<[string, number]> = [];
    for (const [metricName, currentValue] of Object.entries(currentValues)) {
      if (typeof currentValue === 'number' && !isNaN(currentValue) && isFinite(currentValue)) {
        const history = historicalData[metricName] || [];
        if (history.length >= this.MIN_DATA_POINTS) {
          validMetrics.push([metricName, currentValue]);
        }
      }
    }

    // Process spikes only for valid metrics
    const results: Record<string, SpikeDetectionResult> = {};
    
    for (const [metricName, currentValue] of validMetrics) {
      const history = historicalData[metricName] || [];
      results[metricName] = this.detectSpike(history, currentValue, metricName);
    }

    // Add default results for invalid metrics
    for (const [metricName, currentValue] of Object.entries(currentValues)) {
      if (!results[metricName]) {
        results[metricName] = this.createNoSpikeResult(
          currentValue, 
          currentValue, 
          'Invalid or insufficient data for spike detection'
        );
      }
    }

    // Cache the results
    cache.set(blockchain, timeframe, metricType, results);

    return results;
  }
}

/**
 * Utility functions for spike detection in different metric categories
 */
export class MetricSpikeDetectors {
  /**
   * Detect spikes in TVL-related metrics with caching
   */
  static detectTVLSpikes(
    historicalData: Record<string, Array<{ timestamp: Date; value: number }>>,
    currentMetrics: Record<string, number>,
    blockchain: string = 'default',
    timeframe: string = '24h'
  ): Record<string, SpikeDetectionResult> {
    const tvlMetrics = [
      'chainTVL', 'chainTVLChange24h', 'chainTVLChange7d', 'chainTVLChange30d',
      'tvlDominance', 'tvlRank', 'tvlPeak', 'tvlToMarketCapRatio',
      'defiTVL', 'stakingTVL', 'bridgeTVL', 'lendingTVL', 'dexTVL', 'yieldTVL'
    ];

    return this.detectMetricSpikesWithCache(
      tvlMetrics, 
      historicalData, 
      currentMetrics,
      blockchain,
      timeframe,
      'tvl'
    );
  }

  /**
   * Detect spikes in Usage metrics with caching
   */
  static detectUsageSpikes(
    historicalData: Record<string, Array<{ timestamp: Date; value: number }>>,
    currentMetrics: Record<string, number>,
    blockchain: string = 'default',
    timeframe: string = '24h'
  ): Record<string, SpikeDetectionResult> {
    const usageMetrics = [
      'dailyActiveAddresses', 'newAddresses', 'dailyTransactions',
      'transactionVolume', 'averageFee', 'hashRate'
    ];

    return this.detectMetricSpikesWithCache(
      usageMetrics, 
      historicalData, 
      currentMetrics,
      blockchain,
      timeframe,
      'usage'
    );
  }

  /**
   * Detect spikes in Cashflow metrics with caching
   */
  static detectCashflowSpikes(
    historicalData: Record<string, Array<{ timestamp: Date; value: number }>>,
    currentMetrics: Record<string, number>,
    blockchain: string = 'default',
    timeframe: string = '24h'
  ): Record<string, SpikeDetectionResult> {
    const cashflowMetrics = ['bridgeFlows', 'exchangeFlows', 'stakingMetrics', 'miningValidation'];

    return this.detectMetricSpikesWithCache(
      cashflowMetrics, 
      historicalData, 
      currentMetrics,
      blockchain,
      timeframe,
      'cashflow'
    );
  }

  /**
   * Generic method to detect spikes for specific metric categories with caching
   */
  private static detectMetricSpikesWithCache(
    metricNames: string[],
    historicalData: Record<string, Array<{ timestamp: Date; value: number }>>,
    currentMetrics: Record<string, number>,
    blockchain: string,
    timeframe: string,
    metricType: 'usage' | 'tvl' | 'cashflow'
  ): Record<string, SpikeDetectionResult> {
    // Filter current metrics to only include requested metrics
    const filteredCurrentMetrics: Record<string, number> = {};
    for (const metricName of metricNames) {
      if (currentMetrics[metricName] !== undefined) {
        filteredCurrentMetrics[metricName] = currentMetrics[metricName];
      }
    }

    // Use cached batch processing
    return SpikeDetectionEngine.detectSpikesBatch(
      historicalData,
      filteredCurrentMetrics,
      blockchain,
      timeframe,
      metricType
    );
  }
}