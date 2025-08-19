/**
 * Data Validation and Fallback Service
 * Validates data quality and provides fallback mechanisms
 * 
 * @author Financial Systems Expert
 * @version 1.0
 */

import { db } from '@/lib/db'

export interface ValidationResult {
  isValid: boolean
  value: any
  confidence: number
  source: 'api' | 'fallback' | 'calculated'
  timestamp: Date
  error?: string
}

export interface DataQualityScore {
  overall: number
  completeness: number
  timeliness: number
  accuracy: number
  consistency: number
}

export class DataValidationService {
  private static instance: DataValidationService
  
  static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService()
    }
    return DataValidationService.instance
  }

  /**
   * Detect if data is mock/test data
   */
  private isMockData(data: any): boolean {
    if (!data) return false
    
    // Check for obvious mock data patterns
    const mockPatterns = [
      /mock/i,
      /test/i,
      /sample/i,
      /demo/i,
      /fake/i
    ]
    
    const checkString = (str: string) => {
      return mockPatterns.some(pattern => pattern.test(str))
    }
    
    // Check various data fields
    if (data.source && checkString(data.source)) return true
    if (data.id && checkString(data.id.toString())) return true
    if (data.metadata && checkString(JSON.stringify(data.metadata))) return true
    
    // Check for unrealistic values
    if (data.price && (data.price < 0 || data.price > 1000000)) return true
    if (data.marketCap && data.marketCap > 10000000000000) return true // > $10T
    if (data.volume24h && data.volume24h > 1000000000000) return true // > $1T daily volume
    
    return false
  }

  /**
   * Validate price data
   */
  async validatePriceData(cryptoId: string, priceData: any): Promise<ValidationResult> {
    try {
      // Check if data is mock
      if (this.isMockData(priceData)) {
        return {
          isValid: false,
          value: priceData,
          confidence: 0,
          source: 'api',
          timestamp: new Date(),
          error: 'Mock data detected'
        }
      }

      // Validate required fields
      if (!priceData || typeof priceData !== 'object') {
        return {
          isValid: false,
          value: priceData,
          confidence: 0,
          source: 'api',
          timestamp: new Date(),
          error: 'Invalid price data format'
        }
      }

      // Check price value
      if (typeof priceData.price !== 'number' || priceData.price <= 0) {
        return {
          isValid: false,
          value: priceData,
          confidence: 0,
          source: 'api',
          timestamp: new Date(),
          error: 'Invalid price value'
        }
      }

      // Check for reasonable price ranges
      const reasonablePriceRanges: { [key: string]: { min: number; max: number } } = {
        'bitcoin': { min: 1000, max: 200000 },
        'ethereum': { min: 50, max: 10000 },
        'binancecoin': { min: 10, max: 1000 },
        'solana': { min: 1, max: 500 }
      }

      const range = reasonablePriceRanges[cryptoId]
      if (range && (priceData.price < range.min || priceData.price > range.max)) {
        return {
          isValid: false,
          value: priceData,
          confidence: 0,
          source: 'api',
          timestamp: new Date(),
          error: `Price out of reasonable range for ${cryptoId}`
        }
      }

      return {
        isValid: true,
        value: priceData,
        confidence: 0.95,
        source: 'api',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        isValid: false,
        value: priceData,
        confidence: 0,
        source: 'api',
        timestamp: new Date(),
        error: error.message
      }
    }
  }

  /**
   * Validate on-chain metrics
   */
  async validateOnChainMetrics(cryptoId: string, onChainData: any): Promise<ValidationResult> {
    try {
      // Check if data is mock
      if (this.isMockData(onChainData)) {
        return {
          isValid: false,
          value: onChainData,
          confidence: 0,
          source: 'api',
          timestamp: new Date(),
          error: 'Mock data detected'
        }
      }

      if (!onChainData || typeof onChainData !== 'object') {
        return {
          isValid: false,
          value: onChainData,
          confidence: 0,
          source: 'api',
          timestamp: new Date(),
          error: 'Invalid on-chain data format'
        }
      }

      // Validate active addresses
      if (onChainData.activeAddresses !== undefined) {
        if (typeof onChainData.activeAddresses !== 'number' || onChainData.activeAddresses < 0) {
          return {
            isValid: false,
            value: onChainData,
            confidence: 0,
            source: 'api',
            timestamp: new Date(),
            error: 'Invalid active addresses value'
          }
        }

        // Check for reasonable ranges
        const reasonableAddressRanges: { [key: string]: { min: number; max: number } } = {
          'bitcoin': { min: 100000, max: 2000000 },
          'ethereum': { min: 50000, max: 1000000 },
          'binancecoin': { min: 10000, max: 500000 },
          'solana': { min: 5000, max: 200000 }
        }

        const range = reasonableAddressRanges[cryptoId]
        if (range && (onChainData.activeAddresses < range.min || onChainData.activeAddresses > range.max)) {
          return {
            isValid: false,
            value: onChainData,
            confidence: 0.3, // Low confidence but still accept
            source: 'api',
            timestamp: new Date(),
            error: 'Active addresses out of expected range'
          }
        }
      }

      return {
        isValid: true,
        value: onChainData,
        confidence: 0.85,
        source: 'api',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        isValid: false,
        value: onChainData,
        confidence: 0,
        source: 'api',
        timestamp: new Date(),
        error: error.message
      }
    }
  }

  /**
   * Validate technical indicators
   */
  async validateTechnicalIndicators(cryptoId: string, technicalData: any): Promise<ValidationResult> {
    try {
      // Check if data is mock
      if (this.isMockData(technicalData)) {
        return {
          isValid: false,
          value: technicalData,
          confidence: 0,
          source: 'api',
          timestamp: new Date(),
          error: 'Mock data detected'
        }
      }

      if (!technicalData || typeof technicalData !== 'object') {
        return {
          isValid: false,
          value: technicalData,
          confidence: 0,
          source: 'api',
          timestamp: new Date(),
          error: 'Invalid technical data format'
        }
      }

      // Validate RSI
      if (technicalData.rsi !== undefined) {
        if (typeof technicalData.rsi !== 'number' || technicalData.rsi < 0 || technicalData.rsi > 100) {
          return {
            isValid: false,
            value: technicalData,
            confidence: 0,
            source: 'api',
            timestamp: new Date(),
            error: 'RSI must be between 0 and 100'
          }
        }
      }

      return {
        isValid: true,
        value: technicalData,
        confidence: 0.90,
        source: 'api',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        isValid: false,
        value: technicalData,
        confidence: 0,
        source: 'api',
        timestamp: new Date(),
        error: error.message
      }
    }
  }

  /**
   * Validate derivative metrics
   */
  async validateDerivativeMetrics(cryptoId: string, derivativeData: any): Promise<ValidationResult> {
    try {
      // Check if data is mock
      if (this.isMockData(derivativeData)) {
        return {
          isValid: false,
          value: derivativeData,
          confidence: 0,
          source: 'api',
          timestamp: new Date(),
          error: 'Mock data detected'
        }
      }

      if (!derivativeData || typeof derivativeData !== 'object') {
        return {
          isValid: false,
          value: derivativeData,
          confidence: 0,
          source: 'api',
          timestamp: new Date(),
          error: 'Invalid derivative data format'
        }
      }

      // Validate funding rate (should be between -10% and 10%)
      if (derivativeData.fundingRate !== undefined) {
        if (typeof derivativeData.fundingRate !== 'number' || 
            derivativeData.fundingRate < -0.1 || derivativeData.fundingRate > 0.1) {
          return {
            isValid: false,
            value: derivativeData,
            confidence: 0,
            source: 'api',
            timestamp: new Date(),
            error: 'Funding rate out of reasonable range'
          }
        }
      }

      return {
        isValid: true,
        value: derivativeData,
        confidence: 0.80,
        source: 'api',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        isValid: false,
        value: derivativeData,
        confidence: 0,
        source: 'api',
        timestamp: new Date(),
        error: error.message
      }
    }
  }

  /**
   * Calculate data quality score
   */
  async calculateDataQualityScore(cryptoId: string): Promise<DataQualityScore> {
    try {
      // Get recent data for the cryptocurrency
      const recentData = await Promise.all([
        db.priceHistory.findFirst({
          where: { cryptoId },
          orderBy: { timestamp: 'desc' }
        }),
        db.onChainMetric.findFirst({
          where: { cryptoId },
          orderBy: { timestamp: 'desc' }
        }),
        db.technicalIndicator.findFirst({
          where: { cryptoId },
          orderBy: { timestamp: 'desc' }
        })
      ])

      const [priceData, onChainData, technicalData] = recentData

      // Calculate completeness score
      let dataPoints = 0
      let totalPoints = 3 // price, on-chain, technical

      if (priceData) dataPoints++
      if (onChainData) dataPoints++
      if (technicalData) dataPoints++

      const completeness = dataPoints / totalPoints

      // Calculate timeliness score
      const now = new Date()
      let timeliness = 0

      if (priceData) {
        const priceAge = (now.getTime() - priceData.timestamp.getTime()) / (1000 * 60 * 60)
        timeliness += Math.max(0, 1 - priceAge / 48) // 48-hour window
      }

      if (onChainData) {
        const onChainAge = (now.getTime() - onChainData.timestamp.getTime()) / (1000 * 60 * 60)
        timeliness += Math.max(0, 1 - onChainAge / 72) // 72-hour window
      }

      if (technicalData) {
        const technicalAge = (now.getTime() - technicalData.timestamp.getTime()) / (1000 * 60 * 60)
        timeliness += Math.max(0, 1 - technicalAge / 24) // 24-hour window
      }

      timeliness = timeliness / totalPoints

      // Calculate accuracy score (based on validation results)
      let accuracy = 0.8 // Base accuracy

      // Check for data consistency
      if (priceData && onChainData) {
        const timeDiff = Math.abs(priceData.timestamp.getTime() - onChainData.timestamp.getTime())
        if (timeDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
          accuracy += 0.1
        }
      }

      // Calculate consistency score
      let consistency = 0.8 // Base consistency

      // Check if we have consistent data points over time
      const recentPriceData = await db.priceHistory.findMany({
        where: { 
          cryptoId,
          timestamp: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: { timestamp: 'asc' }
      })

      if (recentPriceData.length >= 7) { // At least daily data for a week
        consistency += 0.1
      }

      // Calculate overall score
      const overall = (completeness * 0.3 + timeliness * 0.3 + accuracy * 0.25 + consistency * 0.15)

      return {
        overall: Math.round(overall * 100) / 100,
        completeness: Math.round(completeness * 100) / 100,
        timeliness: Math.round(timeliness * 100) / 100,
        accuracy: Math.round(accuracy * 100) / 100,
        consistency: Math.round(consistency * 100) / 100
      }
    } catch (error) {
      console.error('Error calculating data quality score:', error)
      return {
        overall: 0,
        completeness: 0,
        timeliness: 0,
        accuracy: 0,
        consistency: 0
      }
    }
  }
}
