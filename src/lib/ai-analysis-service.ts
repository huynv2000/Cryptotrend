/**
 * AI Analysis Service for Crypto Market Insights
 * Integrates Z.AI and ChatGPT for comprehensive market analysis
 */

import ZAI from 'z-ai-web-dev-sdk';
import { AIPromptTemplates, AIPromptContext, AIAnalysisResult } from './ai-prompts';
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
      console.warn('⚠️ OpenAI module not available. AI analysis will use demo mode or fallback.');
      openAIInitialized = true;
    }
  }
}

export interface AIAnalysisConfig {
  providers: ('Z.AI' | 'ChatGPT')[];
  analysisTypes: ('comprehensive' | 'quick' | 'breakout' | 'risk')[];
  timeout: number; // in milliseconds
  retryAttempts: number;
}

export interface ConsolidatedAIAnalysis {
  timestamp: Date;
  coinId: string;
  overallRecommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  overallConfidence: number;
  consensusScore: number; // 0-100, how much AI providers agree
  providers: {
    'Z.AI'?: AIAnalysisResult;
    'ChatGPT'?: AIAnalysisResult;
  };
  summary: {
    trendAnalysis: string;
    keyInsights: string[];
    riskAssessment: string;
    opportunityHighlights: string[];
  };
  marketRegime: 'BULLISH' | 'BEARISH' | 'RANGING' | 'VOLATILE';
  timeHorizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  actionPlan: {
    immediate: string;
    shortTerm: string;
    mediumTerm: string;
  };
}

export class AIAnalysisService {
  private static instance: AIAnalysisService;
  private config: AIAnalysisConfig;
  private zaiClient: any;
  private openaiClient: OpenAI;
  private cryptoService: CryptoDataService;
  private tradingSignalService: TradingSignalService;
  private demoMode: boolean = false;

  constructor(config?: Partial<AIAnalysisConfig>) {
    this.config = {
      providers: ['Z.AI', 'ChatGPT'],
      analysisTypes: ['comprehensive', 'breakout'],
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };

    this.cryptoService = CryptoDataService.getInstance();
    this.tradingSignalService = TradingSignalService.getInstance();
    
    // Initialize OpenAI client (will be set during initialization)
    this.openaiClient = null;
  }

  static getInstance(config?: Partial<AIAnalysisConfig>): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService(config);
    }
    return AIAnalysisService.instance;
  }

  /**
   * Initialize AI clients
   */
  async initialize(): Promise<void> {
    console.log('🤖 Initializing AI Analysis Service...');
    
    // Initialize OpenAI module
    await initializeOpenAI();
    
    // Check if we have any real API keys configured and OpenAI is available
    const hasOpenAIKey = OpenAI && hasApiKey('openai') && AI_CONFIG.openai.apiKey && !AI_CONFIG.openai.apiKey.includes('demo-');
    const hasZAIKey = hasApiKey('zai') && AI_CONFIG.zai.apiKey && !AI_CONFIG.zai.apiKey.includes('demo-');
    const hasAnyAIKey = hasOpenAIKey || hasZAIKey;
    
    if (!hasAnyAIKey) {
      console.warn('⚠️ No AI API keys configured or OpenAI not available. Using demo mode with sample data.');
      this.demoMode = true;
      console.log('✅ AI Analysis Service initialized in demo mode');
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
          // Create a custom ZAI instance with environment variables
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
        // Continue without Z.AI if both methods fail
      }
    }
    
    // Check OpenAI configuration
    if (!hasOpenAIKey) {
      console.warn('⚠️ OpenAI API key is not configured, not available, or in demo mode');
    } else {
      console.log('✅ OpenAI client configured');
    }
    
    console.log('✅ AI Analysis Service initialized successfully');
  }

  /**
   * Perform comprehensive AI analysis for a cryptocurrency
   */
  async performAnalysis(coinId: string): Promise<ConsolidatedAIAnalysis> {
    try {
      console.log(`🤖 Starting AI analysis for ${coinId}...`);

      // If in demo mode, generate sample analysis
      if (this.demoMode) {
        console.log(`🤖 Using demo mode for ${coinId} analysis...`);
        return this.generateDemoAnalysis(coinId);
      }

      // Step 1: Gather all market data
      const marketData = await this.gatherMarketData(coinId);
      
      // Step 2: Generate analysis context
      const context = this.buildAnalysisContext(coinId, marketData);
      
      // Step 3: Run AI analysis with configured providers
      const providerResults = await this.runProviderAnalysis(context);
      
      // Step 4: Consolidate and synthesize results
      const consolidatedAnalysis = this.consolidateResults(context, providerResults);
      
      console.log(`✅ AI analysis completed for ${coinId}`);
      return consolidatedAnalysis;

    } catch (error) {
      console.error('❌ Error performing AI analysis:', error);
      throw error;
    }
  }

  /**
   * Gather all required market data
   */
  private async gatherMarketData(coinId: string) {
    const [completeData, tradingSignal] = await Promise.all([
      this.cryptoService.getCompleteCryptoData(coinId),
      this.getTradingSignalWithContext(coinId)
    ]);

    return {
      ...completeData,
      tradingSignal
    };
  }

  /**
   * Get trading signal with context
   */
  private async getTradingSignalWithContext(coinId: string) {
    // Use the full URL for server-side requests
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000'
    
    const signalData = await fetch(`${baseUrl}/api/trading-signals?action=signal&coinId=${coinId}`);
    const { signal } = await signalData.json();
    return signal;
  }

  /**
   * Build analysis context from market data
   */
  private buildAnalysisContext(coinId: string, marketData: any): AIPromptContext {
    const coinNames: Record<string, string> = {
      bitcoin: 'Bitcoin',
      ethereum: 'Ethereum',
      binancecoin: 'Binance Coin',
      solana: 'Solana'
    };

    return {
      coinId,
      coinName: coinNames[coinId] || coinId,
      currentPrice: marketData.price.usd || 0,
      priceChange24h: marketData.price.usd_24h_change || 0,
      marketCap: marketData.price.usd_market_cap || 0,
      volume24h: marketData.price.usd_24h_vol || 0,
      
      // On-chain Metrics
      mvrv: marketData.onChain.mvrv || 0,
      nupl: marketData.onChain.nupl || 0,
      sopr: marketData.onChain.sopr || 0,
      activeAddresses: marketData.onChain.activeAddresses || 0,
      exchangeInflow: marketData.onChain.exchangeInflow || 0,
      exchangeOutflow: marketData.onChain.exchangeOutflow || 0,
      transactionVolume: marketData.onChain.transactionVolume || 0,
      
      // Technical Indicators
      rsi: marketData.technical.rsi || 50,
      ma50: marketData.technical.ma50 || 0,
      ma200: marketData.technical.ma200 || 0,
      macd: marketData.technical.macd || 0,
      bollingerUpper: marketData.technical.bollingerUpper || 0,
      bollingerMiddle: marketData.technical.bollingerMiddle || 0,
      bollingerLower: marketData.technical.bollingerLower || 0,
      
      // Sentiment Data
      fearGreedIndex: marketData.sentiment.fearGreedIndex || 50,
      fearGreedClassification: marketData.sentiment.fearGreedClassification || 'Neutral',
      twitterSentiment: marketData.sentiment.social?.twitterSentiment || 0.5,
      redditSentiment: marketData.sentiment.social?.redditSentiment || 0.5,
      socialVolume: marketData.sentiment.social?.socialVolume || 0,
      newsSentiment: marketData.sentiment.news?.newsSentiment || 0.5,
      newsVolume: marketData.sentiment.news?.newsVolume || 0,
      googleTrendsScore: marketData.sentiment.googleTrends?.trendsScore || 50,
      googleTrendsDirection: marketData.sentiment.googleTrends?.trendDirection || 'stable',
      
      // Derivatives Data
      fundingRate: marketData.derivatives.fundingRate || 0,
      openInterest: marketData.derivatives.openInterest || 0,
      liquidationVolume: marketData.derivatives.liquidationVolume || 0,
      putCallRatio: marketData.derivatives.putCallRatio || 1,
      
      // Trading Signal
      tradingSignal: marketData.tradingSignal?.signal || 'HOLD',
      signalConfidence: marketData.tradingSignal?.confidence || 50,
      signalRisk: marketData.tradingSignal?.riskLevel || 'MEDIUM'
    };
  }

  /**
   * Run analysis with all configured AI providers
   */
  private async runProviderAnalysis(context: AIPromptContext): Promise<Record<string, AIAnalysisResult>> {
    const results: Record<string, AIAnalysisResult> = {};
    
    for (const provider of this.config.providers) {
      try {
        console.log(`🤖 Running analysis with ${provider}...`);
        const result = await this.runProviderAnalysisWithType(provider, context);
        results[provider] = result;
      } catch (error) {
        console.error(`❌ Error running analysis with ${provider}:`, error);
        // Continue with other providers even if one fails
      }
    }

    // If no AI providers succeeded, return null instead of fallback
    if (Object.keys(results).length === 0) {
      console.log('🤖 No AI providers succeeded, returning null...');
      return results;
    }

    return results;
  }

  /**
   * Run analysis with specific provider and type
   */
  private async runProviderAnalysisWithType(provider: 'Z.AI' | 'ChatGPT', context: AIPromptContext): Promise<AIAnalysisResult> {
    const promises = this.config.analysisTypes.map(async (analysisType) => {
      return this.executeAIAnalysis(provider, context, analysisType);
    });

    // Wait for all analysis types to complete
    const results = await Promise.allSettled(promises);
    
    // Use the comprehensive analysis as primary, fallback to others
    const comprehensiveResult = results.find(r => 
      r.status === 'fulfilled' && r.value.analysisType === 'comprehensive'
    ) as PromiseFulfilledResult<AIAnalysisResult> | undefined;

    if (comprehensiveResult) {
      return comprehensiveResult.value;
    }

    // Fallback to first available result
    const firstSuccessfulResult = results.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<AIAnalysisResult> | undefined;
    if (firstSuccessfulResult) {
      return firstSuccessfulResult.value;
    }

    throw new Error(`All analysis types failed for provider ${provider}`);
  }

  /**
   * Execute AI analysis with specific provider
   */
  private async executeAIAnalysis(
    provider: 'Z.AI' | 'ChatGPT', 
    context: AIPromptContext, 
    analysisType: 'comprehensive' | 'quick' | 'breakout' | 'risk'
  ): Promise<AIAnalysisResult & { analysisType: string }> {
    let prompt: string;
    
    switch (analysisType) {
      case 'comprehensive':
        prompt = AIPromptTemplates.getComprehensiveAnalysisPrompt(context);
        break;
      case 'quick':
        prompt = AIPromptTemplates.getQuickAnalysisPrompt(context);
        break;
      case 'breakout':
        prompt = AIPromptTemplates.getBreakoutAnalysisPrompt(context);
        break;
      case 'risk':
        prompt = AIPromptTemplates.getRiskAnalysisPrompt(context);
        break;
      default:
        prompt = AIPromptTemplates.getComprehensiveAnalysisPrompt(context);
    }

    const maxRetries = this.config.retryAttempts;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.callAIProvider(provider, prompt);
        const parsedResponse = this.parseAIResponse(response, provider, analysisType);
        
        return {
          ...parsedResponse,
          provider,
          analysisType
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
   * Call specific AI provider
   */
  private async callAIProvider(provider: 'Z.AI' | 'ChatGPT', prompt: string): Promise<string> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI analysis timeout')), this.config.timeout);
    });

    const analysisPromise = this.executeAIProviderCall(provider, prompt);

    return Promise.race([analysisPromise, timeoutPromise]) as Promise<string>;
  }

  /**
   * Execute the actual AI provider call
   */
  private async executeAIProviderCall(provider: 'Z.AI' | 'ChatGPT', prompt: string): Promise<string> {
    if (provider === 'Z.AI') {
      if (!this.zaiClient) {
        await this.initialize();
      }
      
      try {
        const completion = await this.zaiClient.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an expert cryptocurrency market analyst providing detailed, data-driven investment insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7, // Balance between creativity and consistency
          max_tokens: 2000
        });

        return completion.choices[0]?.message?.content || '';
      } catch (error) {
        console.warn(`⚠️ Z.AI API call failed:`, error.message);
        throw error; // Will be caught by retry mechanism
      }
    } else if (provider === 'ChatGPT') {
      // Use real OpenAI API for ChatGPT
      if (!OpenAI || !hasApiKey('openai') || !AI_CONFIG.openai.apiKey || !this.openaiClient) {
        throw new Error('OpenAI API key is not configured or OpenAI not available');
      }
      
      try {
        const completion = await this.openaiClient.chat.completions.create({
          model: 'gpt-4o-mini', // Use GPT-4o-mini for cost-effectiveness
          messages: [
            {
              role: 'system',
              content: 'You are an expert cryptocurrency market analyst providing detailed, data-driven investment insights. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        });

        return completion.choices[0]?.message?.content || '';
      } catch (error) {
        console.warn(`⚠️ ChatGPT API call failed:`, error.message);
        throw error; // Will be caught by retry mechanism
      }
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Generate demo analysis for demonstration purposes
   */
  private generateDemoAnalysis(coinId: string): ConsolidatedAIAnalysis {
    console.log(`🤖 Generating demo analysis for ${coinId}...`);
    
    const coinNames: Record<string, string> = {
      bitcoin: 'Bitcoin',
      ethereum: 'Ethereum',
      binancecoin: 'Binance Coin',
      solana: 'Solana'
    };

    const coinName = coinNames[coinId] || coinId;
    
    // Generate sample analysis data
    const demoAnalysis: ConsolidatedAIAnalysis = {
      timestamp: new Date(),
      coinId,
      overallRecommendation: 'BUY',
      overallConfidence: 75,
      consensusScore: 80,
      providers: {
        'Z.AI': {
          provider: 'Z.AI',
          buyRecommendation: 'BUY',
          confidence: 78,
          reasoning: `Phân tích kỹ thuật cho ${coinName} cho thấy xu hướng tăng trưởng tích cực. Chỉ số RSI đang ở mức 45, cho thấy không bị quá mua. Khối lượng giao dịch tăng 20% trong 24h qua, thể hiện sự quan tâm của nhà đầu tư. MVRV ratio ở mức 1.2, cho thấy tài sản vẫn còn tiềm năng tăng trưởng.`,
          analysisType: 'comprehensive',
          riskLevel: 'MEDIUM',
          breakoutPotential: 'HIGH',
          timeframe: 'trung hạn',
          keyInsights: [
            'Xu hướng giá tăng trong ngắn hạn',
            'Khối lượng giao dịch tăng mạnh',
            'RSI cho dấu hiệu tích cực',
            'MVRV ratio ở mức hợp lý'
          ],
          riskFactors: [
            'Biến động thị trường cao',
            'Áp lực bán ra khi giá tăng',
            'Rủi ro điều chỉnh ngắn hạn'
          ],
          entryPoints: 'Khu vực giá hiện tại, chờ đợi pullback nhẹ',
          exitPoints: 'Khu vực kháng cự tiếp theo',
          stopLoss: '5% dưới giá nhập lệnh',
          takeProfit: '15-20% trên giá nhập lệnh'
        },
        'ChatGPT': {
          provider: 'ChatGPT',
          buyRecommendation: 'BUY',
          confidence: 72,
          reasoning: `${coinName} đang cho thấy các dấu hiệu kỹ thuật tích cực. Giá đang giao dịch trên đường trung bình động 50 ngày, khẳng định xu hướng tăng. Chỉ báo MACD cho thấy động lượng tăng, trong khi Bollinger Bands mở rộng, cho thấy biến động tăng. Dữ liệu on-chain cho thấy số lượng địa chỉ hoạt động tăng 15%, thể hiện sự quan tâm của người dùng.`,
          analysisType: 'comprehensive',
          riskLevel: 'MEDIUM',
          breakoutPotential: 'HIGH',
          timeframe: 'trung hạn',
          keyInsights: [
            'Giá trên MA50, xu hướng tăng',
            'MACD cho thấy động lượng tích cực',
            'Số địa chỉ hoạt động tăng',
            'Biến động tăng, cơ hội breakout'
          ],
          riskFactors: [
            'Thị trường biến động cao',
            'Rủi ro điều chỉnh kỹ thuật',
            'Áp lực bán khi giá tăng'
          ],
          entryPoints: 'Khu vực hỗ trợ hiện tại',
          exitPoints: 'Kháng cự kỹ thuật tiếp theo',
          stopLoss: '4-6% dưới giá nhập lệnh',
          takeProfit: '12-18% trên giá nhập lệnh'
        }
      },
      summary: {
        trendAnalysis: `${coinName} đang trong xu hướng tăng với các chỉ báo kỹ thuật tích cực. Khối lượng giao dịch tăng và sự quan tâm của nhà đầu tư cho thấy tiềm năng tiếp tục tăng trưởng.`,
        keyInsights: [
          'Xu hướng giá tăng ngắn hạn',
          'Khối lượng giao dịch tăng mạnh',
          'Chỉ báo kỹ thuật tích cực',
          'Dữ liệu on-chain tích cực',
          'Tiềm năng breakout cao'
        ],
        riskAssessment: 'Mức độ rủi ro trung bình. Thị trường biến động nhưng có cơ sở kỹ thuật vững chắc. Cần quản lý rủi ro thích hợp.',
        opportunityHighlights: [
          'Cơ hội mua vào ở mức giá hiện tại',
          'Tiềm năng lợi nhuận 15-20%',
          'Xu hướng tăng dài hạn',
          'Sự quan tâm của nhà đầu tư tăng'
        ]
      },
      marketRegime: 'BULLISH',
      timeHorizon: 'MEDIUM_TERM',
      actionPlan: {
        immediate: 'Mua vào tại mức giá hiện tại với quản lý rủi ro chặt chẽ',
        shortTerm: 'Giữ vị thế và chờ đợi breakout qua kháng cự',
        mediumTerm: 'Chốt lời dần khi đạt mục tiêu 15-20% lợi nhuận'
      }
    };

    console.log(`✅ Demo analysis generated for ${coinId}`);
    return demoAnalysis;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AIAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}