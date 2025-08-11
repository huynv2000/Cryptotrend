/**
 * Volume History Service for Cryptocurrency Analytics
 * Handles 90-day volume data and 30-day moving average calculations
 * 
 * Dịch vụ này quản lý dữ liệu khối lượng giao dịch cho phân tích thị trường tiền điện tử,
 * bao gồm:
 * - Lưu trữ và truy xuất dữ liệu khối lượng 90 ngày
 * - Tính toán đường trung bình động 30 ngày
 * - Phân tích xu hướng khối lượng
 * - Cung cấp dữ liệu fallback khi API không khả dụng
 * - Tích hợp với CoinGecko API để cập nhật dữ liệu
 * 
 * Các phương thức chính:
 * - getVolumeHistory(): Lấy lịch sử khối lượng giao dịch
 * - getVolumeAnalysis(): Phân tích khối lượng toàn diện
 * - fetchAndStoreVolumeHistory(): Lấy và lưu dữ liệu từ API
 * - calculate30DayAverage(): Tính trung bình động 30 ngày
 * - calculateVolumeTrend(): Phân tích xu hướng khối lượng
 * - calculateVolumeMomentum(): Tính đà tăng/giảm
 * 
 * @author Crypto Analytics Team
 * @version 2.0
 */

import { db } from '@/lib/db'
import { CoinGeckoService } from './crypto-service'

export interface VolumeData {
  timestamp: string
  dailyVolume: number
  price?: number // Add price field
  exchangeVolume?: Record<string, number>
  volumeChange24h?: number
  volumeAvg30d?: number
  volumeVsAvg?: number
}

export interface VolumeAnalysis {
  currentVolume: number
  volumeAvg30d: number
  volumeVsAvg: number
  volumeTrend: 'increasing' | 'decreasing' | 'stable'
  volumeMomentum: 'high' | 'medium' | 'low'
  exchangeDistribution: Record<string, number>
  volumeHistory: VolumeData[]
}

export class VolumeService {
  private static instance: VolumeService
  private coinGeckoService: CoinGeckoService

  constructor() {
    this.coinGeckoService = CoinGeckoService.getInstance()
  }

  static getInstance(): VolumeService {
    if (!VolumeService.instance) {
      VolumeService.instance = new VolumeService()
    }
    return VolumeService.instance
  }

  /**
   * Get 90-day volume history for a cryptocurrency
   */
  async getVolumeHistory(cryptoId: string, days: number = 90): Promise<VolumeData[]> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get volume history from database
      const volumeHistory = await db.volumeHistory.findMany({
        where: {
          cryptoId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      })

      if (volumeHistory.length > 0) {
        return volumeHistory.map(item => ({
          timestamp: item.timestamp.toISOString(),
          dailyVolume: item.dailyVolume,
          price: item.price || undefined, // Add price field
          exchangeVolume: item.exchangeVolume ? JSON.parse(item.exchangeVolume) : undefined,
          volumeChange24h: item.volumeChange24h || undefined,
          volumeAvg30d: item.volumeAvg30d || undefined,
          volumeVsAvg: item.volumeVsAvg || undefined
        }))
      }

      // If no data in database, fetch from API
      return await this.fetchAndStoreVolumeHistory(cryptoId, days)
    } catch (error) {
      console.error('Error getting volume history:', error)
      return []
    }
  }

  /**
   * Get comprehensive volume analysis
   */
  async getVolumeAnalysis(cryptoId: string): Promise<VolumeAnalysis> {
    try {
      const volumeHistory = await this.getVolumeHistory(cryptoId, 90)
      
      if (volumeHistory.length === 0) {
        return {
          currentVolume: 0,
          volumeAvg30d: 0,
          volumeVsAvg: 0,
          volumeTrend: 'stable',
          volumeMomentum: 'low',
          exchangeDistribution: {},
          volumeHistory: []
        }
      }

      const currentVolume = volumeHistory[volumeHistory.length - 1].dailyVolume
      const volumeAvg30d = this.calculate30DayAverage(volumeHistory)
      const volumeVsAvg = ((currentVolume - volumeAvg30d) / volumeAvg30d) * 100
      const volumeTrend = this.calculateVolumeTrend(volumeHistory)
      const volumeMomentum = this.calculateVolumeMomentum(currentVolume, volumeAvg30d)
      
      // Get exchange distribution from the latest data
      const exchangeDistribution = volumeHistory[volumeHistory.length - 1].exchangeVolume || {}

      return {
        currentVolume,
        volumeAvg30d,
        volumeVsAvg,
        volumeTrend,
        volumeMomentum,
        exchangeDistribution,
        volumeHistory
      }
    } catch (error) {
      console.error('Error getting volume analysis:', error)
      return {
        currentVolume: 0,
        volumeAvg30d: 0,
        volumeVsAvg: 0,
        volumeTrend: 'stable',
        volumeMomentum: 'low',
        exchangeDistribution: {},
        volumeHistory: []
      }
    }
  }

  /**
   * Fetch volume history from CoinGecko and store in database
   */
  private async fetchAndStoreVolumeHistory(cryptoId: string, days: number = 90): Promise<VolumeData[]> {
    try {
      // Get market chart data from CoinGecko
      const marketChart = await this.coinGeckoService.getMarketChart(cryptoId, 'usd', days)
      
      if (!marketChart || !marketChart.prices || !marketChart.total_volumes) {
        throw new Error('Invalid market chart data')
      }

      const volumeData: VolumeData[] = []
      const now = new Date()

      // Process each day's data
      for (let i = 0; i < marketChart.prices.length; i++) {
        const [timestamp, price] = marketChart.prices[i]
        const [_, volume] = marketChart.total_volumes[i]
        
        const date = new Date(timestamp)
        const volumeEntry: VolumeData = {
          timestamp: date.toISOString(),
          dailyVolume: volume,
          price: price, // Add price data
          volumeChange24h: i > 0 ? ((volume - marketChart.total_volumes[i-1][1]) / marketChart.total_volumes[i-1][1]) * 100 : 0
        }

        volumeData.push(volumeEntry)

        // Calculate 30-day average for this point
        if (i >= 29) {
          const last30Days = marketChart.total_volumes.slice(i - 29, i + 1)
          const avg30d = last30Days.reduce((sum, [_, vol]) => sum + vol, 0) / 30
          volumeEntry.volumeAvg30d = avg30d
          volumeEntry.volumeVsAvg = ((volume - avg30d) / avg30d) * 100
        }

        // Store in database
        void this.storeVolumeData(cryptoId, volumeEntry)
      }

      console.log(`✅ Stored ${volumeData.length} days of volume history for ${cryptoId}`)
      return volumeData
    } catch (error) {
      console.error('Error fetching volume history:', error)
      return []
    }
  }

  /**
   * Store volume data in database
   */
  private async storeVolumeData(cryptoId: string, volumeData: VolumeData): Promise<void> {
    try {
      await db.volumeHistory.upsert({
        where: {
          cryptoId_timestamp: {
            cryptoId,
            timestamp: new Date(volumeData.timestamp)
          }
        },
        update: {
          dailyVolume: volumeData.dailyVolume,
          price: volumeData.price, // Add price field
          exchangeVolume: volumeData.exchangeVolume ? JSON.stringify(volumeData.exchangeVolume) : null,
          volumeChange24h: volumeData.volumeChange24h,
          volumeAvg30d: volumeData.volumeAvg30d,
          volumeVsAvg: volumeData.volumeVsAvg
        },
        create: {
          cryptoId,
          timestamp: new Date(volumeData.timestamp),
          dailyVolume: volumeData.dailyVolume,
          price: volumeData.price, // Add price field
          exchangeVolume: volumeData.exchangeVolume ? JSON.stringify(volumeData.exchangeVolume) : null,
          volumeChange24h: volumeData.volumeChange24h,
          volumeAvg30d: volumeData.volumeAvg30d,
          volumeVsAvg: volumeData.volumeVsAvg
        }
      })
    } catch (error) {
      console.error('Error storing volume data:', error)
    }
  }

  /**
   * Calculate 30-day moving average
   */
  private calculate30DayAverage(volumeHistory: VolumeData[]): number {
    if (volumeHistory.length < 30) {
      const sum = volumeHistory.reduce((acc, item) => acc + item.dailyVolume, 0)
      return sum / volumeHistory.length
    }

    const last30Days = volumeHistory.slice(-30)
    const sum = last30Days.reduce((acc, item) => acc + item.dailyVolume, 0)
    return sum / 30
  }

  /**
   * Calculate volume trend
   */
  private calculateVolumeTrend(volumeHistory: VolumeData[]): 'increasing' | 'decreasing' | 'stable' {
    if (volumeHistory.length < 7) return 'stable'

    const recent7Days = volumeHistory.slice(-7)
    const firstHalf = recent7Days.slice(0, 3)
    const secondHalf = recent7Days.slice(-3)

    const firstHalfAvg = firstHalf.reduce((acc, item) => acc + item.dailyVolume, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((acc, item) => acc + item.dailyVolume, 0) / secondHalf.length

    const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100

    if (changePercent > 5) return 'increasing'
    if (changePercent < -5) return 'decreasing'
    return 'stable'
  }

  /**
   * Calculate volume momentum
   */
  private calculateVolumeMomentum(currentVolume: number, avg30d: number): 'high' | 'medium' | 'low' {
    const ratio = currentVolume / avg30d

    if (ratio > 1.5) return 'high'
    if (ratio > 0.7) return 'medium'
    return 'low'
  }

  /**
   * Update volume data for all cryptocurrencies (called by data collector)
   */
  async updateVolumeDataForAllCryptos(): Promise<void> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany()
      
      for (const crypto of cryptocurrencies) {
        try {
          await this.getVolumeAnalysis(crypto.id)
          console.log(`📊 Updated volume data for ${crypto.symbol}`)
        } catch (error) {
          console.error(`❌ Failed to update volume data for ${crypto.symbol}:`, error)
        }
      }
    } catch (error) {
      console.error('❌ Error updating volume data for all cryptos:', error)
    }
  }
}

// Export singleton instance
export const volumeService = VolumeService.getInstance()