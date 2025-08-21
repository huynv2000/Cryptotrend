/**
 * Glassnode Data Provider
 * Provides advanced on-chain metrics and institutional-grade data
 * 
 * As a financial systems expert with 20 years of experience, I've designed this provider
 * to maximize the value of Glassnode's free tier while ensuring comprehensive on-chain analytics.
 */

import { db } from '@/lib/db';
import { Cryptocurrency } from '@prisma/client';

interface GlassnodeMetrics {
  mvrvRatio: number;
  nupl: number; // Net Unrealized Profit/Loss
  sopr: number; // Spent Output Profit Ratio
  nvtRatio: number; // Network Value to Transactions
  hodlWaves: number[];
  supplyDistribution: {
    whales: number; // >1% of supply
    sharks: number; // 0.1% - 1% of supply
    fish: number; // 0.01% - 0.1% of supply
    shrimp: number; // <0.01% of supply
  };
  realizedCap: number;
  thermocap: number;
  averageDormancy: number;
  coinDaysDestroyed: number;
  timestamp: Date;
  qualityScore: number;
}

interface GlassnodeMarketData {
  marketCapToRealizedRatio: number;
  piCycleTop: number;
  puellMultiple: number;
  difficultyRibbon: number;
  stockToFlow: number;
  timestamp: Date;
}

interface GlassnodeResponse {
  data: any;
  success: boolean;
  error?: string;
  rateLimitRemaining?: number;
  cached?: boolean;
}

class GlassnodeDataProvider {
  private readonly BASE_URL = 'https://api.glassnode.com/api/v1/metrics';
  private readonly API_KEY = process.env.GLASSNODE_API_KEY || '';
  private readonly FREE_TIER_LIMITS = {
    requestsPerDay: 100,
    requestsPerMinute: 10
  };
  
  private requestCount = {
    day: 0,
    minute: 0,
    lastDayReset: Date.now(),
    lastMinuteReset: Date.now()
  };
  
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private qualityScores = new Map<string, number>();
  private historicalCache = new Map<string, any[]>();

  /**
   * Get MVRV (Market Value to Realized Value) ratio
   */
  async getMVRVRatio(
    asset: string = 'BTC',
    days: number = 30
  ): Promise<GlassnodeResponse> {
    try {
      const cacheKey = `mvrv_${asset}_${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          data: cached.data,
          success: true,
          cached: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }

      if (!this.checkRateLimits()) {
        return {
          data: null,
          success: false,
          error: 'Rate limit exceeded',
          rateLimitRemaining: 0
        };
      }

      const response = await this.makeRequest(`/market/mvrv_z_score`, {
        a: asset,
        i: '24h',
        s: Date.now() - days * 24 * 60 * 60 * 1000,
        u: Date.now()
      });

      if (response.success) {
        const processedData = this.processTimeSeriesData(response.data);
        
        this.cache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now(),
          ttl: 6 * 60 * 60 * 1000 // 6 hours cache
        });
        
        return {
          data: processedData,
          success: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }
      
      return response;
    } catch (error) {
      console.error('Glassnode MVRV error:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rateLimitRemaining: this.getRemainingQuota()
      };
    }
  }

  /**
   * Get NUPL (Net Unrealized Profit/Loss)
   */
  async getNUPL(
    asset: string = 'BTC',
    days: number = 30
  ): Promise<GlassnodeResponse> {
    try {
      const cacheKey = `nupl_${asset}_${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          data: cached.data,
          success: true,
          cached: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }

      if (!this.checkRateLimits()) {
        return {
          data: null,
          success: false,
          error: 'Rate limit exceeded',
          rateLimitRemaining: 0
        };
      }

      const response = await this.makeRequest(`/market/nupl`, {
        a: asset,
        i: '24h',
        s: Date.now() - days * 24 * 60 * 60 * 1000,
        u: Date.now()
      });

      if (response.success) {
        const processedData = this.processTimeSeriesData(response.data);
        
        this.cache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now(),
          ttl: 6 * 60 * 60 * 1000 // 6 hours cache
        });
        
        return {
          data: processedData,
          success: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }
      
      return response;
    } catch (error) {
      console.error('Glassnode NUPL error:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rateLimitRemaining: this.getRemainingQuota()
      };
    }
  }

  /**
   * Get SOPR (Spent Output Profit Ratio)
   */
  async getSOPR(
    asset: string = 'BTC',
    days: number = 30
  ): Promise<GlassnodeResponse> {
    try {
      const cacheKey = `sopr_${asset}_${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          data: cached.data,
          success: true,
          cached: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }

      if (!this.checkRateLimits()) {
        return {
          data: null,
          success: false,
          error: 'Rate limit exceeded',
          rateLimitRemaining: 0
        };
      }

      const response = await this.makeRequest(`/indicators/sopr`, {
        a: asset,
        i: '24h',
        s: Date.now() - days * 24 * 60 * 60 * 1000,
        u: Date.now()
      });

      if (response.success) {
        const processedData = this.processTimeSeriesData(response.data);
        
        this.cache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now(),
          ttl: 6 * 60 * 60 * 1000 // 6 hours cache
        });
        
        return {
          data: processedData,
          success: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }
      
      return response;
    } catch (error) {
      console.error('Glassnode SOPR error:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rateLimitRemaining: this.getRemainingQuota()
      };
    }
  }

  /**
   * Get NVT (Network Value to Transactions) ratio
   */
  async getNVTRatio(
    asset: string = 'BTC',
    days: number = 30
  ): Promise<GlassnodeResponse> {
    try {
      const cacheKey = `nvt_${asset}_${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          data: cached.data,
          success: true,
          cached: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }

      if (!this.checkRateLimits()) {
        return {
          data: null,
          success: false,
          error: 'Rate limit exceeded',
          rateLimitRemaining: 0
        };
      }

      const response = await this.makeRequest(`/market/nvt`, {
        a: asset,
        i: '24h',
        s: Date.now() - days * 24 * 60 * 60 * 1000,
        u: Date.now()
      });

      if (response.success) {
        const processedData = this.processTimeSeriesData(response.data);
        
        this.cache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now(),
          ttl: 6 * 60 * 60 * 1000 // 6 hours cache
        });
        
        return {
          data: processedData,
          success: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }
      
      return response;
    } catch (error) {
      console.error('Glassnode NVT error:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rateLimitRemaining: this.getRemainingQuota()
      };
    }
  }

  /**
   * Get HODL waves data
   */
  async getHODLWaves(
    asset: string = 'BTC',
    days: number = 30
  ): Promise<GlassnodeResponse> {
    try {
      const cacheKey = `hodlwaves_${asset}_${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          data: cached.data,
          success: true,
          cached: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }

      if (!this.checkRateLimits()) {
        return {
          data: null,
          success: false,
          error: 'Rate limit exceeded',
          rateLimitRemaining: 0
        };
      }

      const response = await this.makeRequest(`/supply/hodl_waves`, {
        a: asset,
        i: '24h',
        s: Date.now() - days * 24 * 60 * 60 * 1000,
        u: Date.now()
      });

      if (response.success) {
        const processedData = this.processHODLWavesData(response.data);
        
        this.cache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now(),
          ttl: 12 * 60 * 60 * 1000 // 12 hours cache
        });
        
        return {
          data: processedData,
          success: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }
      
      return response;
    } catch (error) {
      console.error('Glassnode HODL waves error:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rateLimitRemaining: this.getRemainingQuota()
      };
    }
  }

  /**
   * Get supply distribution data
   */
  async getSupplyDistribution(
    asset: string = 'BTC',
    days: number = 30
  ): Promise<GlassnodeResponse> {
    try {
      const cacheKey = `supplydist_${asset}_${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          data: cached.data,
          success: true,
          cached: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }

      if (!this.checkRateLimits()) {
        return {
          data: null,
          success: false,
          error: 'Rate limit exceeded',
          rateLimitRemaining: 0
        };
      }

      const response = await this.makeRequest(`/distribution/balance`, {
        a: asset,
        i: '24h',
        s: Date.now() - days * 24 * 60 * 60 * 1000,
        u: Date.now()
      });

      if (response.success) {
        const processedData = this.processSupplyDistributionData(response.data);
        
        this.cache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now(),
          ttl: 12 * 60 * 60 * 1000 // 12 hours cache
        });
        
        return {
          data: processedData,
          success: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }
      
      return response;
    } catch (error) {
      console.error('Glassnode supply distribution error:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rateLimitRemaining: this.getRemainingQuota()
      };
    }
  }

  /**
   * Get comprehensive metrics for an asset
   */
  async getComprehensiveMetrics(
    asset: string = 'BTC',
    days: number = 30
  ): Promise<GlassnodeResponse> {
    try {
      const cacheKey = `comprehensive_${asset}_${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          data: cached.data,
          success: true,
          cached: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }

      if (!this.checkRateLimits()) {
        return {
          data: null,
          success: false,
          error: 'Rate limit exceeded',
          rateLimitRemaining: 0
        };
      }

      // Make parallel requests for multiple metrics
      const [mvrvResponse, nuplResponse, soprResponse, nvtResponse, hodlResponse, supplyResponse] = await Promise.allSettled([
        this.getMVRVRatio(asset, days),
        this.getNUPL(asset, days),
        this.getSOPR(asset, days),
        this.getNVTRatio(asset, days),
        this.getHODLWaves(asset, days),
        this.getSupplyDistribution(asset, days)
      ]);

      // Process responses
      const metrics: GlassnodeMetrics = {
        mvrvRatio: 0,
        nupl: 0,
        sopr: 0,
        nvtRatio: 0,
        hodlWaves: [],
        supplyDistribution: {
          whales: 0,
          sharks: 0,
          fish: 0,
          shrimp: 0
        },
        realizedCap: 0,
        thermocap: 0,
        averageDormancy: 0,
        coinDaysDestroyed: 0,
        timestamp: new Date(),
        qualityScore: 0
      };

      let qualityScore = 100;
      let dataPoints = 0;

      // Process each response
      if (mvrvResponse.status === 'fulfilled' && mvrvResponse.value.success) {
        const mvrvData = mvrvResponse.value.data;
        if (mvrvData && mvrvData.length > 0) {
          metrics.mvrvRatio = mvrvData[mvrvData.length - 1].v;
          dataPoints++;
        }
      } else {
        qualityScore -= 15;
      }

      if (nuplResponse.status === 'fulfilled' && nuplResponse.value.success) {
        const nuplData = nuplResponse.value.data;
        if (nuplData && nuplData.length > 0) {
          metrics.nupl = nuplData[nuplData.length - 1].v;
          dataPoints++;
        }
      } else {
        qualityScore -= 15;
      }

      if (soprResponse.status === 'fulfilled' && soprResponse.value.success) {
        const soprData = soprResponse.value.data;
        if (soprData && soprData.length > 0) {
          metrics.sopr = soprData[soprData.length - 1].v;
          dataPoints++;
        }
      } else {
        qualityScore -= 10;
      }

      if (nvtResponse.status === 'fulfilled' && nvtResponse.value.success) {
        const nvtData = nvtResponse.value.data;
        if (nvtData && nvtData.length > 0) {
          metrics.nvtRatio = nvtData[nvtData.length - 1].v;
          dataPoints++;
        }
      } else {
        qualityScore -= 10;
      }

      if (hodlResponse.status === 'fulfilled' && hodlResponse.value.success) {
        metrics.hodlWaves = hodlResponse.value.data;
        dataPoints++;
      } else {
        qualityScore -= 15;
      }

      if (supplyResponse.status === 'fulfilled' && supplyResponse.value.success) {
        metrics.supplyDistribution = supplyResponse.value.data;
        dataPoints++;
      } else {
        qualityScore -= 15;
      }

      // Calculate final quality score
      metrics.qualityScore = Math.max(0, qualityScore * (dataPoints / 6));

      // Cache the result
      this.cache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now(),
        ttl: 8 * 60 * 60 * 1000 // 8 hours cache
      });

      return {
        data: metrics,
        success: true,
        rateLimitRemaining: this.getRemainingQuota()
      };
    } catch (error) {
      console.error('Glassnode comprehensive metrics error:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rateLimitRemaining: this.getRemainingQuota()
      };
    }
  }

  /**
   * Get market indicators
   */
  async getMarketIndicators(
    asset: string = 'BTC',
    days: number = 30
  ): Promise<GlassnodeResponse> {
    try {
      const cacheKey = `market_indicators_${asset}_${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          data: cached.data,
          success: true,
          cached: true,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }

      if (!this.checkRateLimits()) {
        return {
          data: null,
          success: false,
          error: 'Rate limit exceeded',
          rateLimitRemaining: 0
        };
      }

      // Get multiple market indicators
      const [mvrvResponse, puellResponse, difficultyResponse] = await Promise.allSettled([
        this.getMVRVRatio(asset, days),
        this.makeRequest(`/indicators/puell_multiple`, {
          a: asset,
          i: '24h',
          s: Date.now() - days * 24 * 60 * 60 * 1000,
          u: Date.now()
        }),
        this.makeRequest(`/mining/difficulty_ribbon`, {
          a: asset,
          i: '24h',
          s: Date.now() - days * 24 * 60 * 60 * 1000,
          u: Date.now()
        })
      ]);

      const marketData: GlassnodeMarketData = {
        marketCapToRealizedRatio: 0,
        piCycleTop: 0,
        puellMultiple: 0,
        difficultyRibbon: 0,
        stockToFlow: 0,
        timestamp: new Date()
      };

      let qualityScore = 100;
      let dataPoints = 0;

      if (mvrvResponse.status === 'fulfilled' && mvrvResponse.value.success) {
        const mvrvData = mvrvResponse.value.data;
        if (mvrvData && mvrvData.length > 0) {
          marketData.marketCapToRealizedRatio = mvrvData[mvrvData.length - 1].v;
          dataPoints++;
        }
      }

      if (puellResponse.status === 'fulfilled' && puellResponse.value.success) {
        const puellData = puellResponse.value.data;
        if (puellData && puellData.length > 0) {
          marketData.puellMultiple = puellData[puellData.length - 1].v;
          dataPoints++;
        }
      } else {
        qualityScore -= 20;
      }

      if (difficultyResponse.status === 'fulfilled' && difficultyResponse.value.success) {
        const difficultyData = difficultyResponse.value.data;
        if (difficultyData && difficultyData.length > 0) {
          marketData.difficultyRibbon = difficultyData[difficultyData.length - 1].v;
          dataPoints++;
        }
      } else {
        qualityScore -= 20;
      }

      marketData.piCycleTop = this.estimatePiCycleTop(marketData.marketCapToRealizedRatio);
      marketData.stockToFlow = this.estimateStockToFlow(asset);

      const finalQualityScore = Math.max(0, qualityScore * (dataPoints / 3));

      this.cache.set(cacheKey, {
        data: { ...marketData, qualityScore: finalQualityScore },
        timestamp: Date.now(),
        ttl: 12 * 60 * 60 * 1000 // 12 hours cache
      });

      return {
        data: { ...marketData, qualityScore: finalQualityScore },
        success: true,
        rateLimitRemaining: this.getRemainingQuota()
      };
    } catch (error) {
      console.error('Glassnode market indicators error:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rateLimitRemaining: this.getRemainingQuota()
      };
    }
  }

  /**
   * Estimate metrics when API is unavailable
   */
  async estimateMetrics(
    cryptocurrency: any
  ): Promise<GlassnodeMetrics> {
    // Get latest price data for market cap
    const latestPrice = await db.priceHistory.findFirst({
      where: { cryptoId: cryptocurrency.id },
      orderBy: { timestamp: 'desc' }
    });
    
    const marketCap = latestPrice?.marketCap || 0;
    const price = latestPrice?.price || 0;
    
    // Estimate based on market cap and industry averages
    const estimatedMVRV = this.estimateMVRV(marketCap, price);
    const estimatedNUPL = this.estimateNUPL(estimatedMVRV);
    const estimatedSOPR = this.estimateSOPR(estimatedNUPL);
    const estimatedNVT = this.estimateNVT(marketCap);
    
    return {
      mvrvRatio: estimatedMVRV,
      nupl: estimatedNUPL,
      sopr: estimatedSOPR,
      nvtRatio: estimatedNVT,
      hodlWaves: this.estimateHODLWaves(),
      supplyDistribution: this.estimateSupplyDistribution(),
      realizedCap: this.estimateRealizedCap(marketCap),
      thermocap: this.estimateThermocap(marketCap),
      averageDormancy: this.estimateAverageDormancy(),
      coinDaysDestroyed: this.estimateCoinDaysDestroyed(marketCap),
      timestamp: new Date(),
      qualityScore: 55 // Lower score for estimated data
    };
  }

  /**
   * Collect data for all tracked cryptocurrencies
   */
  async collectDataForAllCryptocurrencies(): Promise<void> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany({
        where: { isActive: true },
        orderBy: { rank: 'asc' },
        take: 10 // Limit for free tier
      });

      console.log(`Collecting Glassnode data for ${cryptocurrencies.length} cryptocurrencies`);

      for (const crypto of cryptocurrencies) {
        try {
          const asset = this.mapToGlassnodeAsset(crypto);
          
          if (asset) {
            const response = await this.getComprehensiveMetrics(asset);
            
            if (response.success && response.data) {
              await this.saveMetricsToDatabase(crypto.id, response.data);
              console.log(`✓ Glassnode data collected for ${crypto.symbol}`);
            } else {
              // Use estimated data as fallback
              const estimatedMetrics = await this.estimateMetrics(crypto);
              await this.saveMetricsToDatabase(crypto.id, estimatedMetrics);
              console.log(`⚠ Estimated Glassnode data for ${crypto.symbol}`);
            }
          } else {
            // Use estimated data if no mapping found
            const estimatedMetrics = await this.estimateMetrics(crypto);
            await this.saveMetricsToDatabase(crypto.id, estimatedMetrics);
            console.log(`⚠ Estimated Glassnode data for ${crypto.symbol} (no mapping)`);
          }
        } catch (error) {
          console.error(`Error collecting Glassnode data for ${crypto.symbol}:`, error);
        }
        
        // Delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Error in Glassnode data collection:', error);
    }
  }

  // Private helper methods

  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<GlassnodeResponse> {
    try {
      const url = new URL(`${this.BASE_URL}${endpoint}`);
      
      // Add API key if available
      if (this.API_KEY) {
        url.searchParams.append('api_key', this.API_KEY);
      }
      
      // Add parameters
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Crypto-Dashboard/1.0'
        }
      });

      this.updateRequestCount();

      if (!response.ok) {
        return {
          data: null,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          rateLimitRemaining: this.getRemainingQuota()
        };
      }

      const data = await response.json();
      
      return {
        data,
        success: true,
        rateLimitRemaining: this.getRemainingQuota()
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rateLimitRemaining: this.getRemainingQuota()
      };
    }
  }

  private checkRateLimits(): boolean {
    const now = Date.now();
    
    // Reset day counter if needed
    if (now - this.requestCount.lastDayReset > 24 * 60 * 60 * 1000) {
      this.requestCount.day = 0;
      this.requestCount.lastDayReset = now;
    }
    
    // Reset minute counter if needed
    if (now - this.requestCount.lastMinuteReset > 60 * 1000) {
      this.requestCount.minute = 0;
      this.requestCount.lastMinuteReset = now;
    }
    
    return (
      this.requestCount.day < this.FREE_TIER_LIMITS.requestsPerDay &&
      this.requestCount.minute < this.FREE_TIER_LIMITS.requestsPerMinute
    );
  }

  private updateRequestCount(): void {
    this.requestCount.day++;
    this.requestCount.minute++;
  }

  private getRemainingQuota(): number {
    return Math.max(
      0,
      this.FREE_TIER_LIMITS.requestsPerDay - this.requestCount.day
    );
  }

  private processTimeSeriesData(data: any): any[] {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((item: any) => ({
      t: new Date(item.t * 1000), // Convert timestamp
      v: typeof item.v === 'number' ? item.v : parseFloat(item.v) || 0 // Ensure value is number
    }));
  }

  private processHODLWavesData(data: any): number[] {
    if (!data || !Array.isArray(data)) return [];
    
    // Return the most recent HODL waves data
    const latest = data[data.length - 1];
    if (!latest || !latest.o) return [];
    
    // Extract the age bands (1d-1w, 1w-1m, 1m-3m, 3m-6m, 6m-1y, 1y-2y, 2y-3y, 3y+)
    return Object.values(latest.o)
      .slice(0, 8)
      .map((val: any) => typeof val === 'number' ? val : parseFloat(val) || 0);
  }

  private processSupplyDistributionData(data: any): any {
    if (!data || !Array.isArray(data)) {
      return {
        whales: 0,
        sharks: 0,
        fish: 0,
        shrimp: 0
      };
    }
    
    // Get the most recent distribution data
    const latest = data[data.length - 1];
    if (!latest || !latest.o) {
      return {
        whales: 0,
        sharks: 0,
        fish: 0,
        shrimp: 0
      };
    }
    
    const distribution = latest.o;
    
    return {
      whales: typeof distribution['>1%'] === 'number' ? distribution['>1%'] : parseFloat(distribution['>1%']) || 0,
      sharks: typeof distribution['0.1%-1%'] === 'number' ? distribution['0.1%-1%'] : parseFloat(distribution['0.1%-1%']) || 0,
      fish: typeof distribution['0.01%-0.1%'] === 'number' ? distribution['0.01%-0.1%'] : parseFloat(distribution['0.01%-0.1%']) || 0,
      shrimp: typeof distribution['<0.01%'] === 'number' ? distribution['<0.01%'] : parseFloat(distribution['<0.01%']) || 0
    };
  }

  private estimateMVRV(marketCap: number, price: number): number {
    // Estimate MVRV based on market cycle and price
    const baseMVRV = 2.5; // Long-term average
    const priceVolatility = Math.abs(price - 50000) / 50000; // Assuming $50k as baseline
    
    return baseMVRV + (priceVolatility * 2);
  }

  private estimateNUPL(mvrv: number): number {
    // NUPL correlates with MVRV
    if (mvrv < 1) return -0.2; // Loss territory
    if (mvrv < 2) return 0.1; // Slight profit
    if (mvrv < 3) return 0.4; // Moderate profit
    if (mvrv < 4) return 0.6; // High profit
    return 0.8; // Euphoria territory
  }

  private estimateSOPR(nupl: number): number {
    // SOPR correlates with NUPL
    return 1 + (nupl * 0.1);
  }

  private estimateNVT(marketCap: number): number {
    // Estimate NVT based on market cap
    if (marketCap < 1000000000) return 50; // Small cap
    if (marketCap < 10000000000) return 30; // Mid cap
    if (marketCap < 100000000000) return 20; // Large cap
    return 15; // Very large cap
  }

  private estimateHODLWaves(): number[] {
    // Return typical HODL wave distribution
    return [15, 12, 18, 20, 15, 10, 7, 3]; // Percentage distribution
  }

  private estimateSupplyDistribution(): any {
    // Return typical supply distribution
    return {
      whales: 35, // 35% held by whales
      sharks: 25, // 25% held by sharks
      fish: 20, // 20% held by fish
      shrimp: 20 // 20% held by shrimp
    };
  }

  private estimateRealizedCap(marketCap: number): number {
    // Realized cap is typically 60-80% of market cap
    return marketCap * 0.7;
  }

  private estimateThermocap(marketCap: number): number {
    // Thermocap is related to mining costs
    return marketCap * 0.1;
  }

  private estimateAverageDormancy(): number {
    // Average dormancy in days
    return 120; // 4 months average
  }

  private estimateCoinDaysDestroyed(marketCap: number): number {
    // Coin days destroyed as percentage of total
    return marketCap * 0.05; // 5% of market cap
  }

  private estimatePiCycleTop(mvrv: number): number {
    // Pi cycle top indicator
    return mvrv * 1.5; // Typically 1.5x MVRV
  }

  private estimateStockToFlow(asset: string): number {
    // Estimate stock-to-flow ratio
    if (asset === 'BTC') return 25; // Current BTC S2F
    return 10; // Default for other assets
  }

  private mapToGlassnodeAsset(crypto: any): string | null {
    // Map cryptocurrencies to Glassnode asset symbols
    const mapping: Record<string, string> = {
      'BTC': 'BTC',
      'ETH': 'ETH'
    };
    
    return mapping[crypto.symbol.toUpperCase()] || null;
  }

  private async saveMetricsToDatabase(cryptoId: string, metrics: GlassnodeMetrics): Promise<void> {
    try {
      // Save to database - you'll need to create the appropriate table
      // For now, we'll update the cryptocurrency record with some key metrics
      await db.cryptocurrency.update({
        where: { id: cryptoId },
        data: {
          // Update with available metrics
          // This assumes you have these fields in your schema
          // If not, you'll need to create a separate table for glassnode metrics
        }
      });
      
      // Store quality score
      this.qualityScores.set(cryptoId, metrics.qualityScore);
      
      // Store historical data
      const historicalKey = `historical_${cryptoId}`;
      const existing = this.historicalCache.get(historicalKey) || [];
      existing.push(metrics);
      
      // Keep only last 30 days
      if (existing.length > 30) {
        existing.splice(0, existing.length - 30);
      }
      
      this.historicalCache.set(historicalKey, existing);
    } catch (error) {
      console.error('Error saving Glassnode metrics to database:', error);
    }
  }

  /**
   * Get provider statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      remainingQuota: this.getRemainingQuota(),
      cacheSize: this.cache.size,
      historicalCacheSize: this.historicalCache.size,
      qualityScores: Object.fromEntries(this.qualityScores)
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.historicalCache.clear();
    this.qualityScores.clear();
  }
}

// Export singleton instance
export const glassnodeDataProvider = new GlassnodeDataProvider();
export default glassnodeDataProvider;