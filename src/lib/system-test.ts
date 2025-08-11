/**
 * System Health and Performance Tests
 * Comprehensive testing suite for the crypto analytics dashboard
 */

import { CryptoDataService } from './crypto-service'
import { DataCollector } from './data-collector'
import { rateLimiter } from './rate-limiter'
import { db } from './db'

export interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  duration: number
  message: string
  details?: any
}

export interface SystemHealthReport {
  timestamp: string
  overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
  tests: TestResult[]
  recommendations: string[]
}

export class SystemTester {
  private results: TestResult[] = []
  
  async runComprehensiveTests(): Promise<SystemHealthReport> {
    console.log('🧪 Starting comprehensive system tests...')
    const startTime = Date.now()
    
    // Database connectivity test
    await this.testDatabaseConnectivity()
    
    // API rate limiter test
    await this.testRateLimiter()
    
    // Crypto data service test
    await this.testCryptoDataService()
    
    // Data collector test
    await this.testDataCollector()
    
    // AI analysis test
    await this.testAIAnalysis()
    
    // Performance test
    await this.testPerformance()
    
    const duration = Date.now() - startTime
    console.log(`✅ Comprehensive tests completed in ${duration}ms`)
    
    return this.generateReport()
  }
  
  private async testDatabaseConnectivity(): Promise<void> {
    const start = Date.now()
    try {
      await db.$queryRaw`SELECT 1 as test`
      this.addResult({
        name: 'Database Connectivity',
        status: 'PASS',
        duration: Date.now() - start,
        message: 'Successfully connected to database'
      })
    } catch (error) {
      this.addResult({
        name: 'Database Connectivity',
        status: 'FAIL',
        duration: Date.now() - start,
        message: 'Failed to connect to database',
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }
  
  private async testRateLimiter(): Promise<void> {
    const start = Date.now()
    try {
      const stats = rateLimiter.getStatistics()
      const queueStatus = rateLimiter.getQueueStatus()
      
      // Test rate limiting functionality
      const testTask = async () => 'test result'
      const result1 = await rateLimiter.scheduleRequest('test', testTask, 1)
      const result2 = await rateLimiter.scheduleRequest('test', testTask, 1)
      
      if (result1 === 'test result' && result2 === 'test result') {
        this.addResult({
          name: 'Rate Limiter',
          status: 'PASS',
          duration: Date.now() - start,
          message: 'Rate limiter functioning correctly',
          details: { stats, queueStatus }
        })
      } else {
        throw new Error('Rate limiter returned unexpected results')
      }
    } catch (error) {
      this.addResult({
        name: 'Rate Limiter',
        status: 'FAIL',
        duration: Date.now() - start,
        message: 'Rate limiter test failed',
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }
  
  private async testCryptoDataService(): Promise<void> {
    const start = Date.now()
    try {
      const service = CryptoDataService.getInstance()
      
      // Test with a common cryptocurrency
      const data = await service.getCompleteCryptoData('bitcoin')
      
      if (data && data.price && data.onChain && data.technical) {
        this.addResult({
          name: 'Crypto Data Service',
          status: 'PASS',
          duration: Date.now() - start,
          message: 'Successfully retrieved crypto data',
          details: {
            hasPrice: !!data.price,
            hasOnChain: !!data.onChain,
            hasTechnical: !!data.technical,
            hasSentiment: !!data.sentiment,
            hasDerivatives: !!data.derivatives
          }
        })
      } else {
        throw new Error('Incomplete crypto data received')
      }
    } catch (error) {
      this.addResult({
        name: 'Crypto Data Service',
        status: 'WARNING',
        duration: Date.now() - start,
        message: 'Crypto data service experiencing issues (possibly API rate limits)',
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }
  
  private async testDataCollector(): Promise<void> {
    const start = Date.now()
    try {
      const collector = DataCollector.getInstance()
      const stats = collector.getStats()
      
      // Test data collection configuration
      const config = collector.getConfig()
      
      if (config && stats) {
        this.addResult({
          name: 'Data Collector',
          status: 'PASS',
          duration: Date.now() - start,
          message: 'Data collector configured properly',
          details: { config, stats }
        })
      } else {
        throw new Error('Data collector configuration incomplete')
      }
    } catch (error) {
      this.addResult({
        name: 'Data Collector',
        status: 'FAIL',
        duration: Date.now() - start,
        message: 'Data collector test failed',
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }
  
  private async testAIAnalysis(): Promise<void> {
    const start = Date.now()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisType: 'coin_specific'
        })
      })
      
      if (response.ok) {
        const analysis = await response.json()
        
        if (analysis.signal && analysis.confidence && analysis.reasoning) {
          this.addResult({
            name: 'AI Analysis',
            status: 'PASS',
            duration: Date.now() - start,
            message: 'AI analysis service functioning correctly',
            details: {
              signal: analysis.signal,
              confidence: analysis.confidence,
              riskLevel: analysis.riskLevel,
              hasKeyInsights: Array.isArray(analysis.keyInsights)
            }
          })
        } else {
          throw new Error('AI analysis response incomplete')
        }
      } else {
        throw new Error(`AI analysis API returned status ${response.status}`)
      }
    } catch (error) {
      this.addResult({
        name: 'AI Analysis',
        status: 'WARNING',
        duration: Date.now() - start,
        message: 'AI analysis service experiencing issues',
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }
  
  private async testPerformance(): Promise<void> {
    const start = Date.now()
    try {
      // Test multiple concurrent requests
      const promises: Promise<Response>[] = []
      const requestCount = 5
      
      for (let i = 0; i < requestCount; i++) {
        promises.push(
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/crypto?coinId=btc&action=basic`)
        )
      }
      
      const results = await Promise.allSettled(promises)
      const successfulRequests = results.filter(r => r.status === 'fulfilled').length
      
      const duration = Date.now() - start
      const avgResponseTime = duration / requestCount
      
      if (successfulRequests === requestCount && avgResponseTime < 5000) {
        this.addResult({
          name: 'Performance',
          status: 'PASS',
          duration: duration,
          message: `Performance acceptable (${avgResponseTime.toFixed(0)}ms avg response time)`,
          details: {
            requestCount,
            successfulRequests,
            avgResponseTime: avgResponseTime.toFixed(0)
          }
        })
      } else {
        this.addResult({
          name: 'Performance',
          status: 'WARNING',
          duration: duration,
          message: `Performance suboptimal (${avgResponseTime.toFixed(0)}ms avg response time)`,
          details: {
            requestCount,
            successfulRequests,
            avgResponseTime: avgResponseTime.toFixed(0)
          }
        })
      }
    } catch (error) {
      this.addResult({
        name: 'Performance',
        status: 'FAIL',
        duration: Date.now() - start,
        message: 'Performance test failed',
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }
  
  private addResult(result: TestResult): void {
    this.results.push(result)
    const status = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'
    console.log(`${status} ${result.name}: ${result.message} (${result.duration}ms)`)
  }
  
  private generateReport(): SystemHealthReport {
    const passCount = this.results.filter(r => r.status === 'PASS').length
    const failCount = this.results.filter(r => r.status === 'FAIL').length
    const warningCount = this.results.filter(r => r.status === 'WARNING').length
    
    let overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY'
    if (failCount > 0) {
      overall = 'UNHEALTHY'
    } else if (warningCount > 0 || passCount < this.results.length * 0.8) {
      overall = 'DEGRADED'
    }
    
    const recommendations = this.generateRecommendations()
    
    return {
      timestamp: new Date().toISOString(),
      overall,
      tests: this.results,
      recommendations
    }
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    const failedTests = this.results.filter(r => r.status === 'FAIL')
    const warningTests = this.results.filter(r => r.status === 'WARNING')
    
    if (failedTests.length > 0) {
      recommendations.push('Address failing tests immediately - system may be unstable')
    }
    
    if (warningTests.length > 0) {
      recommendations.push('Monitor warning conditions and optimize performance')
    }
    
    const perfTest = this.results.find(r => r.name === 'Performance')
    if (perfTest && perfTest.status === 'WARNING') {
      recommendations.push('Consider implementing caching or optimizing database queries')
    }
    
    const aiTest = this.results.find(r => r.name === 'AI Analysis')
    if (aiTest && aiTest.status === 'WARNING') {
      recommendations.push('Check AI service configuration and API rate limits')
    }
    
    const cryptoTest = this.results.find(r => r.name === 'Crypto Data Service')
    if (cryptoTest && cryptoTest.status === 'WARNING') {
      recommendations.push('Monitor external API rate limits and implement better fallback mechanisms')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System is running optimally - continue monitoring')
    }
    
    return recommendations
  }
}

// Export singleton instance
export const systemTester = new SystemTester()