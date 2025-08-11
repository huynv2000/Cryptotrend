/**
 * Enhanced AI Analysis Service v2.0
 * Multi-timeframe analysis with entry-exit points and risk management
 */

import ZAI from 'z-ai-web-dev-sdk';
import { CryptoDataService } from './crypto-service';
import { TradingSignalService } from './trading-signals';
import { AI_CONFIG, hasApiKey } from './config';

// Conditional import for OpenAI
let OpenAI: any = null;
let openAIInitialized = false;

async function initializeOpenAI() {
  if (!openAIInitialized) {
    try {
      const openaiModule = await import('openai');
      OpenAI = openaiModule.OpenAI;
      openAIInitialized = true;
    } catch (error) {
      console.warn('⚠️ OpenAI module not available. Enhanced AI analysis will use fallback mode.');
      openAIInitialized = true;
    }
  }
}

// Enhanced interfaces for v2.0
export interface EnhancedAIPromptContext {
  coinId: string;
  coinName: string;
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  marketCap: number;
  volume24h: number;
  
  // Long-term Metrics (6-12 months)
  longTerm: {
    mvrv: number;
    nupl: number;
    sopr: number;
    activeAddresses30d: number;
    networkGrowth: number;
    holderDistribution: number;
    realizedCap: number;
    thermocapRatio: number;
    stockToFlow: number;
    hodlWaves: number[];
  };
  
  // Medium-term Metrics (1-3 months)
  mediumTerm: {
    rsi: number;
    ma50: number;
    ma200: number;
    macd: number;
    bollingerUpper: number;
    bollingerLower: number;
    volumeProfile: number;
    priceChannels: {
      upper: number;
      lower: number;
    };
    marketStructure: 'BULLISH' | 'BEARISH' | 'RANGING';
    correlationWithBTC: number;
  };
  
  // Short-term Metrics (1-4 weeks)
  shortTerm: {
    fearGreedIndex: number;
    fearGreedClassification: string;
    twitterSentiment: number;
    redditSentiment: number;
    socialVolume: number;
    newsSentiment: number;
    newsVolume: number;
    googleTrendsScore: number;
    googleTrendsDirection: string;
    fundingRate: number;
    openInterest: number;
    liquidationVolume: number;
    putCallRatio: number;
    tradingSignal: string;
    signalConfidence: number;
    signalRisk: string;
    volatility: number;
    orderBookDepth: {
      bids: number;
      asks: number;
    };
  };
}

export interface EnhancedAIAnalysisResult {
  provider: 'Z.AI' | 'ChatGPT' | 'RULE_BASED';
  analysisType: 'LONG_TERM' | 'MEDIUM_TERM' | 'SHORT_TERM' | 'MULTI_TIMEFRAME';
  
  // Trend Analysis by Timeframe
  trendAnalysis: {
    longTerm: {
      trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      confidence: number;
      reasoning: string;
      keyDrivers: string[];
    };
    mediumTerm: {
      trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      confidence: number;
      reasoning: string;
      keyDrivers: string[];
    };
    shortTerm: {
      trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      confidence: number;
      reasoning: string;
      keyDrivers: string[];
    };
  };
  
  // Trading Recommendations
  tradingRecommendations: {
    overallSignal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    entryPoints: {
      longTerm: {
        priceRange: string;
        confidence: number;
        reasoning: string;
      };
      mediumTerm: {
        priceRange: string;
        confidence: number;
        reasoning: string;
      };
      shortTerm: {
        priceRange: string;
        confidence: number;
        reasoning: string;
      };
    };
    exitPoints: {
      takeProfit: {
        level1: number;
        level2: number;
        level3: number;
      };
      stopLoss: {
        conservative: number;
        aggressive: number;
      };
    };
  };
  
  // Risk Management
  riskManagement: {
    overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    positionSize: {
      conservative: string;
      moderate: string;
      aggressive: string;
    };
    riskRewardRatio: number;
    keyRiskFactors: string[];
    mitigationStrategies: string[];
  };
  
  // Market Timing
  marketTiming: {
    optimalEntryWindow: string;
    catalysts: string[];
    warnings: string[];
    timeHorizon: string;
  };
  
  // Additional Insights
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  marketRegime: 'BULLISH' | 'BEARISH' | 'RANGING' | 'VOLATILE';
  breakoutPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  reasoning: string;
}

export interface EnhancedAIAnalysisConfig {
  providers: ('Z.AI' | 'ChatGPT')[];
  analysisTypes: ('multitimeframe' | 'entryexit' | 'riskmanagement')[];
  timeout: number;
  retryAttempts: number;
  enableFallback: boolean;
  enhancedDataCollection: boolean;
}

export interface AnalysisStatusMessage {
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  details?: string;
  providerStatus?: {
    zai: 'success' | 'failed' | 'not_available';
    chatgpt: 'success' | 'failed' | 'not_available';
  };
  fallbackUsed: boolean;
  timestamp: string;
}

export interface EnhancedAnalysisResponse {
  success: boolean;
  data?: EnhancedAIAnalysisResult;
  error?: string;
  fallbackUsed: boolean;
  providerStatus: {
    zai: 'success' | 'failed' | 'not_available';
    chatgpt: 'success' | 'failed' | 'not_available';
  };
  statusMessage: AnalysisStatusMessage;
  executionTime: number;
}

export class EnhancedAIAnalysisService {
  private static instance: EnhancedAIAnalysisService;
  private config: EnhancedAIAnalysisConfig;
  private zaiClient: any;
  private openaiClient: any;
  private cryptoService: CryptoDataService;
  private tradingSignalService: TradingSignalService;
  private demoMode: boolean = false;

  constructor(config?: Partial<EnhancedAIAnalysisConfig>) {
    this.config = {
      providers: ['Z.AI', 'ChatGPT'],
      analysisTypes: ['multitimeframe', 'entryexit', 'riskmanagement'],
      timeout: 45000,
      retryAttempts: 3,
      enableFallback: true,
      enhancedDataCollection: true,
      ...config
    };

    this.cryptoService = CryptoDataService.getInstance();
    this.tradingSignalService = TradingSignalService.getInstance();
    this.openaiClient = null;
  }

  static getInstance(config?: Partial<EnhancedAIAnalysisConfig>): EnhancedAIAnalysisService {
    if (!EnhancedAIAnalysisService.instance) {
      EnhancedAIAnalysisService.instance = new EnhancedAIAnalysisService(config);
    }
    return EnhancedAIAnalysisService.instance;
  }

  /**
   * Initialize enhanced AI clients
   */
  async initialize(): Promise<void> {
    console.log('🤖 Initializing Enhanced AI Analysis Service v2.0...');
    
    // Initialize OpenAI module
    await initializeOpenAI();
    
    // Check if we have any real API keys configured and OpenAI is available
    const hasOpenAIKey = OpenAI && hasApiKey('openai') && AI_CONFIG.openai.apiKey && !AI_CONFIG.openai.apiKey.includes('demo-');
    const hasZAIKey = hasApiKey('zai') && AI_CONFIG.zai.apiKey && !AI_CONFIG.zai.apiKey.includes('demo-');
    const hasAnyAIKey = hasOpenAIKey || hasZAIKey;
    
    if (!hasAnyAIKey) {
      console.warn('⚠️ No AI API keys configured or OpenAI not available. Using fallback mode with enhanced rule-based analysis.');
      this.demoMode = true;
      console.log('✅ Enhanced AI Analysis Service initialized in fallback mode');
      return;
    }
    
    // Initialize OpenAI client if available and not demo mode
    if (hasOpenAIKey) {
      this.openaiClient = new OpenAI({
        apiKey: AI_CONFIG.openai.apiKey,
        organization: AI_CONFIG.openai.orgId
      });
    }
    
    try {
      // Initialize Z.AI client
      if (hasZAIKey) {
        this.zaiClient = await ZAI.create();
        console.log('✅ Z.AI client initialized successfully');
      } else {
        console.warn('⚠️ Z.AI API key not configured or in demo mode');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize Z.AI client:', error.message);
      
      // Try to initialize with environment variables as fallback
      try {
        if (AI_CONFIG.zai.baseUrl && AI_CONFIG.zai.apiKey && !AI_CONFIG.zai.apiKey.includes('demo-')) {
          const ZAIClass = (await import('z-ai-web-dev-sdk')).default;
          this.zaiClient = new ZAIClass({
            baseUrl: AI_CONFIG.zai.baseUrl,
            apiKey: AI_CONFIG.zai.apiKey,
            chatId: AI_CONFIG.zai.chatId,
            userId: AI_CONFIG.zai.userId
          });
          console.log('✅ Z.AI client initialized from config');
        } else {
          console.warn('⚠️ Z.AI configuration not found or in demo mode');
        }
      } catch (fallbackError) {
        console.error('❌ Failed to initialize Z.AI client with config:', fallbackError);
      }
    }
    
    // Check OpenAI configuration
    if (!hasOpenAIKey) {
      console.warn('⚠️ OpenAI API key is not configured, not available, or in demo mode');
    } else {
      console.log('✅ OpenAI client configured');
    }
    
    console.log('✅ Enhanced AI Analysis Service v2.0 initialized successfully');
  }

  /**
   * Perform enhanced AI analysis with clear error handling
   */
  async performEnhancedAnalysis(
    coinId: string,
    analysisType: 'multitimeframe' | 'entryexit' | 'riskmanagement' = 'multitimeframe'
  ): Promise<EnhancedAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 Starting enhanced AI analysis for ${coinId} (${analysisType})...`);

      // If in demo mode, generate enhanced fallback analysis
      if (this.demoMode) {
        console.log(`🤖 Using fallback mode for ${coinId} enhanced analysis...`);
        const fallbackResult = await this.generateEnhancedFallbackAnalysis(coinId, analysisType);
        
        return {
          success: true,
          data: fallbackResult,
          fallbackUsed: true,
          providerStatus: {
            zai: 'not_available',
            chatgpt: 'not_available'
          },
          statusMessage: {
            type: 'warning',
            title: 'Phân Tích Fallback',
            message: 'Không có cấu hình AI API. Đang sử dụng phân tích nâng cao dựa trên quy tắc.',
            fallbackUsed: true,
            timestamp: new Date().toISOString()
          },
          executionTime: Date.now() - startTime
        };
      }

      // Step 1: Gather enhanced market data
      const enhancedMarketData = await this.gatherEnhancedMarketData(coinId);
      
      // Step 2: Generate enhanced analysis context
      const context = this.buildEnhancedAnalysisContext(coinId, enhancedMarketData);
      
      // Step 3: Execute analysis with clear error handling
      const analysisResult = await this.executeAnalysisWithClearErrorHandling(context, analysisType);
      
      const executionTime = Date.now() - startTime;
      
      return {
        ...analysisResult,
        executionTime,
        statusMessage: this.getAnalysisStatusMessage(analysisResult)
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ Error performing enhanced AI analysis:', error);
      
      // Generate fallback analysis
      try {
        const fallbackResult = await this.generateEnhancedFallbackAnalysis(coinId, analysisType);
        
        return {
          success: true,
          data: fallbackResult,
          fallbackUsed: true,
          providerStatus: {
            zai: 'failed',
            chatgpt: 'failed'
          },
          statusMessage: {
            type: 'error',
            title: 'Lỗi Phân Tích',
            message: `Lỗi phân tích AI: ${errorMessage}. Đang sử dụng dữ liệu fallback.`,
            details: errorMessage,
            fallbackUsed: true,
            timestamp: new Date().toISOString()
          },
          executionTime
        };
      } catch (fallbackError) {
        return {
          success: false,
          fallbackUsed: true,
          providerStatus: {
            zai: 'failed',
            chatgpt: 'failed'
          },
          statusMessage: {
            type: 'error',
            title: 'Lỗi Phân Tích',
            message: 'Tất cả các phương pháp phân tích đều thất bại. Vui lòng thử lại sau.',
            details: `Original error: ${errorMessage}. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`,
            fallbackUsed: true,
            timestamp: new Date().toISOString()
          },
          executionTime
        };
      }
    }
  }

  /**
   * Execute analysis with clear error handling and provider status tracking
   */
  private async executeAnalysisWithClearErrorHandling(
    context: EnhancedAIPromptContext,
    analysisType: 'multitimeframe' | 'entryexit' | 'riskmanagement' = 'multitimeframe'
  ): Promise<{
    success: boolean;
    data?: EnhancedAIAnalysisResult;
    error?: string;
    fallbackUsed: boolean;
    providerStatus: {
      zai: 'success' | 'failed' | 'not_available';
      chatgpt: 'success' | 'failed' | 'not_available';
    };
  }> {
    const providerStatus = {
      zai: 'not_available' as const,
      chatgpt: 'not_available' as const
    };
    
    let lastError: string | null = null;

    // Try Z.AI first
    if (this.zaiClient) {
      try {
        console.log(`🤖 [Z.AI] Attempting ${analysisType} analysis...`);
        const zaiResult = await this.executeEnhancedAIAnalysis('Z.AI', context, analysisType);
        providerStatus.zai = 'success';
        
        return {
          success: true,
          data: zaiResult,
          fallbackUsed: false,
          providerStatus
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Z.AI analysis failed';
        providerStatus.zai = 'failed';
        console.warn(`❌ [Z.AI] Analysis failed: ${lastError}`);
      }
    }

    // Try ChatGPT as fallback
    if (this.openaiClient) {
      try {
        console.log(`🤖 [ChatGPT] Attempting ${analysisType} analysis as fallback...`);
        const chatgptResult = await this.executeEnhancedAIAnalysis('ChatGPT', context, analysisType);
        providerStatus.chatgpt = 'success';
        
        return {
          success: true,
          data: chatgptResult,
          fallbackUsed: true,
          providerStatus
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'ChatGPT analysis failed';
        providerStatus.chatgpt = 'failed';
        console.warn(`❌ [ChatGPT] Analysis failed: ${lastError}`);
      }
    }

    // Ultimate fallback to rule-based analysis
    try {
      console.log(`🤖 [Rule-based] Generating enhanced fallback analysis...`);
      const fallbackResult = await this.generateEnhancedRuleBasedAnalysis(context, analysisType);
      
      return {
        success: true,
        data: fallbackResult,
        fallbackUsed: true,
        providerStatus
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Rule-based analysis failed';
      console.error(`❌ [Rule-based] Analysis failed: ${lastError}`);
      
      return {
        success: false,
        fallbackUsed: true,
        providerStatus,
        error: lastError
      };
    }
  }

  /**
   * Gather enhanced market data with 47+ indicators
   */
  private async gatherEnhancedMarketData(coinId: string) {
    const [completeData, tradingSignal] = await Promise.all([
      this.cryptoService.getCompleteCryptoData(coinId),
      this.getTradingSignalWithContext(coinId)
    ]);

    // Enhance data with additional metrics
    const enhancedData = {
      ...completeData,
      priceChange7d: completeData.price?.usd_7d_change || 0,
      priceChange30d: completeData.price?.usd_30d_change || 0,
      tradingSignal,
      // Add enhanced metrics
      volatility: this.calculateVolatility(completeData),
      networkGrowth: this.calculateNetworkGrowth(completeData),
      holderDistribution: this.calculateHolderDistribution(completeData),
      correlationWithBTC: this.calculateBTCCorrelation(completeData)
    };

    return enhancedData;
  }

  /**
   * Build enhanced analysis context organized by timeframe
   */
  private buildEnhancedAnalysisContext(coinId: string, marketData: any): EnhancedAIPromptContext {
    const coinNames: Record<string, string> = {
      bitcoin: 'Bitcoin',
      ethereum: 'Ethereum',
      binancecoin: 'Binance Coin',
      solana: 'Solana',
      chainlink: 'Chainlink'
    };

    return {
      coinId,
      coinName: coinNames[coinId] || coinId,
      currentPrice: marketData.price?.usd || 0,
      priceChange24h: marketData.price?.usd_24h_change || 0,
      priceChange7d: marketData.priceChange7d || 0,
      priceChange30d: marketData.priceChange30d || 0,
      marketCap: marketData.price?.usd_market_cap || 0,
      volume24h: marketData.price?.usd_24h_vol || 0,
      
      // Long-term metrics
      longTerm: {
        mvrv: marketData.onChain?.mvrv || 0,
        nupl: marketData.onChain?.nupl || 0,
        sopr: marketData.onChain?.sopr || 0,
        activeAddresses30d: marketData.onChain?.activeAddresses || 0,
        networkGrowth: marketData.networkGrowth || 0,
        holderDistribution: marketData.holderDistribution || 0,
        realizedCap: marketData.onChain?.realizedCap || 0,
        thermocapRatio: marketData.onChain?.thermocapRatio || 0,
        stockToFlow: marketData.onChain?.stockToFlow || 0,
        hodlWaves: marketData.onChain?.hodlWaves || []
      },
      
      // Medium-term metrics
      mediumTerm: {
        rsi: marketData.technical?.rsi || 50,
        ma50: marketData.technical?.ma50 || 0,
        ma200: marketData.technical?.ma200 || 0,
        macd: marketData.technical?.macd || 0,
        bollingerUpper: marketData.technical?.bollingerUpper || 0,
        bollingerLower: marketData.technical?.bollingerLower || 0,
        volumeProfile: marketData.technical?.volumeProfile || 0,
        priceChannels: {
          upper: marketData.technical?.priceChannelUpper || marketData.price?.usd * 1.05,
          lower: marketData.technical?.priceChannelLower || marketData.price?.usd * 0.95
        },
        marketStructure: this.determineMarketStructure(marketData),
        correlationWithBTC: marketData.correlationWithBTC || 0.8
      },
      
      // Short-term metrics
      shortTerm: {
        fearGreedIndex: marketData.sentiment?.fearGreedIndex || 50,
        fearGreedClassification: marketData.sentiment?.fearGreedClassification || 'Neutral',
        twitterSentiment: marketData.sentiment?.social?.twitterSentiment || 0.5,
        redditSentiment: marketData.sentiment?.social?.redditSentiment || 0.5,
        socialVolume: marketData.sentiment?.social?.socialVolume || 0,
        newsSentiment: marketData.sentiment?.news?.newsSentiment || 0.5,
        newsVolume: marketData.sentiment?.news?.newsVolume || 0,
        googleTrendsScore: marketData.sentiment?.googleTrends?.trendsScore || 50,
        googleTrendsDirection: marketData.sentiment?.googleTrends?.trendDirection || 'stable',
        fundingRate: marketData.derivatives?.fundingRate || 0,
        openInterest: marketData.derivatives?.openInterest || 0,
        liquidationVolume: marketData.derivatives?.liquidationVolume || 0,
        putCallRatio: marketData.derivatives?.putCallRatio || 1,
        tradingSignal: marketData.tradingSignal?.signal || 'HOLD',
        signalConfidence: marketData.tradingSignal?.confidence || 50,
        signalRisk: marketData.tradingSignal?.riskLevel || 'MEDIUM',
        volatility: marketData.volatility || 0,
        orderBookDepth: {
          bids: marketData.orderBook?.bids || 0,
          asks: marketData.orderBook?.asks || 0
        }
      }
    };
  }

  /**
   * Execute enhanced AI analysis
   */
  private async executeEnhancedAIAnalysis(
    provider: 'Z.AI' | 'ChatGPT', 
    context: EnhancedAIPromptContext, 
    analysisType: 'multitimeframe' | 'entryexit' | 'riskmanagement'
  ): Promise<EnhancedAIAnalysisResult> {
    const prompt = this.getEnhancedAnalysisPrompt(context, analysisType);
    
    const maxRetries = this.config.retryAttempts;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.callEnhancedAIProvider(provider, prompt);
        const parsedResponse = this.parseEnhancedAIResponse(response, provider, analysisType);
        
        return {
          ...parsedResponse,
          provider,
          analysisType: analysisType === 'multitimeframe' ? 'MULTI_TIMEFRAME' : 
                        analysisType === 'entryexit' ? 'SHORT_TERM' : 'LONG_TERM'
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt} failed for ${provider} ${analysisType} analysis:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw lastError || new Error(`All retry attempts failed for ${provider} ${analysisType} analysis`);
  }

  /**
   * Get enhanced analysis prompt based on type
   */
  private getEnhancedAnalysisPrompt(context: EnhancedAIPromptContext, analysisType: string): string {
    switch (analysisType) {
      case 'multitimeframe':
        return this.getMultiTimeframeAnalysisPrompt(context);
      case 'entryexit':
        return this.getEntryExitAnalysisPrompt(context);
      case 'riskmanagement':
        return this.getRiskManagementAnalysisPrompt(context);
      default:
        return this.getMultiTimeframeAnalysisPrompt(context);
    }
  }

  /**
   * Multi-timeframe analysis prompt
   */
  private getMultiTimeframeAnalysisPrompt(context: EnhancedAIPromptContext): string {
    return `Bạn là một chuyên gia phân tích thị trường tiền điện tử hàng đầu với 15+ năm kinh nghiệm. 
Hãy thực hiện phân tích đa khung thời gian chi tiết cho ${context.coinName} (${context.coinId.toUpperCase()}) dựa trên dữ liệu sau:

**TỔNG QUAN THỊ TRƯỜNG:**
- Giá hiện tại: $${context.currentPrice.toLocaleString()}
- Thay đổi 24h: ${context.priceChange24h > 0 ? '+' : ''}${context.priceChange24h.toFixed(2)}%
- Thay đổi 7 ngày: ${context.priceChange7d > 0 ? '+' : ''}${context.priceChange7d.toFixed(2)}%
- Thay đổi 30 ngày: ${context.priceChange30d > 0 ? '+' : ''}${context.priceChange30d.toFixed(2)}%
- Market Cap: $${(context.marketCap / 1000000000).toFixed(1)}B
- Volume 24h: $${(context.volume24h / 1000000000).toFixed(1)}B

**PHÂN TÍCH DÀI HẠN (6-12 THÁNG):**
- MVRV Ratio: ${context.longTerm.mvrv.toFixed(2)} (${context.longTerm.mvrv < 1 ? 'Định giá thấp' : context.longTerm.mvrv < 1.5 ? 'Định giá hợp lý' : context.longTerm.mvrv < 2 ? 'Định giá cao' : 'Định giá rất cao'})
- NUPL: ${context.longTerm.nupl.toFixed(2)} (${context.longTerm.nupl < 0 ? 'Đầu hàng' : context.longTerm.nupl < 0.5 ? 'Hy vọng' : context.longTerm.nupl < 0.75 ? 'Tích cực' : 'Hưng phấn'})
- SOPR: ${context.longTerm.sopr.toFixed(2)} (${context.longTerm.sopr < 1 ? 'Bán thua lỗ' : 'Chốt lời'})
- Địa chỉ hoạt động 30 ngày: ${context.longTerm.activeAddresses30d.toLocaleString()}
- Tăng trưởng mạng lưới: ${context.longTerm.networkGrowth > 0 ? '+' : ''}${context.longTerm.networkGrowth.toFixed(2)}%
- Phân phối nắm giữ: Top 10% nắm giữ ${context.longTerm.holderDistribution.toFixed(1)}%

**PHÂN TÍCH TRUNG HẠN (1-3 THÁNG):**
- RSI: ${context.mediumTerm.rsi.toFixed(1)} (${context.mediumTerm.rsi >= 70 ? 'Quá mua' : context.mediumTerm.rsi <= 30 ? 'Quá bán' : 'Trung tính'})
- MA50 vs MA200: ${context.mediumTerm.ma50 > context.mediumTerm.ma200 ? 'Golden Cross (Tích cực)' : 'Death Cross (Tiêu cực)'} (MA50: $${context.mediumTerm.ma50.toLocaleString()}, MA200: $${context.mediumTerm.ma200.toLocaleString()})
- MACD: ${context.mediumTerm.macd > 0 ? 'Tích cực' : 'Tiêu cực'} (${context.mediumTerm.macd.toFixed(2)})
- Cấu trúc thị trường: ${context.mediumTerm.marketStructure}

**PHÂN TÍCH NGẮN HẠN (1-4 TUẦN):**
- Fear & Greed Index: ${context.shortTerm.fearGreedIndex} (${context.shortTerm.fearGreedClassification})
- Funding Rate: ${(context.shortTerm.fundingRate * 100).toFixed(3)}% (${context.shortTerm.fundingRate > 0 ? 'Long trả Short' : 'Short trả Long'})
- Open Interest: $${(context.shortTerm.openInterest / 1000000000).toFixed(1)}B
- Tín hiệu giao dịch: ${context.shortTerm.tradingSignal}
- Độ tin cậy: ${context.shortTerm.signalConfidence}%

Hãy cung cấp phân tích chi tiết theo định dạng JSON sau:
{
  "trendAnalysis": {
    "longTerm": {
      "trend": "BULLISH|BEARISH|NEUTRAL",
      "confidence": 0-100,
      "reasoning": "lý do chi tiết",
      "keyDrivers": ["động lực 1", "động lực 2", "động lực 3"]
    },
    "mediumTerm": {
      "trend": "BULLISH|BEARISH|NEUTRAL",
      "confidence": 0-100,
      "reasoning": "lý do chi tiết",
      "keyDrivers": ["động lực 1", "động lực 2", "động lực 3"]
    },
    "shortTerm": {
      "trend": "BULLISH|BEARISH|NEUTRAL",
      "confidence": 0-100,
      "reasoning": "lý do chi tiết",
      "keyDrivers": ["động lực 1", "động lực 2", "động lực 3"]
    }
  },
  "tradingRecommendations": {
    "overallSignal": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
    "entryPoints": {
      "longTerm": {
        "priceRange": "khoảng giá",
        "confidence": 0-100,
        "reasoning": "lý do"
      },
      "mediumTerm": {
        "priceRange": "khoảng giá",
        "confidence": 0-100,
        "reasoning": "lý do"
      },
      "shortTerm": {
        "priceRange": "khoảng giá",
        "confidence": 0-100,
        "reasoning": "lý do"
      }
    },
    "exitPoints": {
      "takeProfit": {
        "level1": số,
        "level2": số,
        "level3": số
      },
      "stopLoss": {
        "conservative": số,
        "aggressive": số
      }
    }
  },
  "riskManagement": {
    "overallRiskLevel": "LOW|MEDIUM|HIGH",
    "positionSize": {
      "conservative": "1-5%",
      "moderate": "6-10%",
      "aggressive": "11-15%"
    },
    "riskRewardRatio": số,
    "keyRiskFactors": ["rủi ro 1", "rủi ro 2", "rủi ro 3"],
    "mitigationStrategies": ["chiến lược 1", "chiến lược 2", "chiến lược 3"]
  },
  "marketTiming": {
    "optimalEntryWindow": "cửa sổ thời gian",
    "catalysts": ["chất xúc tác 1", "chất xúc tác 2"],
    "warnings": ["cảnh báo 1", "cảnh báo 2"],
    "timeHorizon": "khung thời gian đầu tư đề xuất"
  },
  "keyLevels": {
    "support": [mức1, mức2, mức3],
    "resistance": [mức1, mức2, mức3]
  },
  "marketRegime": "BULLISH|BEARISH|RANGING|VOLATILE",
  "breakoutPotential": "HIGH|MEDIUM|LOW",
  "confidence": 0-100,
  "reasoning": "lý do tổng hợp"
}`;
  }

  /**
   * Entry-Exit analysis prompt
   */
  private getEntryExitAnalysisPrompt(context: EnhancedAIPromptContext): string {
    return `Bạn là một chuyên gia giao dịch tiền điện tử chuyên nghiệp. Hãy phân tích chi tiết các điểm vào và thoát lệnh cho ${context.coinName}:

**THÔNG TIN HIỆN TẠI:**
- Giá hiện tại: $${context.currentPrice.toLocaleString()}
- Biến động 24h: ${context.priceChange24h > 0 ? '+' : ''}${context.priceChange24h.toFixed(2)}%

**PHÂN TÍCH KỸ THUẬT:**
- RSI: ${context.mediumTerm.rsi.toFixed(1)} (${context.mediumTerm.rsi >= 70 ? 'Quá mua' : context.mediumTerm.rsi <= 30 ? 'Quá bán' : 'Trung tính'})
- MA50: $${context.mediumTerm.ma50.toLocaleString()}
- MA200: $${context.mediumTerm.ma200.toLocaleString()}
- Bollinger Bands: Upper $${context.mediumTerm.bollingerUpper.toLocaleString()}, Lower $${context.mediumTerm.bollingerLower.toLocaleString()}

**THỊ TRƯỜNG NGẮN HẠN:**
- Fear & Greed: ${context.shortTerm.fearGreedIndex} (${context.shortTerm.fearGreedClassification})
- Funding Rate: ${(context.shortTerm.fundingRate * 100).toFixed(3)}%
- Tín hiệu hiện tại: ${context.shortTerm.tradingSignal}

Hãy xác định điểm vào/thoát lệnh theo định dạng JSON:
{
  "entryPoints": {
    "optimalRange": "khoảng giá",
    "confidence": 0-100,
    "reasoning": "lý do chi tiết",
    "timing": "thời điểm đề xuất"
  },
  "stopLoss": {
    "conservative": {
      "level": số,
      "reasoning": "lý do",
      "distancePercent": số
    },
    "aggressive": {
      "level": số,
      "reasoning": "lý do",
      "distancePercent": số
    }
  },
  "takeProfit": {
    "level1": {
      "target": số,
      "reasoning": "lý do",
      "rewardRatio": số
    },
    "level2": {
      "target": số,
      "reasoning": "lý do",
      "rewardRatio": số
    },
    "level3": {
      "target": số,
      "reasoning": "lý do",
      "rewardRatio": số
    }
  },
  "positionManagement": {
    "recommendedSize": "ví dụ: 2-3%",
    "riskRewardRatio": số,
    "scalingStrategy": "chiến lược scaling"
  },
  "marketTiming": {
    "optimalWindow": "cửa sổ thời gian",
    "catalysts": ["chất xúc tác"],
    "warnings": ["cảnh báo"]
  },
  "confidence": 0-100,
  "overallAssessment": "đánh giá tổng thể"
}`;
  }

  /**
   * Risk management analysis prompt
   */
  private getRiskManagementAnalysisPrompt(context: EnhancedAIPromptContext): string {
    return `Bạn là một chuyên gia quản lý rủi ro trong giao dịch tiền điện tử. Hãy đánh giá rủi ro chi tiết cho ${context.coinName}:

**THÔNG TIN RỦI RO HIỆN TẠI:**
- Giá hiện tại: $${context.currentPrice.toLocaleString()}
- Biến động: ${context.shortTerm.volatility.toFixed(2)}%

**RỦI RO DÀI HẠN:**
- MVRV: ${context.longTerm.mvrv.toFixed(2)} (${context.longTerm.mvrv > 2 ? 'Cao' : context.longTerm.mvrv > 1.5 ? 'Trung bình' : 'Thấp'})
- NUPL: ${context.longTerm.nupl.toFixed(2)} (${context.longTerm.nupl > 0.75 ? 'Cao' : context.longTerm.nupl > 0.5 ? 'Trung bình' : 'Thấp'})

**RỦI RO TRUNG HẠN:**
- RSI: ${context.mediumTerm.rsi.toFixed(1)} (${context.mediumTerm.rsi >= 70 || context.mediumTerm.rsi <= 30 ? 'Cực đoan' : 'Bình thường'})
- Cấu trúc thị trường: ${context.mediumTerm.marketStructure}

**RỦI RO NGẮN HẠN:**
- Fear & Greed: ${context.shortTerm.fearGreedIndex} (${context.shortTerm.fearGreedIndex >= 80 || context.shortTerm.fearGreedIndex <= 20 ? 'Cực đoan' : 'Bình thường'})
- Funding Rate: ${(context.shortTerm.fundingRate * 100).toFixed(3)}%

Hãy phân tích rủi ro theo định dạng JSON:
{
  "overallRiskAssessment": {
    "riskLevel": "LOW|MEDIUM|HIGH",
    "riskScore": 0-100,
    "reasoning": "lý do chi tiết"
  },
  "keyRiskFactors": [
    {
      "factor": "tên rủi ro",
      "level": "LOW|MEDIUM|HIGH",
      "probability": 0-100,
      "impact": "thấp/trung bình/cao",
      "description": "mô tả chi tiết"
    }
  ],
  "positionSizing": {
    "conservative": {
      "percentage": "1-5%",
      "reasoning": "lý do"
    },
    "moderate": {
      "percentage": "6-10%",
      "reasoning": "lý do"
    },
    "aggressive": {
      "percentage": "11-15%",
      "reasoning": "lý do"
    }
  },
  "riskMitigation": {
    "diversification": "chiến lược đa dạng hóa",
    "hedging": "chiến lược phòng ngừa",
    "stopLoss": "chiến lược stop loss",
    "takeProfit": "chiến lược chốt lời"
  },
  "recommendations": ["khuyến nghị 1", "khuyến nghị 2", "khuyến nghị 3"],
  "confidence": 0-100
}`;
  }

  /**
   * Call enhanced AI provider
   */
  private async callEnhancedAIProvider(provider: 'Z.AI' | 'ChatGPT', prompt: string): Promise<string> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Enhanced AI analysis timeout')), this.config.timeout);
    });

    const analysisPromise = this.executeEnhancedAIProviderCall(provider, prompt);

    return Promise.race([analysisPromise, timeoutPromise]) as Promise<string>;
  }

  /**
   * Execute enhanced AI provider call
   */
  private async executeEnhancedAIProviderCall(provider: 'Z.AI' | 'ChatGPT', prompt: string): Promise<string> {
    if (provider === 'Z.AI') {
      if (!this.zaiClient) {
        throw new Error('Z.AI client not available');
      }
      
      try {
        const completion = await this.zaiClient.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'Bạn là chuyên gia phân tích tiền điện tử hàng đầu. Phản hồi phải là JSON hợp lệ.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });

        return completion.choices[0]?.message?.content || '';
      } catch (error) {
        console.warn(`⚠️ Z.AI API call failed:`, error.message);
        throw error;
      }
    } else if (provider === 'ChatGPT') {
      if (!OpenAI || !this.openaiClient) {
        throw new Error('OpenAI client not available');
      }
      
      try {
        const completion = await this.openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Bạn là chuyên gia phân tích tiền điện tử hàng đầu. Phản hồi phải là JSON hợp lệ.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });

        return completion.choices[0]?.message?.content || '';
      } catch (error) {
        console.warn(`⚠️ ChatGPT API call failed:`, error.message);
        throw error;
      }
    }

    throw new Error(`Unknown provider: ${provider}`);
  }

  /**
   * Parse enhanced AI response
   */
  private parseEnhancedAIResponse(response: string, provider: string, analysisType: string): EnhancedAIAnalysisResult {
    try {
      const parsed = JSON.parse(response);
      
      // Validate and transform response to match expected format
      return {
        provider: provider as 'Z.AI' | 'ChatGPT',
        analysisType: analysisType === 'multitimeframe' ? 'MULTI_TIMEFRAME' : 
                    analysisType === 'entryexit' ? 'SHORT_TERM' : 'LONG_TERM',
        trendAnalysis: parsed.trendAnalysis || this.getDefaultTrendAnalysis(),
        tradingRecommendations: parsed.tradingRecommendations || this.getDefaultTradingRecommendations(),
        riskManagement: parsed.riskManagement || this.getDefaultRiskManagement(),
        marketTiming: parsed.marketTiming || this.getDefaultMarketTiming(),
        keyLevels: parsed.keyLevels || { support: [], resistance: [] },
        marketRegime: parsed.marketRegime || 'RANGING',
        breakoutPotential: parsed.breakoutPotential || 'MEDIUM',
        confidence: parsed.confidence || 50,
        reasoning: parsed.reasoning || 'Phân tích từ ' + provider
      };
    } catch (error) {
      console.warn(`Failed to parse ${provider} response:`, error);
      throw new Error(`Invalid JSON response from ${provider}`);
    }
  }

  /**
   * Generate enhanced rule-based analysis
   */
  private async generateEnhancedRuleBasedAnalysis(
    context: EnhancedAIPromptContext, 
    analysisType: 'multitimeframe' | 'entryexit' | 'riskmanagement'
  ): Promise<EnhancedAIAnalysisResult> {
    // Generate rule-based analysis based on market data
    const overallSignal = this.generateRuleBasedSignal(context);
    const riskLevel = this.assessRiskLevel(context);
    
    return {
      provider: 'RULE_BASED',
      analysisType: analysisType === 'multitimeframe' ? 'MULTI_TIMEFRAME' : 
                  analysisType === 'entryexit' ? 'SHORT_TERM' : 'LONG_TERM',
      trendAnalysis: this.generateRuleBasedTrendAnalysis(context),
      tradingRecommendations: this.generateRuleBasedTradingRecommendations(context, overallSignal),
      riskManagement: this.generateRuleBasedRiskManagement(context, riskLevel),
      marketTiming: this.generateRuleBasedMarketTiming(context),
      keyLevels: this.generateRuleBasedKeyLevels(context),
      marketRegime: this.determineMarketStructureFromContext(context),
      breakoutPotential: this.assessBreakoutPotential(context),
      confidence: this.calculateRuleBasedConfidence(context),
      reasoning: 'Phân tích dựa trên quy tắc và chỉ báo thị trường hiện tại.'
    };
  }

  /**
   * Generate enhanced fallback analysis
   */
  private async generateEnhancedFallbackAnalysis(
    coinId: string, 
    analysisType: 'multitimeframe' | 'entryexit' | 'riskmanagement'
  ): Promise<EnhancedAIAnalysisResult> {
    // Generate fallback analysis when no AI is available
    return {
      provider: 'RULE_BASED',
      analysisType: analysisType === 'multitimeframe' ? 'MULTI_TIMEFRAME' : 
                  analysisType === 'entryexit' ? 'SHORT_TERM' : 'LONG_TERM',
      trendAnalysis: {
        longTerm: { trend: 'NEUTRAL', confidence: 50, reasoning: 'Không đủ dữ liệu dài hạn', keyDrivers: [] },
        mediumTerm: { trend: 'NEUTRAL', confidence: 50, reasoning: 'Không đủ dữ liệu trung hạn', keyDrivers: [] },
        shortTerm: { trend: 'NEUTRAL', confidence: 50, reasoning: 'Không đủ dữ liệu ngắn hạn', keyDrivers: [] }
      },
      tradingRecommendations: {
        overallSignal: 'HOLD',
        entryPoints: {
          longTerm: { priceRange: 'Chờ tín hiệu', confidence: 30, reasoning: 'Cần thêm dữ liệu' },
          mediumTerm: { priceRange: 'Chờ tín hiệu', confidence: 30, reasoning: 'Cần thêm dữ liệu' },
          shortTerm: { priceRange: 'Chờ tín hiệu', confidence: 30, reasoning: 'Cần thêm dữ liệu' }
        },
        exitPoints: {
          takeProfit: { level1: 0, level2: 0, level3: 0 },
          stopLoss: { conservative: 0, aggressive: 0 }
        }
      },
      riskManagement: {
        overallRiskLevel: 'MEDIUM',
        positionSize: { conservative: '1-2%', moderate: '3-5%', aggressive: '6-8%' },
        riskRewardRatio: 1.5,
        keyRiskFactors: ['Thiếu dữ liệu thị trường', 'Không có kết nối AI'],
        mitigationStrategies: ['Chờ kết nối AI', 'Sử dụng dữ liệu lịch sử']
      },
      marketTiming: {
        optimalEntryWindow: 'Chờ tín hiệu rõ ràng',
        catalysts: ['Cần kết nối AI', 'Cần dữ liệu thị trường'],
        warnings: ['Phân tích hạn chế do thiếu dữ liệu'],
        timeHorizon: 'Ngắn hạn'
      },
      keyLevels: { support: [], resistance: [] },
      marketRegime: 'RANGING',
      breakoutPotential: 'LOW',
      confidence: 30,
      reasoning: 'Phân tích fallback do không có kết nối AI. Khuyến nghị chờ kết nối để có phân tích chính xác hơn.'
    };
  }

  /**
   * Get analysis status message for dashboard
   */
  private getAnalysisStatusMessage(analysisResult: any): AnalysisStatusMessage {
    const timestamp = new Date().toISOString();
    
    if (!analysisResult.success) {
      return {
        type: 'error',
        title: 'Lỗi Phân Tích',
        message: 'Không thể thực hiện phân tích. Vui lòng thử lại sau.',
        details: analysisResult.error,
        providerStatus: analysisResult.providerStatus,
        fallbackUsed: analysisResult.fallbackUsed,
        timestamp
      };
    }
    
    if (analysisResult.fallbackUsed) {
      const failedProviders = [];
      if (analysisResult.providerStatus.zai === 'failed') failedProviders.push('Z.AI');
      if (analysisResult.providerStatus.chatgpt === 'failed') failedProviders.push('ChatGPT');
      
      return {
        type: 'warning',
        title: 'Phân Tích Fallback',
        message: `Lỗi kết nối với ${failedProviders.join(', ')}. Đang sử dụng dữ liệu fallback.`,
        details: analysisResult.error,
        providerStatus: analysisResult.providerStatus,
        fallbackUsed: true,
        timestamp
      };
    }
    
    return {
      type: 'success',
      title: 'Phân Tích Thành Công',
      message: 'Phân tích AI đã được thực hiện thành công.',
      providerStatus: analysisResult.providerStatus,
      fallbackUsed: false,
      timestamp
    };
  }

  // Helper methods for rule-based analysis
  private getTradingSignalWithContext(coinId: string): Promise<any> {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';
    
    return fetch(`${baseUrl}/api/trading-signals?action=signal&coinId=${coinId}`)
      .then(response => response.json())
      .then(data => data.signal)
      .catch(() => ({ signal: 'HOLD', confidence: 50, riskLevel: 'MEDIUM' }));
  }

  private calculateVolatility(data: any): number {
    // Simple volatility calculation based on price changes
    return Math.abs(data.price?.usd_24h_change || 0);
  }

  private calculateNetworkGrowth(data: any): number {
    // Simple network growth calculation
    return (data.onChain?.activeAddresses || 0) > 0 ? 5 : 0;
  }

  private calculateHolderDistribution(data: any): number {
    // Simple holder distribution calculation
    return 65; // Default value
  }

  private calculateBTCCorrelation(data: any): number {
    // Simple BTC correlation calculation
    return 0.8; // Default positive correlation
  }

  private determineMarketStructure(data: any): 'BULLISH' | 'BEARISH' | 'RANGING' {
    const price = data.price?.usd || 0;
    const ma50 = data.technical?.ma50 || price;
    const ma200 = data.technical?.ma200 || price;
    
    if (price > ma50 && ma50 > ma200) return 'BULLISH';
    if (price < ma50 && ma50 < ma200) return 'BEARISH';
    return 'RANGING';
  }

  private generateRuleBasedSignal(context: EnhancedAIPromptContext): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' {
    const rsi = context.mediumTerm.rsi;
    const priceChange = context.priceChange24h;
    
    if (rsi >= 70 && priceChange > 5) return 'STRONG_SELL';
    if (rsi <= 30 && priceChange < -5) return 'STRONG_BUY';
    if (rsi >= 60 && priceChange > 2) return 'SELL';
    if (rsi <= 40 && priceChange < -2) return 'BUY';
    return 'HOLD';
  }

  private assessRiskLevel(context: EnhancedAIPromptContext): 'LOW' | 'MEDIUM' | 'HIGH' {
    const volatility = context.shortTerm.volatility;
    const rsi = context.mediumTerm.rsi;
    
    if (volatility > 10 || rsi >= 70 || rsi <= 30) return 'HIGH';
    if (volatility > 5 || rsi >= 60 || rsi <= 40) return 'MEDIUM';
    return 'LOW';
  }

  private generateRuleBasedTrendAnalysis(context: EnhancedAIPromptContext) {
    return {
      longTerm: {
        trend: 'NEUTRAL' as const,
        confidence: 50,
        reasoning: 'Phân tích dựa trên dữ liệu hiện có',
        keyDrivers: ['Dữ liệu thị trường', 'Chỉ báo kỹ thuật']
      },
      mediumTerm: {
        trend: this.determineMarketStructureFromContext(context),
        confidence: 60,
        reasoning: 'Dựa trên cấu trúc thị trường hiện tại',
        keyDrivers: ['MA50/MA200', 'RSI']
      },
      shortTerm: {
        trend: this.generateRuleBasedSignal(context) === 'BUY' || this.generateRuleBasedSignal(context) === 'STRONG_BUY' ? 'BULLISH' : 'BEARISH',
        confidence: 55,
        reasoning: 'Dựa trên tín hiệu ngắn hạn',
        keyDrivers: ['RSI', 'Biến động giá']
      }
    };
  }

  private generateRuleBasedTradingRecommendations(context: EnhancedAIPromptContext, signal: string) {
    const currentPrice = context.currentPrice;
    
    return {
      overallSignal: signal,
      entryPoints: {
        longTerm: {
          priceRange: `$${(currentPrice * 0.95).toLocaleString()} - $${(currentPrice * 1.05).toLocaleString()}`,
          confidence: 50,
          reasoning: 'Khoảng giá hợp lý dựa trên biến động hiện tại'
        },
        mediumTerm: {
          priceRange: `$${(currentPrice * 0.98).toLocaleString()} - $${(currentPrice * 1.02).toLocaleString()}`,
          confidence: 60,
          reasoning: 'Khoảng giá ngắn hạn dựa trên kỹ thuật'
        },
        shortTerm: {
          priceRange: `$${currentPrice.toLocaleString()}`,
          confidence: 70,
          reasoning: 'Giá hiện tại là điểm vào hợp lý'
        }
      },
      exitPoints: {
        takeProfit: {
          level1: currentPrice * 1.05,
          level2: currentPrice * 1.10,
          level3: currentPrice * 1.15
        },
        stopLoss: {
          conservative: currentPrice * 0.95,
          aggressive: currentPrice * 0.90
        }
      }
    };
  }

  private generateRuleBasedRiskManagement(context: EnhancedAIPromptContext, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') {
    return {
      overallRiskLevel: riskLevel,
      positionSize: {
        conservative: riskLevel === 'HIGH' ? '1-2%' : riskLevel === 'MEDIUM' ? '2-3%' : '3-5%',
        moderate: riskLevel === 'HIGH' ? '2-3%' : riskLevel === 'MEDIUM' ? '3-5%' : '5-7%',
        aggressive: riskLevel === 'HIGH' ? '3-5%' : riskLevel === 'MEDIUM' ? '5-7%' : '7-10%'
      },
      riskRewardRatio: riskLevel === 'HIGH' ? 2.0 : riskLevel === 'MEDIUM' ? 1.5 : 1.2,
      keyRiskFactors: ['Biến động thị trường', 'Rủi ro hệ thống'],
      mitigationStrategies: ['Diversification', 'Stop loss chặt chẽ']
    };
  }

  private generateRuleBasedMarketTiming(context: EnhancedAIPromptContext) {
    return {
      optimalEntryWindow: 'Trong 24-48 giờ tới',
      catalysts: ['Cập nhật thị trường', 'Tin tức ngành'],
      warnings: ['Biến động ngắn hạn', 'Rủi ro hệ thống'],
      timeHorizon: '1-4 tuần'
    };
  }

  private generateRuleBasedKeyLevels(context: EnhancedAIPromptContext) {
    const currentPrice = context.currentPrice;
    return {
      support: [currentPrice * 0.95, currentPrice * 0.90, currentPrice * 0.85],
      resistance: [currentPrice * 1.05, currentPrice * 1.10, currentPrice * 1.15]
    };
  }

  private determineMarketStructureFromContext(context: EnhancedAIPromptContext): 'BULLISH' | 'BEARISH' | 'RANGING' | 'VOLATILE' {
    return context.mediumTerm.marketStructure;
  }

  private assessBreakoutPotential(context: EnhancedAIPromptContext): 'HIGH' | 'MEDIUM' | 'LOW' {
    const volatility = context.shortTerm.volatility;
    if (volatility > 8) return 'HIGH';
    if (volatility > 4) return 'MEDIUM';
    return 'LOW';
  }

  private calculateRuleBasedConfidence(context: EnhancedAIPromptContext): number {
    const rsi = context.mediumTerm.rsi;
    const volatility = context.shortTerm.volatility;
    
    let confidence = 50;
    
    // Adjust confidence based on RSI
    if (rsi >= 70 || rsi <= 30) confidence += 10;
    else if (rsi >= 60 || rsi <= 40) confidence += 5;
    
    // Adjust confidence based on volatility
    if (volatility > 10) confidence -= 10;
    else if (volatility > 5) confidence -= 5;
    
    return Math.max(20, Math.min(90, confidence));
  }

  // Default values for parsing
  private getDefaultTrendAnalysis() {
    return {
      longTerm: { trend: 'NEUTRAL', confidence: 50, reasoning: 'Default analysis', keyDrivers: [] },
      mediumTerm: { trend: 'NEUTRAL', confidence: 50, reasoning: 'Default analysis', keyDrivers: [] },
      shortTerm: { trend: 'NEUTRAL', confidence: 50, reasoning: 'Default analysis', keyDrivers: [] }
    };
  }

  private getDefaultTradingRecommendations() {
    return {
      overallSignal: 'HOLD',
      entryPoints: {
        longTerm: { priceRange: 'N/A', confidence: 50, reasoning: 'Default' },
        mediumTerm: { priceRange: 'N/A', confidence: 50, reasoning: 'Default' },
        shortTerm: { priceRange: 'N/A', confidence: 50, reasoning: 'Default' }
      },
      exitPoints: {
        takeProfit: { level1: 0, level2: 0, level3: 0 },
        stopLoss: { conservative: 0, aggressive: 0 }
      }
    };
  }

  private getDefaultRiskManagement() {
    return {
      overallRiskLevel: 'MEDIUM',
      positionSize: { conservative: '1-5%', moderate: '6-10%', aggressive: '11-15%' },
      riskRewardRatio: 1.5,
      keyRiskFactors: ['Default risk factors'],
      mitigationStrategies: ['Default strategies']
    };
  }

  private getDefaultMarketTiming() {
    return {
      optimalEntryWindow: 'Default timing',
      catalysts: ['Default catalysts'],
      warnings: ['Default warnings'],
      timeHorizon: 'Default horizon'
    };
  }
}