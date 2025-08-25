import type { MetricValue, HistoricalDataPoint } from './types';

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: number; // 0-1 value
  momentum: 'strong' | 'moderate' | 'weak';
  volatility: number; // standard deviation based
  confidence: number; // 0-1 value based on data quality
  trendline: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  keyPoints: {
    peak: number;
    trough: number;
    current: number;
  };
  recommendations: string[];
}

export interface TrendConfig {
  minDataPoints: number;
  volatilityThreshold: number;
  strengthThresholds: {
    weak: number;
    moderate: number;
    strong: number;
  };
  lookbackPeriods: {
    short: number;
    medium: number;
    long: number;
  };
}

const DEFAULT_CONFIG: TrendConfig = {
  minDataPoints: 5,
  volatilityThreshold: 0.1,
  strengthThresholds: {
    weak: 0.3,
    moderate: 0.6,
    strong: 0.8
  },
  lookbackPeriods: {
    short: 7,
    medium: 30,
    long: 90
  }
};

/**
 * Calculate trend analysis from historical data points
 */
export function calculateTrend(
  data: HistoricalDataPoint[],
  config: TrendConfig = DEFAULT_CONFIG
): TrendAnalysis {
  if (data.length < config.minDataPoints) {
    return {
      direction: 'stable',
      strength: 0,
      momentum: 'weak',
      volatility: 0,
      confidence: 0,
      trendline: { slope: 0, intercept: 0, rSquared: 0 },
      keyPoints: { peak: 0, trough: 0, current: 0 },
      recommendations: ['Insufficient data for trend analysis']
    };
  }

  const values = data.map(d => d.value);
  const timestamps = data.map(d => d.timestamp.getTime());
  
  // Calculate basic statistics
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const volatility = Math.sqrt(variance) / mean; // coefficient of variation
  
  // Linear regression for trendline
  const trendline = calculateLinearRegression(timestamps, values);
  
  // Determine direction and strength
  const direction = trendline.slope > 0.01 ? 'up' : trendline.slope < -0.01 ? 'down' : 'stable';
  const strength = Math.min(Math.abs(trendline.slope) / (mean * 0.01), 1); // normalize to 0-1
  
  // Determine momentum based on recent performance
  const momentum = calculateMomentum(values, config);
  
  // Calculate confidence based on R-squared and data consistency
  const confidence = Math.min(trendline.rSquared * (1 - volatility), 1);
  
  // Find key points
  const peak = Math.max(...values);
  const trough = Math.min(...values);
  const current = values[values.length - 1];
  
  // Generate recommendations
  const recommendations = generateRecommendations({
    direction,
    strength,
    momentum,
    volatility,
    current,
    peak,
    trough
  });

  return {
    direction,
    strength,
    momentum,
    volatility,
    confidence,
    trendline,
    keyPoints: { peak, trough, current },
    recommendations
  };
}

/**
 * Calculate linear regression coefficients
 */
function calculateLinearRegression(x: number[], y: number[]) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const meanY = sumY / n;
  const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const residualSumSquares = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  
  const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
  
  return { slope, intercept, rSquared };
}

/**
 * Calculate momentum based on recent vs historical performance
 */
function calculateMomentum(values: number[], config: TrendConfig): 'strong' | 'moderate' | 'weak' {
  if (values.length < config.lookbackPeriods.short) return 'weak';
  
  const recent = values.slice(-config.lookbackPeriods.short);
  const earlier = values.slice(-config.lookbackPeriods.medium, -config.lookbackPeriods.short);
  
  if (earlier.length === 0) return 'weak';
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  
  const change = Math.abs(recentAvg - earlierAvg) / earlierAvg;
  
  if (change > config.strengthThresholds.strong) return 'strong';
  if (change > config.strengthThresholds.moderate) return 'moderate';
  return 'weak';
}

/**
 * Generate trend-based recommendations
 */
function generateRecommendations(params: {
  direction: 'up' | 'down' | 'stable';
  strength: number;
  momentum: 'strong' | 'moderate' | 'weak';
  volatility: number;
  current: number;
  peak: number;
  trough: number;
}): string[] {
  const { direction, strength, momentum, volatility, current, peak, trough } = params;
  const recommendations: string[] = [];
  
  if (direction === 'up') {
    if (strength > 0.7 && momentum === 'strong') {
      recommendations.push('Strong upward trend detected - consider monitoring for potential overbought conditions');
    } else if (strength > 0.4) {
      recommendations.push('Moderate upward trend - current growth appears sustainable');
    }
    
    if (current > peak * 0.95) {
      recommendations.push('Approaching peak levels - watch for potential resistance');
    }
  } else if (direction === 'down') {
    if (strength > 0.7 && momentum === 'strong') {
      recommendations.push('Strong downward trend - consider monitoring for potential oversold conditions');
    } else if (strength > 0.4) {
      recommendations.push('Moderate downward trend - monitor for stabilization signals');
    }
    
    if (current < trough * 1.05) {
      recommendations.push('Approaching trough levels - watch for potential support');
    }
  } else {
    recommendations.push('Stable trend - current levels appear consolidated');
  }
  
  if (volatility > 0.2) {
    recommendations.push('High volatility detected - trend may be less reliable');
  }
  
  return recommendations;
}

/**
 * Convert trend analysis to metric value format
 */
export function trendAnalysisToMetricValue(
  analysis: TrendAnalysis,
  currentValue: number,
  previousValue?: number
): MetricValue {
  const change = previousValue !== undefined ? currentValue - previousValue : 0;
  const changePercent = previousValue !== undefined && previousValue !== 0 
    ? (change / previousValue) * 100 
    : 0;
  
  return {
    value: currentValue,
    change,
    changePercent,
    trend: analysis.direction,
    timestamp: new Date()
  };
}

/**
 * Calculate multiple timeframe trends
 */
export function calculateMultiTimeframeTrends(
  data: HistoricalDataPoint[],
  timeframes: number[] = [7, 30, 90]
): Record<string, TrendAnalysis> {
  const results: Record<string, TrendAnalysis> = {};
  
  timeframes.forEach((timeframe) => {
    const timeframeData = data.slice(-timeframe);
    results[`${timeframe}d`] = calculateTrend(timeframeData);
  });
  
  return results;
}