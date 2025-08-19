/**
 * DeFi Llama Risk Management System
 * Manages API risks and provides fallback mechanisms
 * 
 * Hệ thống quản lý rủi ro DeFi Llama
 * Quản lý rủi ro API và cung cấp cơ chế dự phòng
 * 
 * @author Financial Systems Expert
 * @version 1.0
 */

import { DeFiLlamaService } from './defi-llama-service'

export interface RiskMetrics {
  apiHealth: 'healthy' | 'degraded' | 'down'
  rateLimitStatus: 'normal' | 'warning' | 'critical'
  dataFreshness: 'fresh' | 'stale' | 'very_stale'
  lastSuccessfulCall: Date | null
  failureRate: number
  averageLatency: number
}

export class DeFiRiskManager {
  private static instance: DeFiRiskManager
  private defiLlamaService: DeFiLlamaService
  private riskMetrics: RiskMetrics
  private requestHistory: Array<{timestamp: Date, success: boolean, latency: number}> = []
  private cache: Map<string, {data: any, timestamp: Date}> = new Map()
  
  static getInstance(): DeFiRiskManager {
    if (!DeFiRiskManager.instance) {
      DeFiRiskManager.instance = new DeFiRiskManager()
    }
    return DeFiRiskManager.instance
  }
  
  private constructor() {
    this.defiLlamaService = DeFiLlamaService.getInstance()
    this.riskMetrics = this.initializeRiskMetrics()
    this.startHealthMonitoring()
  }

  /**
   * Safe API call with risk management
   */
  async safeAPICall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    fallbackData?: T
  ): Promise<{data: T | null, source: 'api' | 'cache' | 'fallback', risk: RiskMetrics}> {
    const startTime = Date.now()
    
    try {
      // Check if we should use cached data
      const cachedData = this.getCache(endpoint)
      if (cachedData && this.shouldUseCache(endpoint)) {
        return {
          data: cachedData,
          source: 'cache',
          risk: this.riskMetrics
        }
      }
      
      // Check rate limits
      if (!this.checkRateLimits()) {
        console.warn('⚠️ Rate limits exceeded, using fallback data')
        return {
          data: fallbackData || null,
          source: 'fallback',
          risk: this.riskMetrics
        }
      }
      
      // Make API call
      const result = await apiCall()
      const latency = Date.now() - startTime
      
      // Update request history
      this.updateRequestHistory(true, latency)
      
      // Cache successful results
      this.setCache(endpoint, result)
      
      return {
        data: result,
        source: 'api',
        risk: this.riskMetrics
      }
    } catch (error) {
      const latency = Date.now() - startTime
      
      // Update request history with failure
      this.updateRequestHistory(false, latency)
      
      console.error(`❌ API call failed for ${endpoint}:`, error)
      
      // Try cached data as fallback
      const cachedData = this.getCache(endpoint)
      if (cachedData) {
        console.log(`📦 Using cached data for ${endpoint}`)
        return {
          data: cachedData,
          source: 'cache',
          risk: this.riskMetrics
        }
      }
      
      return {
        data: fallbackData || null,
        source: 'fallback',
        risk: this.riskMetrics
      }
    }
  }

  /**
   * Get current risk metrics
   */
  getRiskMetrics(): RiskMetrics {
    return { ...this.riskMetrics }
  }

  /**
   * Check if API calls should be made
   */
  shouldMakeAPICalls(): boolean {
    return (
      this.riskMetrics.apiHealth !== 'down' &&
      this.riskMetrics.rateLimitStatus !== 'critical' &&
      this.riskMetrics.failureRate < 0.5 // Less than 50% failure rate
    )
  }

  /**
   * Get cache with TTL check
   */
  private getCache(endpoint: string): any | null {
    const cached = this.cache.get(endpoint)
    if (!cached) return null
    
    const age = Date.now() - cached.timestamp.getTime()
    const maxAge = this.getMaxCacheAge(endpoint)
    
    if (age > maxAge) {
      this.cache.delete(endpoint)
      return null
    }
    
    return cached.data
  }

  /**
   * Set cache with timestamp
   */
  private setCache(endpoint: string, data: any): void {
    this.cache.set(endpoint, {
      data,
      timestamp: new Date()
    })
    
    // Clean up old cache entries
    this.cleanupCache()
  }

  /**
   * Check if cache should be used
   */
  private shouldUseCache(endpoint: string): boolean {
    const cached = this.cache.get(endpoint)
    if (!cached) return false
    
    // Use cache if API health is degraded
    if (this.riskMetrics.apiHealth === 'degraded') return true
    
    // Use cache if rate limits are critical
    if (this.riskMetrics.rateLimitStatus === 'critical') return true
    
    // Use cache if failure rate is high
    if (this.riskMetrics.failureRate > 0.3) return true
    
    return false
  }

  /**
   * Get max cache age for endpoint
   */
  private getMaxCacheAge(endpoint: string): number {
    const cacheAges: Record<string, number> = {
      'chain_metrics': 5 * 60 * 1000,      // 5 minutes
      'protocols': 15 * 60 * 1000,        // 15 minutes
      'historical': 60 * 60 * 1000,       // 1 hour
      'default': 10 * 60 * 1000           // 10 minutes
    }
    
    return cacheAges[endpoint] || cacheAges.default
  }

  /**
   * Check rate limits
   */
  private checkRateLimits(): boolean {
    const recentRequests = this.requestHistory.filter(
      req => Date.now() - req.timestamp.getTime() < 60 * 1000 // Last minute
    )
    
    return recentRequests.length < 80 // Leave some buffer for the 100 limit
  }

  /**
   * Update request history
   */
  private updateRequestHistory(success: boolean, latency: number): void {
    this.requestHistory.push({
      timestamp: new Date(),
      success,
      latency
    })
    
    // Keep only last 1000 requests
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-1000)
    }
    
    // Update risk metrics
    this.updateRiskMetrics()
  }

  /**
   * Update risk metrics based on request history
   */
  private updateRiskMetrics(): void {
    const recentRequests = this.requestHistory.filter(
      req => Date.now() - req.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    )
    
    if (recentRequests.length === 0) return
    
    // Calculate failure rate
    const failures = recentRequests.filter(req => !req.success).length
    this.riskMetrics.failureRate = failures / recentRequests.length
    
    // Calculate average latency
    const totalLatency = recentRequests.reduce((sum, req) => sum + req.latency, 0)
    this.riskMetrics.averageLatency = totalLatency / recentRequests.length
    
    // Update rate limit status
    const requestsLastMinute = this.requestHistory.filter(
      req => Date.now() - req.timestamp.getTime() < 60 * 1000
    ).length
    
    if (requestsLastMinute > 90) {
      this.riskMetrics.rateLimitStatus = 'critical'
    } else if (requestsLastMinute > 70) {
      this.riskMetrics.rateLimitStatus = 'warning'
    } else {
      this.riskMetrics.rateLimitStatus = 'normal'
    }
    
    // Update data freshness
    const lastSuccess = this.requestHistory
      .filter(req => req.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    
    this.riskMetrics.lastSuccessfulCall = lastSuccess?.timestamp || null
    
    if (lastSuccess) {
      const age = Date.now() - lastSuccess.timestamp.getTime()
      if (age < 5 * 60 * 1000) {
        this.riskMetrics.dataFreshness = 'fresh'
      } else if (age < 30 * 60 * 1000) {
        this.riskMetrics.dataFreshness = 'stale'
      } else {
        this.riskMetrics.dataFreshness = 'very_stale'
      }
    } else {
      this.riskMetrics.dataFreshness = 'very_stale'
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Check API health every 30 seconds
    setInterval(async () => {
      try {
        const status = await this.defiLlamaService.getAPIStatus()
        
        if (status.status === 'healthy' && status.latency < 2000) {
          this.riskMetrics.apiHealth = 'healthy'
        } else if (status.status === 'healthy' && status.latency < 5000) {
          this.riskMetrics.apiHealth = 'degraded'
        } else {
          this.riskMetrics.apiHealth = 'down'
        }
      } catch (error) {
        this.riskMetrics.apiHealth = 'down'
      }
    }, 30 * 1000)
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hour
    
    for (const [endpoint, cached] of this.cache.entries()) {
      if (now - cached.timestamp.getTime() > maxAge) {
        this.cache.delete(endpoint)
      }
    }
  }

  /**
   * Initialize risk metrics
   */
  private initializeRiskMetrics(): RiskMetrics {
    return {
      apiHealth: 'healthy',
      rateLimitStatus: 'normal',
      dataFreshness: 'fresh',
      lastSuccessfulCall: null,
      failureRate: 0,
      averageLatency: 0
    }
  }
}