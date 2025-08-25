// Bridge Flow Service for Historical Data
import { BridgeFlowHistoricalData, MovingAverageResult, BridgeFlowSummary } from '@/types/bridge-flow';
import { formatFinancialValue } from '@/lib/utils';

export class BridgeFlowService {
  private static readonly CACHE_KEY = 'bridge_flows_historical';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get historical bridge flow data
   */
  static async getHistoricalData(
    days: number = 90,
    blockchain: string = 'ethereum'
  ): Promise<BridgeFlowHistoricalData[]> {
    try {
      // Check cache first
      const cachedData = this.getFromCache(days, blockchain);
      if (cachedData) {
        return cachedData;
      }

      // Generate mock data for demonstration
      // In production, this would be an API call
      const data = this.generateMockData(days, blockchain);
      
      // Calculate moving averages
      const dataWithMA = this.calculateMovingAverages(data);
      
      // Cache the result
      this.saveToCache(dataWithMA, days, blockchain);
      
      return dataWithMA;
    } catch (error) {
      console.error('Failed to get historical bridge flow data:', error);
      return this.getFallbackData(days);
    }
  }

  /**
   * Generate mock data for demonstration
   */
  private static generateMockData(days: number, blockchain: string): BridgeFlowHistoricalData[] {
    const data: BridgeFlowHistoricalData[] = [];
    const baseValue = 200000000; // $200M base
    const endDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      
      // Generate realistic fluctuations
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const trendFactor = 1 + (i / days) * 0.2; // Slight upward trend
      const weeklyFactor = Math.sin(i / 7 * Math.PI) * 0.1; // Weekly cycles
      
      const value = baseValue * randomFactor * trendFactor * (1 + weeklyFactor);
      const volume = value * (0.8 + Math.random() * 0.4); // Volume related to value
      const transactionCount = Math.floor(volume / 10000); // Rough estimate
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value),
        volume: Math.round(volume),
        transactionCount
      });
    }
    
    return data;
  }

  /**
   * Calculate moving averages
   */
  private static calculateMovingAverages(data: BridgeFlowHistoricalData[]): BridgeFlowHistoricalData[] {
    const values = data.map(d => d.value);
    
    return data.map((item, index) => ({
      ...item,
      ma7: this.calculateMA(values, index, 7),
      ma30: this.calculateMA(values, index, 30),
      ma90: this.calculateMA(values, index, 90)
    }));
  }

  /**
   * Calculate moving average for a specific point
   */
  private static calculateMA(values: number[], index: number, period: number): number | undefined {
    if (index < period - 1) return undefined;
    
    const start = index - period + 1;
    const sum = values.slice(start, index + 1).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Get summary statistics
   */
  static getSummary(data: BridgeFlowHistoricalData[]): BridgeFlowSummary {
    if (data.length === 0) {
      return {
        totalValue: 0,
        averageValue: 0,
        maxValue: 0,
        minValue: 0,
        changePercent: 0,
        trend: 'stable'
      };
    }

    const values = data.map(d => d.value);
    const totalValue = values.reduce((a, b) => a + b, 0);
    const averageValue = totalValue / values.length;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    // Calculate change percentage (first vs last)
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const changePercent = ((lastValue - firstValue) / firstValue) * 100;
    
    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 1) {
      trend = changePercent > 0 ? 'up' : 'down';
    }
    
    return {
      totalValue,
      averageValue,
      maxValue,
      minValue,
      changePercent,
      trend
    };
  }

  /**
   * Get data by time range
   */
  static getDataByTimeRange(
    allData: BridgeFlowHistoricalData[],
    timeRange: '7D' | '30D' | '90D'
  ): BridgeFlowHistoricalData[] {
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    return allData.slice(-days);
  }

  /**
   * Cache management
   */
  private static getFromCache(days: number, blockchain: string): BridgeFlowHistoricalData[] | null {
    try {
      const cacheKey = `${this.CACHE_KEY}_${days}_${blockchain}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to read from cache:', error);
      return null;
    }
  }

  private static saveToCache(
    data: BridgeFlowHistoricalData[], 
    days: number, 
    blockchain: string
  ): void {
    try {
      const cacheKey = `${this.CACHE_KEY}_${days}_${blockchain}`;
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }

  /**
   * Get fallback data
   */
  private static getFallbackData(days: number): BridgeFlowHistoricalData[] {
    return this.generateMockData(days, 'ethereum');
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.CACHE_KEY))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Format value for display
   */
  static formatValue(value: number): string {
    return formatFinancialValue(value, { style: 'compact' });
  }

  /**
   * Export data to CSV
   */
  static exportToCSV(data: BridgeFlowHistoricalData[]): string {
    const headers = ['Date', 'Value (USD)', 'Volume', 'Transactions', 'MA7', 'MA30', 'MA90'];
    const rows = data.map(item => [
      item.date,
      item.value.toString(),
      item.volume.toString(),
      item.transactionCount.toString(),
      item.ma7?.toFixed(2) || '',
      item.ma30?.toFixed(2) || '',
      item.ma90?.toFixed(2) || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}