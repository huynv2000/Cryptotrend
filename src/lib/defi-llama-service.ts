/**
 * DeFi Llama Integration Service
 * Service for fetching Usage & Growth Metrics from DeFi Llama API
 * 
 * Dịch vụ tích hợp DeFi Llama để lấy dữ liệu Usage & Growth Metrics
 * 
 * @author Financial Systems Expert
 * @version 1.0
 */

export interface DeFiLlamaChainData {
  chain: string                    // Chain name (ethereum, bitcoin, etc.)
  tvl: number                      // Total Value Locked
  tvlChange24h: number             // 24h TVL change percentage
  volume24h: number               // 24h volume
  fees24h: number                 // 24h fees
  revenue24h: number              // 24h revenue
  activeUsers24h: number          // 24h active users
  transactions24h: number         // 24h transaction count
  uniqueAddresses: number         // Total unique addresses
  userGrowth30d: number           // 30-day user growth percentage
  volumeGrowth30d: number         // 30-day volume growth percentage
}

export interface DeFiLlamaProtocolData {
  name: string                    // Protocol name
  chain: string                   // Chain
  category: string                // DeFi category
  tvl: number                     // Protocol TVL
  tvlChange24h: number            // 24h TVL change
  volume24h: number               // 24h volume
  fees24h: number                 // 24h fees
  revenue24h: number              // 24h revenue
  users24h: number                // 24h active users
}

export class DeFiLlamaService {
  private static instance: DeFiLlamaService
  private baseUrl: string = 'https://api.llama.fi'
  private rateLimiter: Map<string, number> = new Map()
  
  static getInstance(): DeFiLlamaService {
    if (!DeFiLlamaService.instance) {
      DeFiLlamaService.instance = new DeFiLlamaService()
    }
    return DeFiLlamaService.instance
  }

  /**
   * Get chain-specific usage and growth metrics
   * Lấy metrics sử dụng và tăng trưởng theo chuỗi
   */
  async getChainMetrics(chain: string): Promise<DeFiLlamaChainData | null> {
    try {
      // Check rate limit
      if (!this.checkRateLimit('chain')) {
        console.warn('⚠️ Rate limit exceeded for chain metrics')
        return null
      }

      console.log(`🔍 Fetching DeFi Llama metrics for ${chain}`)
      
      // Fetch TVL data
      const tvlData = await this.fetchChainTVL(chain)
      if (!tvlData) return null

      // Fetch volume and fees data
      const volumeData = await this.fetchChainVolume(chain)
      
      // Fetch user data
      const userData = await this.fetchChainUsers(chain)
      
      // Calculate growth metrics
      const growthData = await this.calculateGrowthMetrics(chain)

      return {
        chain,
        tvl: tvlData.tvl,
        tvlChange24h: tvlData.change24h,
        volume24h: volumeData?.volume24h || 0,
        fees24h: volumeData?.fees24h || 0,
        revenue24h: volumeData?.revenue24h || 0,
        activeUsers24h: userData?.activeUsers24h || 0,
        transactions24h: userData?.transactions24h || 0,
        uniqueAddresses: userData?.uniqueAddresses || 0,
        userGrowth30d: growthData?.userGrowth30d || 0,
        volumeGrowth30d: growthData?.volumeGrowth30d || 0
      }
    } catch (error) {
      console.error(`❌ Error fetching chain metrics for ${chain}:`, error)
      return null
    }
  }

  /**
   * Get top protocols by TVL for a chain
   * Lấy top protocols theo TVL cho một chuỗi
   */
  async getTopProtocols(chain: string, limit: number = 10): Promise<DeFiLlamaProtocolData[]> {
    try {
      if (!this.checkRateLimit('protocols')) {
        console.warn('⚠️ Rate limit exceeded for protocols')
        return []
      }

      console.log(`🔍 Fetching top protocols for ${chain}`)
      
      const response = await fetch(`${this.baseUrl}/protocols/${chain}`)
      if (!response.ok) return []
      
      const data = await response.json()
      
      return data.slice(0, limit).map((protocol: any) => ({
        name: protocol.name,
        chain: protocol.chain,
        category: protocol.category,
        tvl: protocol.tvl || 0,
        tvlChange24h: protocol.change_1d || 0,
        volume24h: protocol.volume_24h || 0,
        fees24h: protocol.fees_24h || 0,
        revenue24h: protocol.revenue_24h || 0,
        users24h: protocol.users_24h || 0
      }))
    } catch (error) {
      console.error(`❌ Error fetching protocols for ${chain}:`, error)
      return []
    }
  }

  /**
   * Get historical TVL data for growth analysis
   * Lấy dữ liệu TVL lịch sử để phân tích tăng trưởng
   */
  async getHistoricalTVL(chain: string, days: number = 30): Promise<{timestamp: string, tvl: number}[]> {
    try {
      if (!this.checkRateLimit('historical')) {
        console.warn('⚠️ Rate limit exceeded for historical data')
        return []
      }

      console.log(`🔍 Fetching historical TVL for ${chain} (${days} days)`)
      
      const response = await fetch(`${this.baseUrl}/v2/historicalChainTvl/${chain}`)
      if (!response.ok) return []
      
      const data = await response.json()
      
      // Return last N days of data
      return data.slice(-days).map((item: any) => ({
        timestamp: item.date,
        tvl: item.tvl
      }))
    } catch (error) {
      console.error(`❌ Error fetching historical TVL for ${chain}:`, error)
      return []
    }
  }

  /**
   * Fetch chain TVL data
   */
  private async fetchChainTVL(chain: string): Promise<{tvl: number, change24h: number} | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/chains/${chain}`)
      if (!response.ok) return null
      
      const data = await response.json()
      
      return {
        tvl: data.tvl || 0,
        change24h: data.change_1d || 0
      }
    } catch (error) {
      console.error(`❌ Error fetching TVL for ${chain}:`, error)
      return null
    }
  }

  /**
   * Fetch chain volume and fees data
   */
  private async fetchChainVolume(chain: string): Promise<{volume24h: number, fees24h: number, revenue24h: number} | null> {
    try {
      // DeFi Llama doesn't have direct volume/fees endpoint for chains
      // We'll calculate from protocols or use alternative endpoints
      const protocols = await this.getTopProtocols(chain, 50)
      
      const totalVolume = protocols.reduce((sum, p) => sum + p.volume24h, 0)
      const totalFees = protocols.reduce((sum, p) => sum + p.fees24h, 0)
      const totalRevenue = protocols.reduce((sum, p) => sum + p.revenue24h, 0)
      
      return {
        volume24h: totalVolume,
        fees24h: totalFees,
        revenue24h: totalRevenue
      }
    } catch (error) {
      console.error(`❌ Error fetching volume for ${chain}:`, error)
      return null
    }
  }

  /**
   * Fetch chain user data
   */
  private async fetchChainUsers(chain: string): Promise<{activeUsers24h: number, transactions24h: number, uniqueAddresses: number} | null> {
    try {
      // Note: DeFi Llama has limited user data
      // We'll need to estimate or use alternative sources
      // For now, return estimated data based on TVL and chain characteristics
      
      const tvlData = await this.fetchChainTVL(chain)
      if (!tvlData) return null
      
      // Estimate users based on TVL (rough estimation)
      const estimatedUsers = this.estimateUsersFromTVL(chain, tvlData.tvl)
      const estimatedTransactions = this.estimateTransactionsFromTVL(chain, tvlData.tvl)
      
      return {
        activeUsers24h: estimatedUsers.activeUsers,
        transactions24h: estimatedTransactions,
        uniqueAddresses: estimatedUsers.totalAddresses
      }
    } catch (error) {
      console.error(`❌ Error fetching users for ${chain}:`, error)
      return null
    }
  }

  /**
   * Calculate growth metrics from historical data
   */
  private async calculateGrowthMetrics(chain: string): Promise<{userGrowth30d: number, volumeGrowth30d: number} | null> {
    try {
      const historicalData = await this.getHistoricalTVL(chain, 60) // Get 60 days for 30-day growth
      
      if (historicalData.length < 30) return null
      
      const currentTVL = historicalData[historicalData.length - 1]?.tvl || 0
      const previousTVL = historicalData[historicalData.length - 30]?.tvl || 0
      
      const tvlGrowth = previousTVL > 0 ? ((currentTVL - previousTVL) / previousTVL) * 100 : 0
      
      // Estimate user and volume growth based on TVL growth (rough approximation)
      const userGrowth30d = tvlGrowth * 0.8 // Users typically grow slower than TVL
      const volumeGrowth30d = tvlGrowth * 1.2 // Volume typically grows faster than TVL
      
      return {
        userGrowth30d,
        volumeGrowth30d
      }
    } catch (error) {
      console.error(`❌ Error calculating growth metrics for ${chain}:`, error)
      return null
    }
  }

  /**
   * Estimate user metrics based on TVL
   */
  private estimateUsersFromTVL(chain: string, tvl: number): {activeUsers: number, totalAddresses: number} {
    // Different chains have different user-to-TVL ratios
    const chainMultipliers: Record<string, {activeRatio: number, totalRatio: number}> = {
      ethereum: { activeRatio: 0.00001, totalRatio: 0.0001 },   // Higher user engagement
      bitcoin: { activeRatio: 0.000001, totalRatio: 0.00001 },   // Lower user engagement
      binancecoin: { activeRatio: 0.000005, totalRatio: 0.00005 },
      solana: { activeRatio: 0.000008, totalRatio: 0.00008 }
    }
    
    const multiplier = chainMultipliers[chain] || chainMultipliers.ethereum
    
    return {
      activeUsers: Math.floor(tvl * multiplier.activeRatio),
      totalAddresses: Math.floor(tvl * multiplier.totalRatio)
    }
  }

  /**
   * Estimate transaction volume based on TVL
   */
  private estimateTransactionsFromTVL(chain: string, tvl: number): number {
    // Different chains have different transaction volumes relative to TVL
    const chainMultipliers: Record<string, number> = {
      ethereum: 0.1,      // High transaction volume
      bitcoin: 0.01,     // Lower transaction volume
      binancecoin: 0.05,
      solana: 0.15       // Very high transaction volume
    }
    
    const multiplier = chainMultipliers[chain] || chainMultipliers.ethereum
    
    return Math.floor(tvl * multiplier)
  }

  /**
   * Rate limiting implementation
   */
  private checkRateLimit(endpoint: string): boolean {
    const now = Date.now()
    const lastCall = this.rateLimiter.get(endpoint) || 0
    
    // Rate limit: 100 requests per minute per endpoint type
    if (now - lastCall < 600) { // ~600ms between requests
      return false
    }
    
    this.rateLimiter.set(endpoint, now)
    return true
  }

  /**
   * Get DeFi Llama status and   */
  async getAPIStatus(): Promise<{status: string, latency: number}> {
    try {
      const start = Date.now()
      const response = await fetch(`${this.baseUrl}/v2/chains`)
      const latency = Date.now() - start
      
      return {
        status: response.ok ? 'healthy' : 'error',
        latency
      }
    } catch (error) {
      return {
        status: 'error',
        latency: 0
      }
    }
  }
}