/**
 * Data Validation and Fallback Service
 * Ensures data authenticity and provides historical fallback mechanisms
 * 
 * This service provides:
 * - Data validation for all incoming metrics
 * - Historical data fallback when external APIs fail
 * - Data quality scoring and monitoring
 * - No mock data - only real data or historical fallback
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
   * Validate price data
   */
  async validatePriceData(cryptoId: string, priceData: any): Promise<ValidationResult> {
    try {
      // Basic validation
      if (!priceData || typeof priceData.usd !== 'number' || priceData.usd <= 0) {
        return await this.getFallbackPriceData(cryptoId)
      }

      // Validate reasonable price ranges
      const reasonableRanges: Record<string, { min: number; max: number }> = {
        bitcoin: { min: 1000, max: 200000 },
        ethereum: { min: 50, max: 10000 },
        binancecoin: { min: 10, max: 2000 },
        solana: { min: 1, max: 1000 }
      }

      const crypto = await db.cryptocurrency.findFirst({ where: { id: cryptoId } })
      if (!crypto) {
        return await this.getFallbackPriceData(cryptoId)
      }

      const range = reasonableRanges[crypto.coinGeckoId] || { min: 0.01, max: 100000 }
      
      if (priceData.usd < range.min || priceData.usd > range.max) {
        console.warn(`⚠️ Price ${priceData.usd} out of reasonable range for ${crypto.symbol}`)
        return await this.getFallbackPriceData(cryptoId)
      }

      return {
        isValid: true,
        value: priceData,
        confidence: 0.95,
        source: 'api',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('❌ Error validating price data:', error)
      return await this.getFallbackPriceData(cryptoId)
    }
  }

  /**
   * Validate on-chain metrics with historical fallback
   */
  async validateOnChainMetrics(cryptoId: string, onChainData: any): Promise<ValidationResult> {
    try {
      // Check if data contains mock patterns (random numbers)
      if (this.isMockData(onChainData)) {
        console.warn('⚠️ Detected mock on-chain data, using fallback')
        return await this.getFallbackOnChainData(cryptoId)
      }

      // Validate each metric
      const validationRules = {
        mvrv: { min: 0.1, max: 10, required: true },
        nupl: { min: -1, max: 1, required: true },
        sopr: { min: 0.5, max: 2, required: true },
        activeAddresses: { min: 1000, max: 10000000, required: true },
        exchangeInflow: { min: 0, max: 1000000, required: false },
        exchangeOutflow: { min: 0, max: 1000000, required: false },
        transactionVolume: { min: 0, max: 100000000000, required: false }
      }

      for (const [metric, rule] of Object.entries(validationRules)) {
        if (rule.required && (onChainData[metric] === undefined || onChainData[metric] === null)) {
          console.warn(`⚠️ Missing required on-chain metric: ${metric}`)
          return await this.getFallbackOnChainData(cryptoId)
        }

        if (onChainData[metric] !== undefined && onChainData[metric] !== null) {
          if (onChainData[metric] < rule.min || onChainData[metric] > rule.max) {
            console.warn(`⚠️ On-chain metric ${metric} value ${onChainData[metric]} out of range`)
            return await this.getFallbackOnChainData(cryptoId)
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
      console.error('❌ Error validating on-chain data:', error)
      return await this.getFallbackOnChainData(cryptoId)
    }
  }

  /**
   * Validate technical indicators with calculated fallback
   */
  async validateTechnicalIndicators(cryptoId: string, technicalData: any): Promise<ValidationResult> {
    try {
      // Check if data contains mock patterns
      if (this.isMockData(technicalData)) {
        console.warn('⚠️ Detected mock technical data, calculating from price history')
        return await this.getCalculatedTechnicalData(cryptoId)
      }

      // Validate technical indicators
      const validationRules = {
        rsi: { min: 0, max: 100, required: true },
        ma50: { min: 0, max: 1000000, required: true },
        ma200: { min: 0, max: 1000000, required: true },
        macd: { min: -10000, max: 10000, required: true },
        bollingerUpper: { min: 0, max: 1000000, required: true },
        bollingerLower: { min: 0, max: 1000000, required: true },
        bollingerMiddle: { min: 0, max: 1000000, required: true }
      }

      for (const [metric, rule] of Object.entries(validationRules)) {
        if (rule.required && (technicalData[metric] === undefined || technicalData[metric] === null)) {
          console.warn(`⚠️ Missing required technical metric: ${metric}`)
          return await this.getCalculatedTechnicalData(cryptoId)
        }

        if (technicalData[metric] !== undefined && technicalData[metric] !== null) {
          if (technicalData[metric] < rule.min || technicalData[metric] > rule.max) {
            console.warn(`⚠️ Technical metric ${metric} value ${technicalData[metric]} out of range`)
            return await this.getCalculatedTechnicalData(cryptoId)
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
      console.error('❌ Error validating technical data:', error)
      return await this.getCalculatedTechnicalData(cryptoId)
    }
  }

  /**
   * Validate derivative metrics with historical fallback
   */
  async validateDerivativeMetrics(cryptoId: string, derivativeData: any): Promise<ValidationResult> {
    try {
      // Check if data contains mock patterns
      if (this.isMockData(derivativeData)) {
        console.warn('⚠️ Detected mock derivative data, using fallback')
        return await this.getFallbackDerivativeData(cryptoId)
      }

      // Validate derivative metrics
      const validationRules = {
        openInterest: { min: 0, max: 100000000000, required: true },
        fundingRate: { min: -0.1, max: 0.1, required: true },
        liquidationVolume: { min: 0, max: 1000000000, required: true },
        putCallRatio: { min: 0, max: 10, required: true }
      }

      for (const [metric, rule] of Object.entries(validationRules)) {
        if (rule.required && (derivativeData[metric] === undefined || derivativeData[metric] === null)) {
          console.warn(`⚠️ Missing required derivative metric: ${metric}`)
          return await this.getFallbackDerivativeData(cryptoId)
        }

        if (derivativeData[metric] !== undefined && derivativeData[metric] !== null) {
          if (derivativeData[metric] < rule.min || derivativeData[metric] > rule.max) {
            console.warn(`⚠️ Derivative metric ${metric} value ${derivativeData[metric]} out of range`)
            return await this.getFallbackDerivativeData(cryptoId)
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
      console.error('❌ Error validating derivative data:', error)
      return await this.getFallbackDerivativeData(cryptoId)
    }
  }

  /**
   * Fallback: Get latest price data from database
   */
  private async getFallbackPriceData(cryptoId: string): Promise<ValidationResult> {
    try {
      const latestPrice = await db.priceHistory.findFirst({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' }
      })

      if (latestPrice) {
        const hoursSinceUpdate = (Date.now() - latestPrice.timestamp.getTime()) / (1000 * 60 * 60)
        const confidence = Math.max(0.3, 1 - (hoursSinceUpdate / 24)) // Decrease confidence over time

        return {
          isValid: true,
          value: {
            usd: latestPrice.price,
            usd_24h_change: latestPrice.priceChange24h,
            usd_24h_vol: latestPrice.volume24h,
            usd_market_cap: latestPrice.marketCap
          },
          confidence,
          source: 'fallback',
          timestamp: latestPrice.timestamp
        }
      }
    } catch (error) {
      console.error('❌ Error getting fallback price data:', error)
    }

    // Ultimate fallback - return null with low confidence
    return {
      isValid: false,
      value: null,
      confidence: 0,
      source: 'fallback',
      timestamp: new Date(),
      error: 'No price data available'
    }
  }

  /**
   * Fallback: Get latest on-chain data from database
   */
  private async getFallbackOnChainData(cryptoId: string): Promise<ValidationResult> {
    try {
      const latestOnChain = await db.onChainMetric.findFirst({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' }
      })

      if (latestOnChain) {
        const hoursSinceUpdate = (Date.now() - latestOnChain.timestamp.getTime()) / (1000 * 60 * 60)
        const confidence = Math.max(0.2, 0.8 - (hoursSinceUpdate / 48)) // Decrease faster for on-chain data

        return {
          isValid: true,
          value: {
            mvrv: latestOnChain.mvrv,
            nupl: latestOnChain.nupl,
            sopr: latestOnChain.sopr,
            activeAddresses: latestOnChain.activeAddresses,
            exchangeInflow: latestOnChain.exchangeInflow,
            exchangeOutflow: latestOnChain.exchangeOutflow,
            transactionVolume: latestOnChain.transactionVolume
          },
          confidence,
          source: 'fallback',
          timestamp: latestOnChain.timestamp
        }
      }
    } catch (error) {
      console.error('❌ Error getting fallback on-chain data:', error)
    }

    return {
      isValid: false,
      value: null,
      confidence: 0,
      source: 'fallback',
      timestamp: new Date(),
      error: 'No on-chain data available'
    }
  }

  /**
   * Fallback: Calculate technical indicators from price history
   */
  private async getCalculatedTechnicalData(cryptoId: string): Promise<ValidationResult> {
    try {
      const recentPrices = await db.priceHistory.findMany({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' },
        take: 200
      })

      if (recentPrices.length >= 50) {
        const prices = recentPrices.map(p => p.price).reverse()
        const currentPrice = recentPrices[0].price

        const calculated = {
          rsi: this.calculateRSI(prices),
          ma50: this.calculateMA(prices, 50),
          ma200: this.calculateMA(prices, 200),
          macd: this.calculateMACD(prices),
          bollingerUpper: this.calculateBollingerUpper(prices, 20, 2),
          bollingerLower: this.calculateBollingerLower(prices, 20, 2),
          bollingerMiddle: this.calculateMA(prices, 20)
        }

        return {
          isValid: true,
          value: calculated,
          confidence: 0.75,
          source: 'calculated',
          timestamp: new Date()
        }
      }
    } catch (error) {
      console.error('❌ Error calculating technical data:', error)
    }

    return {
      isValid: false,
      value: null,
      confidence: 0,
      source: 'calculated',
      timestamp: new Date(),
      error: 'Insufficient price history for calculation'
    }
  }

  /**
   * Fallback: Get latest derivative data from database
   */
  private async getFallbackDerivativeData(cryptoId: string): Promise<ValidationResult> {
    try {
      const latestDerivative = await db.derivativeMetric.findFirst({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' }
      })

      if (latestDerivative) {
        const hoursSinceUpdate = (Date.now() - latestDerivative.timestamp.getTime()) / (1000 * 60 * 60)
        const confidence = Math.max(0.2, 0.7 - (hoursSinceUpdate / 36)) // Derivative data decays faster

        return {
          isValid: true,
          value: {
            openInterest: latestDerivative.openInterest,
            fundingRate: latestDerivative.fundingRate,
            liquidationVolume: latestDerivative.liquidationVolume,
            putCallRatio: latestDerivative.putCallRatio
          },
          confidence,
          source: 'fallback',
          timestamp: latestDerivative.timestamp
        }
      }
    } catch (error) {
      console.error('❌ Error getting fallback derivative data:', error)
    }

    return {
      isValid: false,
      value: null,
      confidence: 0,
      source: 'fallback',
      timestamp: new Date(),
      error: 'No derivative data available'
    }
  }

  /**
   * Detect if data contains mock patterns (random numbers)
   */
  private isMockData(data: any): boolean {
    if (!data || typeof data !== 'object') return false

    // Check for common mock patterns
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number') {
        // Check if value looks like a random number in typical mock ranges
        if (key === 'rsi' && value >= 50 && value <= 80) {
          // Common mock pattern: 50 + Math.random() * 30
          return true
        }
        if (key === 'mvrv' && value >= 1.6 && value <= 2.0) {
          // Common mock pattern: 1.8 + (Math.random() - 0.5) * 0.4
          return true
        }
        if (key === 'nupl' && value >= 0.55 && value <= 0.75) {
          // Common mock pattern: 0.65 + (Math.random() - 0.5) * 0.2
          return true
        }
        if (key === 'sopr' && value >= 0.97 && value <= 1.07) {
          // Common mock pattern: 1.02 + (Math.random() - 0.5) * 0.1
          return true
        }
        if (key === 'macd' && value >= -500 && value <= 500) {
          // Common mock pattern: (Math.random() - 0.5) * 1000
          return true
        }
      }
    }

    return false
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(prices: number[]): number {
    if (prices.length < 14) return 50

    const gains: number[] = []
    const losses: number[] = []

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      gains.push(change > 0 ? change : 0)
      losses.push(change < 0 ? Math.abs(change) : 0)
    }

    const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14
    const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14

    if (avgLoss === 0) return 100

    const rs = avgGain / avgLoss
    const rsi = 100 - (100 / (1 + rs))

    return Math.max(0, Math.min(100, rsi))
  }

  /**
   * Calculate Moving Average
   */
  private calculateMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0

    const sum = prices.slice(-period).reduce((a, b) => a + b, 0)
    return sum / period
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(prices: number[]): number {
    if (prices.length < 26) return 0

    const ema12 = this.calculateEMA(prices, 12)
    const ema26 = this.calculateEMA(prices, 26)

    return ema12 - ema26
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0

    const multiplier = 2 / (period + 1)
    let ema = prices[0]

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema
    }

    return ema
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerUpper(prices: number[], period: number, stdDev: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0

    const ma = this.calculateMA(prices, period)
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - ma, 2), 0) / period
    const standardDeviation = Math.sqrt(variance)

    return ma + (standardDeviation * stdDev)
  }

  private calculateBollingerLower(prices: number[], period: number, stdDev: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0

    const ma = this.calculateMA(prices, period)
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - ma, 2), 0) / period
    const standardDeviation = Math.sqrt(variance)

    return ma - (standardDeviation * stdDev)
  }

  /**
   * Calculate data quality score
   */
  async calculateDataQualityScore(cryptoId: string): Promise<DataQualityScore> {
    try {
      const [latestPrice, latestOnChain, latestTechnical, latestDerivative, latestSentiment] = await Promise.all([
        db.priceHistory.findFirst({ where: { cryptoId }, orderBy: { timestamp: 'desc' } }),
        db.onChainMetric.findFirst({ where: { cryptoId }, orderBy: { timestamp: 'desc' } }),
        db.technicalIndicator.findFirst({ where: { cryptoId }, orderBy: { timestamp: 'desc' } }),
        db.derivativeMetric.findFirst({ where: { cryptoId }, orderBy: { timestamp: 'desc' } }),
        db.sentimentMetric.findFirst({ orderBy: { timestamp: 'desc' } })
      ])

      const now = Date.now()
      const oneHourAgo = now - (1000 * 60 * 60)
      const sixHoursAgo = now - (1000 * 60 * 60 * 6)
      const twentyFourHoursAgo = now - (1000 * 60 * 60 * 24)

      // Completeness: Check if all data types are present
      const completeness = [
        latestPrice,
        latestOnChain,
        latestTechnical,
        latestDerivative,
        latestSentiment
      ].filter(Boolean).length / 5

      // Timeliness: Check how recent the data is
      const timeliness = [
        latestPrice?.timestamp.getTime() > oneHourAgo,
        latestOnChain?.timestamp.getTime() > sixHoursAgo,
        latestTechnical?.timestamp.getTime() > oneHourAgo,
        latestDerivative?.timestamp.getTime() > sixHoursAgo,
        latestSentiment?.timestamp.getTime() > twentyFourHoursAgo
      ].filter(Boolean).length / 5

      // Accuracy: Check if values are within reasonable ranges
      const accuracy = this.checkDataAccuracy(latestPrice, latestOnChain, latestTechnical, latestDerivative)

      // Consistency: Check if data points are consistent with each other
      const consistency = this.checkDataConsistency(latestPrice, latestOnChain, latestTechnical)

      const overall = (completeness * 0.3) + (timeliness * 0.3) + (accuracy * 0.25) + (consistency * 0.15)

      return {
        overall: Math.round(overall * 100) / 100,
        completeness: Math.round(completeness * 100) / 100,
        timeliness: Math.round(timeliness * 100) / 100,
        accuracy: Math.round(accuracy * 100) / 100,
        consistency: Math.round(consistency * 100) / 100
      }
    } catch (error) {
      console.error('❌ Error calculating data quality score:', error)
      return {
        overall: 0,
        completeness: 0,
        timeliness: 0,
        accuracy: 0,
        consistency: 0
      }
    }
  }

  /**
   * Check data accuracy
   */
  private checkDataAccuracy(price: any, onChain: any, technical: any, derivative: any): number {
    let accuracyScore = 0
    let checks = 0

    if (price && price.price > 0) {
      accuracyScore += 1
      checks++
    }

    if (onChain && onChain.mvrv > 0 && onChain.mvrv < 10) {
      accuracyScore += 1
      checks++
    }

    if (technical && technical.rsi >= 0 && technical.rsi <= 100) {
      accuracyScore += 1
      checks++
    }

    if (derivative && derivative.fundingRate >= -0.1 && derivative.fundingRate <= 0.1) {
      accuracyScore += 1
      checks++
    }

    return checks > 0 ? accuracyScore / checks : 0
  }

  /**
   * Check data consistency
   */
  private checkDataConsistency(price: any, onChain: any, technical: any): number {
    let consistencyScore = 0
    let checks = 0

    // Check if price and moving averages are consistent
    if (price && technical && technical.ma50 && technical.ma200) {
      if (Math.abs(price.price - technical.ma50) < price.price * 0.5) {
        consistencyScore += 1
      }
      if (Math.abs(price.price - technical.ma200) < price.price * 0.8) {
        consistencyScore += 1
      }
      checks += 2
    }

    // Check if RSI and MVRV are consistent
    if (technical && onChain && technical.rsi && onChain.mvrv) {
      const rsiLevel = technical.rsi > 70 ? 'high' : technical.rsi < 30 ? 'low' : 'normal'
      const mvrvLevel = onChain.mvrv > 2.5 ? 'high' : onChain.mvrv < 1 ? 'low' : 'normal'
      
      if (rsiLevel === mvrvLevel || (rsiLevel === 'normal' && mvrvLevel === 'normal')) {
        consistencyScore += 1
      }
      checks++
    }

    return checks > 0 ? consistencyScore / checks : 0
  }
}