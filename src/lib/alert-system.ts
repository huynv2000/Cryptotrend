/**
 * Real-time Alert System for Crypto Market Analytics
 * Implements alert conditions based on the report specifications
 * 
 * Alert conditions from the report:
 * - Exchange inflow increases sharply
 * - Funding rate > +0.1%/8h or < -0.05%/8h
 * - Fear & Greed < 10 or > 90
 * - Open Interest reaches historical highs
 */

export interface Alert {
  id: string
  type: 'WARNING' | 'CRITICAL' | 'INFO'
  category: 'EXCHANGE_FLOW' | 'FUNDING_RATE' | 'SENTIMENT' | 'DERIVATIVES' | 'VOLATILITY' | 'VOLUME'
  title: string
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timestamp: Date
  coinId: string
  data: any
  triggeredBy: string[]
  actionRequired: boolean
  recommendedAction?: string
  expiresAt?: Date
}

export interface AlertThresholds {
  // Exchange flow alerts
  exchangeInflowThreshold: number // BTC amount for significant inflow
  exchangeInflowPercentageThreshold: number // percentage increase threshold
  
  // Funding rate alerts
  fundingRateHighThreshold: number // +0.1% per 8h
  fundingRateLowThreshold: number // -0.05% per 8h
  
  // Sentiment alerts
  fearGreedExtremeLow: number // 10
  fearGreedExtremeHigh: number // 90
  
  // Derivatives alerts
  openInterestHistoricalHigh: number // percentage of historical high
  liquidationThreshold: number // USD amount for large liquidations
  
  // Volume alerts
  volumeSpikeThreshold: number // percentage increase for volume spike
  volumeDropThreshold: number // percentage decrease for volume drop
  
  // Volatility alerts
  volatilityThreshold: number // percentage for high volatility
}

export interface AlertConfig {
  enabled: boolean
  thresholds: AlertThresholds
  notifications: {
    email: boolean
    push: boolean
    webhook: boolean
    webhookUrl?: string
  }
  cooldownPeriod: number // minutes between similar alerts
}

export class AlertSystem {
  private static instance: AlertSystem
  private alerts: Alert[] = []
  private config: AlertConfig
  private historicalData: Map<string, any> = new Map()
  private lastAlertTimes: Map<string, Date> = new Map()

  constructor() {
    this.config = {
      enabled: true,
      thresholds: {
        exchangeInflowThreshold: 50000, // 50K BTC
        exchangeInflowPercentageThreshold: 200, // 200% increase
        fundingRateHighThreshold: 0.001, // +0.1% per 8h
        fundingRateLowThreshold: -0.0005, // -0.05% per 8h
        fearGreedExtremeLow: 10,
        fearGreedExtremeHigh: 90,
        openInterestHistoricalHigh: 0.95, // 95% of historical high
        liquidationThreshold: 100000000, // $100M
        volumeSpikeThreshold: 300, // 300% increase
        volumeDropThreshold: 70, // 70% decrease
        volatilityThreshold: 15 // 15% volatility
      },
      notifications: {
        email: false,
        push: true,
        webhook: false
      },
      cooldownPeriod: 30 // 30 minutes
    }
  }

  static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem()
    }
    return AlertSystem.instance
  }

  /**
   * Process market data and generate alerts
   */
  async processMarketData(coinId: string, marketData: {
    exchangeInflow?: number
    exchangeOutflow?: number
    fundingRate?: number
    fearGreedIndex?: number
    openInterest?: number
    liquidationVolume?: number
    transactionVolume?: number
    price?: number
    priceChange24h?: number
    previousData?: any
  }): Promise<Alert[]> {
    if (!this.config.enabled) return []

    const newAlerts: Alert[] = []
    const now = new Date()

    // Check each alert condition
    const alerts = await Promise.all([
      this.checkExchangeFlowAlerts(coinId, marketData, now),
      this.checkFundingRateAlerts(coinId, marketData, now),
      this.checkSentimentAlerts(coinId, marketData, now),
      this.checkDerivativesAlerts(coinId, marketData, now),
      this.checkVolumeAlerts(coinId, marketData, now),
      this.checkVolatilityAlerts(coinId, marketData, now)
    ])

    alerts.flat().forEach(alert => {
      if (alert && this.shouldSendAlert(alert)) {
        newAlerts.push(alert)
        this.alerts.push(alert)
        this.lastAlertTimes.set(this.getAlertKey(alert), now)
      }
    })

    // Clean up old alerts
    this.cleanupOldAlerts()

    return newAlerts
  }

  /**
   * Check exchange flow alerts
   */
  private async checkExchangeFlowAlerts(coinId: string, data: any, timestamp: Date): Promise<Alert | null> {
    const { exchangeInflow, previousData } = data
    
    if (!exchangeInflow || !previousData?.exchangeInflow) return null

    const percentageIncrease = (exchangeInflow / previousData.exchangeInflow - 1) * 100
    
    // Check for large absolute inflow
    if (exchangeInflow > this.config.thresholds.exchangeInflowThreshold) {
      return this.createAlert({
        type: 'CRITICAL',
        category: 'EXCHANGE_FLOW',
        title: 'Large Exchange Inflow Detected',
        message: `Exchange inflow of ${exchangeInflow.toLocaleString()} ${coinId.toUpperCase()} detected, indicating potential selling pressure.`,
        severity: 'HIGH',
        coinId,
        data: { exchangeInflow, threshold: this.config.thresholds.exchangeInflowThreshold },
        triggeredBy: ['Large exchange inflow'],
        actionRequired: true,
        recommendedAction: 'Monitor for potential price decline, consider reducing exposure',
        timestamp
      })
    }

    // Check for percentage spike
    if (percentageIncrease > this.config.thresholds.exchangeInflowPercentageThreshold) {
      return this.createAlert({
        type: 'WARNING',
        category: 'EXCHANGE_FLOW',
        title: 'Exchange Inflow Spike',
        message: `Exchange inflow increased by ${percentageIncrease.toFixed(1)}% compared to previous period.`,
        severity: 'MEDIUM',
        coinId,
        data: { exchangeInflow, percentageIncrease, threshold: this.config.thresholds.exchangeInflowPercentageThreshold },
        triggeredBy: ['Exchange inflow spike'],
        actionRequired: true,
        recommendedAction: 'Watch for increased selling pressure',
        timestamp
      })
    }

    return null
  }

  /**
   * Check funding rate alerts
   */
  private async checkFundingRateAlerts(coinId: string, data: any, timestamp: Date): Promise<Alert | null> {
    const { fundingRate } = data
    
    if (fundingRate === undefined) return null

    // Check for high positive funding rate
    if (fundingRate > this.config.thresholds.fundingRateHighThreshold) {
      return this.createAlert({
        type: 'WARNING',
        category: 'FUNDING_RATE',
        title: 'High Funding Rate Detected',
        message: `Funding rate at ${(fundingRate * 100).toFixed(3)}% indicates strong long pressure and potential squeeze risk.`,
        severity: 'MEDIUM',
        coinId,
        data: { fundingRate, threshold: this.config.thresholds.fundingRateHighThreshold },
        triggeredBy: ['High funding rate'],
        actionRequired: true,
        recommendedAction: 'Monitor for potential long squeeze or price correction',
        timestamp
      })
    }

    // Check for low negative funding rate
    if (fundingRate < this.config.thresholds.fundingRateLowThreshold) {
      return this.createAlert({
        type: 'WARNING',
        category: 'FUNDING_RATE',
        title: 'Low Funding Rate Detected',
        message: `Funding rate at ${(fundingRate * 100).toFixed(3)}% indicates strong short pressure and potential bounce opportunity.`,
        severity: 'MEDIUM',
        coinId,
        data: { fundingRate, threshold: this.config.thresholds.fundingRateLowThreshold },
        triggeredBy: ['Low funding rate'],
        actionRequired: true,
        recommendedAction: 'Watch for potential short squeeze or price rebound',
        timestamp
      })
    }

    return null
  }

  /**
   * Check sentiment alerts
   */
  private async checkSentimentAlerts(coinId: string, data: any, timestamp: Date): Promise<Alert | null> {
    const { fearGreedIndex } = data
    
    if (fearGreedIndex === undefined) return null

    // Check for extreme fear
    if (fearGreedIndex <= this.config.thresholds.fearGreedExtremeLow) {
      return this.createAlert({
        type: 'INFO',
        category: 'SENTIMENT',
        title: 'Extreme Fear Detected',
        message: `Fear & Greed Index at ${fearGreedIndex} indicates extreme market fear - potential buying opportunity.`,
        severity: 'LOW',
        coinId,
        data: { fearGreedIndex, threshold: this.config.thresholds.fearGreedExtremeLow },
        triggeredBy: ['Extreme fear'],
        actionRequired: false,
        recommendedAction: 'Consider accumulation opportunities',
        timestamp
      })
    }

    // Check for extreme greed
    if (fearGreedIndex >= this.config.thresholds.fearGreedExtremeHigh) {
      return this.createAlert({
        type: 'WARNING',
        category: 'SENTIMENT',
        title: 'Extreme Greed Detected',
        message: `Fear & Greed Index at ${fearGreedIndex} indicates extreme market greed - potential selling opportunity.`,
        severity: 'MEDIUM',
        coinId,
        data: { fearGreedIndex, threshold: this.config.thresholds.fearGreedExtremeHigh },
        triggeredBy: ['Extreme greed'],
        actionRequired: true,
        recommendedAction: 'Consider taking profits or reducing exposure',
        timestamp
      })
    }

    return null
  }

  /**
   * Check derivatives alerts
   */
  private async checkDerivativesAlerts(coinId: string, data: any, timestamp: Date): Promise<Alert | null> {
    const { openInterest, liquidationVolume } = data
    
    const alerts: Alert[] = []

    // Check for high open interest
    if (openInterest) {
      const historicalHigh = this.getHistoricalHigh(coinId, 'openInterest')
      if (historicalHigh && openInterest > historicalHigh * this.config.thresholds.openInterestHistoricalHigh) {
        alerts.push(this.createAlert({
          type: 'WARNING',
          category: 'DERIVATIVES',
          title: 'High Open Interest Detected',
          message: `Open interest at $${(openInterest / 1000000000).toFixed(1)}B is near historical highs - increased volatility risk.`,
          severity: 'MEDIUM',
          coinId,
          data: { openInterest, historicalHigh, percentage: (openInterest / historicalHigh * 100).toFixed(1) },
          triggeredBy: ['High open interest'],
          actionRequired: true,
          recommendedAction: 'Prepare for increased volatility and potential liquidations',
          timestamp
        }))
      }
    }

    // Check for large liquidations
    if (liquidationVolume && liquidationVolume > this.config.thresholds.liquidationThreshold) {
      alerts.push(this.createAlert({
        type: 'CRITICAL',
        category: 'DERIVATIVES',
        title: 'Large Liquidations Detected',
        message: `Liquidations totaling $${(liquidationVolume / 1000000).toFixed(1)}M detected - market stress indicator.`,
        severity: 'HIGH',
        coinId,
        data: { liquidationVolume, threshold: this.config.thresholds.liquidationThreshold },
        triggeredBy: ['Large liquidations'],
        actionRequired: true,
        recommendedAction: 'Monitor for cascade effects and trend reversals',
        timestamp
      }))
    }

    return alerts.length > 0 ? alerts[0] : null
  }

  /**
   * Check volume alerts
   */
  private async checkVolumeAlerts(coinId: string, data: any, timestamp: Date): Promise<Alert | null> {
    const { transactionVolume, previousData } = data
    
    if (!transactionVolume || !previousData?.transactionVolume) return null

    const percentageChange = (transactionVolume / previousData.transactionVolume - 1) * 100

    // Check for volume spike
    if (percentageChange > this.config.thresholds.volumeSpikeThreshold) {
      return this.createAlert({
        type: 'INFO',
        category: 'VOLUME',
        title: 'Volume Spike Detected',
        message: `Volume increased by ${percentageChange.toFixed(1)}% - indicating strong market interest.`,
        severity: 'LOW',
        coinId,
        data: { transactionVolume, percentageChange, threshold: this.config.thresholds.volumeSpikeThreshold },
        triggeredBy: ['Volume spike'],
        actionRequired: false,
        recommendedAction: 'Monitor for trend continuation or reversal',
        timestamp
      })
    }

    // Check for volume drop
    if (percentageChange < -this.config.thresholds.volumeDropThreshold) {
      return this.createAlert({
        type: 'WARNING',
        category: 'VOLUME',
        title: 'Volume Drop Detected',
        message: `Volume decreased by ${Math.abs(percentageChange).toFixed(1)}% - indicating waning interest.`,
        severity: 'MEDIUM',
        coinId,
        data: { transactionVolume, percentageChange, threshold: this.config.thresholds.volumeDropThreshold },
        triggeredBy: ['Volume drop'],
        actionRequired: true,
        recommendedAction: 'Watch for potential trend exhaustion',
        timestamp
      })
    }

    return null
  }

  /**
   * Check volatility alerts
   */
  private async checkVolatilityAlerts(coinId: string, data: any, timestamp: Date): Promise<Alert | null> {
    const { priceChange24h } = data
    
    if (priceChange24h === undefined) return null

    const volatility = Math.abs(priceChange24h)

    // Check for high volatility
    if (volatility > this.config.thresholds.volatilityThreshold) {
      return this.createAlert({
        type: 'WARNING',
        category: 'VOLATILITY',
        title: 'High Volatility Detected',
        message: `24h price change of ${priceChange24h.toFixed(2)}% indicates high market volatility.`,
        severity: 'MEDIUM',
        coinId,
        data: { priceChange24h, volatility, threshold: this.config.thresholds.volatilityThreshold },
        triggeredBy: ['High volatility'],
        actionRequired: true,
        recommendedAction: 'Exercise caution, use wider stop losses',
        timestamp
      })
    }

    return null
  }

  /**
   * Create alert object
   */
  private createAlert(alertData: Partial<Alert>): Alert {
    return {
      id: this.generateAlertId(),
      type: alertData.type || 'INFO',
      category: alertData.category || 'VOLATILITY',
      title: alertData.title || 'Market Alert',
      message: alertData.message || 'Market condition detected',
      severity: alertData.severity || 'LOW',
      timestamp: alertData.timestamp || new Date(),
      coinId: alertData.coinId || 'bitcoin',
      data: alertData.data || {},
      triggeredBy: alertData.triggeredBy || [],
      actionRequired: alertData.actionRequired || false,
      recommendedAction: alertData.recommendedAction,
      expiresAt: alertData.expiresAt
    }
  }

  /**
   * Check if alert should be sent (cooldown period)
   */
  private shouldSendAlert(alert: Alert): boolean {
    const key = this.getAlertKey(alert)
    const lastAlertTime = this.lastAlertTimes.get(key)
    
    if (!lastAlertTime) return true
    
    const cooldownPeriod = this.config.cooldownPeriod * 60 * 1000 // convert to milliseconds
    const timeSinceLastAlert = Date.now() - lastAlertTime.getTime()
    
    return timeSinceLastAlert > cooldownPeriod
  }

  /**
   * Generate alert key for cooldown tracking
   */
  private getAlertKey(alert: Alert): string {
    return `${alert.coinId}-${alert.category}-${alert.type}`
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get historical high for a metric
   */
  private getHistoricalHigh(coinId: string, metric: string): number | null {
    const key = `${coinId}_${metric}`
    return this.historicalData.get(key)?.high || null
  }

  /**
   * Update historical data
   */
  updateHistoricalData(coinId: string, metric: string, value: number): void {
    const key = `${coinId}_${metric}`
    const current = this.historicalData.get(key) || { high: value, low: value }
    
    this.historicalData.set(key, {
      high: Math.max(current.high, value),
      low: Math.min(current.low, value)
    })
  }

  /**
   * Clean up old alerts
   */
  private cleanupOldAlerts(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneWeekAgo)
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 50): Alert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get alerts for a specific coin
   */
  getAlertsForCoin(coinId: string, limit: number = 20): Alert[] {
    return this.alerts
      .filter(alert => alert.coinId === coinId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config }
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = []
    this.lastAlertTimes.clear()
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): any {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const alerts24h = this.alerts.filter(alert => alert.timestamp > last24h)
    const alerts7d = this.alerts.filter(alert => alert.timestamp > last7d)

    return {
      totalAlerts: this.alerts.length,
      last24h: alerts24h.length,
      last7d: alerts7d.length,
      byType: {
        WARNING: this.alerts.filter(a => a.type === 'WARNING').length,
        CRITICAL: this.alerts.filter(a => a.type === 'CRITICAL').length,
        INFO: this.alerts.filter(a => a.type === 'INFO').length
      },
      byCategory: {
        EXCHANGE_FLOW: this.alerts.filter(a => a.category === 'EXCHANGE_FLOW').length,
        FUNDING_RATE: this.alerts.filter(a => a.category === 'FUNDING_RATE').length,
        SENTIMENT: this.alerts.filter(a => a.category === 'SENTIMENT').length,
        DERIVATIVES: this.alerts.filter(a => a.category === 'DERIVATIVES').length,
        VOLUME: this.alerts.filter(a => a.category === 'VOLUME').length,
        VOLATILITY: this.alerts.filter(a => a.category === 'VOLATILITY').length
      }
    }
  }
}