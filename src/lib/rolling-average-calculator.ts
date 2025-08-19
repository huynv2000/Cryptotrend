/**
 * Rolling Average Calculator for Blockchain Metrics
 * Calculates accurate rolling averages from historical data
 * 
 * Bộ tính toán trung bình động cho chỉ số blockchain
 * Tính toán trung bình động chính xác từ dữ liệu lịch sử
 * 
 * @author Financial Systems Expert
 * @version 1.0
 */

import { db } from '@/lib/db'

export interface RollingAverages {
  '7d': number
  '30d': number
  '90d': number
}

export interface RollingAverageResult {
  current: number
  rollingAverages: RollingAverages
  trend: 'up' | 'down' | 'stable'
  trendStrength: number // 0-1
  volatility: number // Standard deviation
  confidence: number // Based on data completeness
}

export class RollingAverageCalculator {
  private static instance: RollingAverageCalculator
  
  static getInstance(): RollingAverageCalculator {
    if (!RollingAverageCalculator.instance) {
      RollingAverageCalculator.instance = new RollingAverageCalculator()
    }
    return RollingAverageCalculator.instance
  }

  /**
   * Calculate rolling averages for a specific metric
   */
  async calculateRollingAverages(
    cryptoId: number,
    metricName: string,
    options: {
      maxAge?: number // Maximum age of data to consider (in days)
      minDataPoints?: number // Minimum data points required
    } = {}
  ): Promise<RollingAverageResult | null> {
    try {
      const { maxAge = 90, minDataPoints = 7 } = options
      
      // Get historical data
      const historicalData = await this.getHistoricalData(cryptoId, metricName, maxAge)
      
      if (historicalData.length < minDataPoints) {
        console.warn(`⚠️ Insufficient data for ${metricName}: ${historicalData.length} < ${minDataPoints}`)
        return null
      }

      // Extract values and sort by timestamp
      const values = historicalData
        .map(item => ({
          value: item[metricName],
          timestamp: new Date(item.timestamp)
        }))
        .filter(item => item.value !== null && item.value !== undefined && item.value > 0)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      if (values.length < minDataPoints) {
        console.warn(`⚠️ Insufficient valid data for ${metricName}: ${values.length} < ${minDataPoints}`)
        return null
      }

      const currentValue = values[values.length - 1].value
      
      // Calculate rolling averages
      const rollingAverages = {
        '7d': this.calculateAverageForPeriod(values, 7),
        '30d': this.calculateAverageForPeriod(values, 30),
        '90d': this.calculateAverageForPeriod(values, 90)
      }

      // Calculate trend and volatility
      const trend = this.calculateTrend(values)
      const volatility = this.calculateVolatility(values)
      const confidence = this.calculateConfidence(values, maxAge)

      return {
        current: currentValue,
        rollingAverages,
        trend: trend.direction,
        trendStrength: trend.strength,
        volatility,
        confidence
      }
    } catch (error) {
      console.error('❌ Error calculating rolling averages:', error)
      return null
    }
  }

  /**
   * Get historical data from database
   */
  private async getHistoricalData(
    cryptoId: number,
    metricName: string,
    maxAge: number
  ): Promise<any[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - maxAge)

    try {
      // Try to get from on-chain metrics first
      const onChainData = await db.onChainMetric.findMany({
        where: {
          cryptoId,
          timestamp: { gte: cutoffDate },
          [metricName]: { not: null }
        },
        orderBy: { timestamp: 'asc' }
      })

      if (onChainData.length > 0) {
        return onChainData
      }

      // Fallback to price history for price-related metrics
      if (metricName.includes('price') || metricName.includes('volume')) {
        const priceData = await db.priceHistory.findMany({
          where: {
            cryptoId,
            timestamp: { gte: cutoffDate }
          },
          orderBy: { timestamp: 'asc' }
        })

        if (priceData.length > 0) {
          return priceData
        }
      }

      // Fallback to technical indicators
      const technicalData = await db.technicalIndicator.findMany({
        where: {
          cryptoId,
          timestamp: { gte: cutoffDate },
          [metricName]: { not: null }
        },
        orderBy: { timestamp: 'asc' }
      })

      return technicalData
    } catch (error) {
      console.error('Error fetching historical data:', error)
      return []
    }
  }

  /**
   * Calculate average for a specific period
   */
  private calculateAverageForPeriod(values: Array<{value: number, timestamp: Date}>, days: number): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const periodValues = values.filter(item => item.timestamp >= cutoffDate)
    
    if (periodValues.length === 0) return 0
    
    const sum = periodValues.reduce((acc, item) => acc + item.value, 0)
    return sum / periodValues.length
  }

  /**
   * Calculate trend direction and strength
   */
  private calculateTrend(values: Array<{value: number, timestamp: Date}>): {
    direction: 'up' | 'down' | 'stable'
    strength: number
  } {
    if (values.length < 2) {
      return { direction: 'stable', strength: 0 }
    }

    const recentValues = values.slice(-7) // Last 7 values
    const olderValues = values.slice(-14, -7) // Previous 7 values

    if (olderValues.length === 0) {
      return { direction: 'stable', strength: 0 }
    }

    const recentAvg = recentValues.reduce((sum, item) => sum + item.value, 0) / recentValues.length
    const olderAvg = olderValues.reduce((sum, item) => sum + item.value, 0) / olderValues.length

    if (Math.abs(recentAvg - olderAvg) < olderAvg * 0.01) {
      return { direction: 'stable', strength: 0 }
    }

    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100
    const strength = Math.min(1, Math.abs(changePercent) / 10) // Normalize to 0-1

    return {
      direction: changePercent > 0 ? 'up' : 'down',
      strength
    }
  }

  /**
   * Calculate volatility (standard deviation)
   */
  private calculateVolatility(values: Array<{value: number, timestamp: Date}>): number {
    if (values.length < 2) return 0

    const mean = values.reduce((sum, item) => sum + item.value, 0) / values.length
    const squaredDiffs = values.map(item => Math.pow(item.value - mean, 2))
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
    
    return Math.sqrt(variance)
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(values: Array<{value: number, timestamp: Date}>, maxAge: number): number {
    const expectedDataPoints = maxAge
    const actualDataPoints = values.length
    
    // Base confidence on data completeness
    let confidence = actualDataPoints / expectedDataPoints
    
    // Reduce confidence if data is too old
    const newestData = values[values.length - 1]
    const ageInDays = (Date.now() - newestData.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    
    if (ageInDays > 1) {
      confidence *= Math.max(0.5, 1 - (ageInDays - 1) / 10)
    }
    
    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * Calculate growth rate compared to different periods
   */
  async calculateGrowthRates(
    cryptoId: number,
    metricName: string
  ): Promise<{
    '7d': number
    '30d': number
    '90d': number
  } | null> {
    try {
      const rollingResult = await this.calculateRollingAverages(cryptoId, metricName)
      
      if (!rollingResult) {
        return null
      }

      const current = rollingResult.current
      const averages = rollingResult.rollingAverages

      return {
        '7d': averages['7d'] > 0 ? ((current - averages['7d']) / averages['7d']) * 100 : 0,
        '30d': averages['30d'] > 0 ? ((current - averages['30d']) / averages['30d']) * 100 : 0,
        '90d': averages['90d'] > 0 ? ((current - averages['90d']) / averages['90d']) * 100 : 0
      }
    } catch (error) {
      console.error('Error calculating growth rates:', error)
      return null
    }
  }

  /**
   * Detect spikes in data
   */
  async detectSpike(
    cryptoId: number,
    metricName: string,
    thresholdMultiplier: number = 2.0
  ): Promise<{
    isSpike: boolean
    severity: 'low' | 'medium' | 'high'
    confidence: number
    currentValue: number
    baseline: number
    deviation: number
    message: string
  } | null> {
    try {
      const rollingResult = await this.calculateRollingAverages(cryptoId, metricName)
      
      if (!rollingResult) {
        return null
      }

      const current = rollingResult.current
      const baseline = rollingResult.rollingAverages['7d']
      const volatility = rollingResult.volatility

      // Calculate threshold based on baseline and volatility
      const threshold = baseline + (volatility * thresholdMultiplier)
      const deviation = current - baseline

      const isSpike = current > threshold
      const deviationPercent = baseline > 0 ? (deviation / baseline) * 100 : 0

      let severity: 'low' | 'medium' | 'high' = 'low'
      if (deviationPercent > 100) severity = 'high'
      else if (deviationPercent > 50) severity = 'medium'

      const confidence = Math.min(1, Math.abs(deviationPercent) / 100)

      return {
        isSpike,
        severity,
        confidence,
        currentValue: current,
        baseline,
        deviation,
        message: isSpike 
          ? `Spike detected in ${metricName}: ${deviationPercent.toFixed(2)}% above baseline`
          : `No spike detected in ${metricName}`
      }
    } catch (error) {
      console.error('Error detecting spike:', error)
      return null
    }
  }

  /**
   * Get data quality report
   */
  async getDataQualityReport(
    cryptoId: number,
    metricName: string
  ): Promise<{
    completeness: number // 0-1
    freshness: number // 0-1 (how recent is the data)
    consistency: number // 0-1 (how consistent are the values)
    overall: number // 0-1
    issues: string[]
  }> {
    try {
      const historicalData = await this.getHistoricalData(cryptoId, metricName, 90)
      
      // Calculate completeness
      const expectedDataPoints = 90
      const completeness = Math.min(1, historicalData.length / expectedDataPoints)

      // Calculate freshness
      let freshness = 0
      if (historicalData.length > 0) {
        const newestData = historicalData[historicalData.length - 1]
        const ageInHours = (Date.now() - newestData.timestamp.getTime()) / (1000 * 60 * 60)
        freshness = Math.max(0, 1 - ageInHours / 48) // Penalize if older than 48 hours
      }

      // Calculate consistency (low volatility = high consistency)
      let consistency = 0
      if (historicalData.length > 1) {
        const values = historicalData.map(item => item[metricName]).filter(v => v > 0)
        if (values.length > 1) {
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
          const coefficientOfVariation = Math.sqrt(variance) / mean
          consistency = Math.max(0, 1 - coefficientOfVariation) // Lower variation = higher consistency
        }
      }

      const overall = (completeness + freshness + consistency) / 3

      const issues: string[] = []
      if (completeness < 0.8) issues.push('Incomplete data coverage')
      if (freshness < 0.8) issues.push('Data is not fresh enough')
      if (consistency < 0.6) issues.push('Data consistency is low')

      return {
        completeness,
        freshness,
        consistency,
        overall,
        issues
      }
    } catch (error) {
      console.error('Error generating data quality report:', error)
      return {
        completeness: 0,
        freshness: 0,
        consistency: 0,
        overall: 0,
        issues: ['Error generating report']
      }
    }
  }
}