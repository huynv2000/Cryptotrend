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

    // If no AI providers succeeded, use rule-based fallback
    if (Object.keys(results).length === 0) {
      console.log('🤖 No AI providers succeeded, using rule-based fallback...');
      const fallbackResult = this.generateRuleBasedAnalysis(context, 'comprehensive');
      results['RULE_BASED_FALLBACK'] = fallbackResult;
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
   * Generate rule-based fallback analysis when AI providers fail
   */
  private generateRuleBasedAnalysis(context: AIPromptContext, analysisType: string): AIAnalysisResult {
    console.log(`🤖 Generating rule-based fallback analysis for ${context.coinId}...`);
    
    // Extract key metrics
    const { mvrv, nupl, rsi, fearGreedIndex, fundingRate, sopr, activeAddresses } = context;
    
    // Rule-based logic for recommendation
    let buyRecommendation: AIAnalysisResult['buyRecommendation'] = 'HOLD';
    let confidence = 50;
    let reasoning = '';
    let breakoutPotential: AIAnalysisResult['breakoutPotential'] = 'MEDIUM';
    
    // MVRV analysis
    if (mvrv < 1) {
      buyRecommendation = 'BUY';
      confidence += 20;
      reasoning += 'MVRV indicates undervaluation. ';
    } else if (mvrv > 2) {
      buyRecommendation = 'SELL';
      confidence += 20;
      reasoning += 'MVRV indicates overvaluation. ';
    }
    
    // RSI analysis
    if (rsi < 30) {
      buyRecommendation = buyRecommendation === 'BUY' ? 'STRONG_BUY' : 'BUY';
      confidence += 15;
      reasoning += 'RSI indicates oversold conditions. ';
    } else if (rsi > 70) {
      buyRecommendation = buyRecommendation === 'SELL' ? 'STRONG_SELL' : 'SELL';
      confidence += 15;
      reasoning += 'RSI indicates overbought conditions. ';
    }
    
    // Fear & Greed analysis
    if (fearGreedIndex < 25) {
      buyRecommendation = buyRecommendation === 'BUY' ? 'STRONG_BUY' : 'BUY';
      confidence += 10;
      reasoning += 'Market fear indicates buying opportunity. ';
    } else if (fearGreedIndex > 75) {
      buyRecommendation = buyRecommendation === 'SELL' ? 'STRONG_SELL' : 'SELL';
      confidence += 10;
      reasoning += 'Market greed indicates caution. ';
    }
    
    // NUPL analysis
    if (nupl < 0.3) {
      buyRecommendation = buyRecommendation === 'HOLD' ? 'BUY' : buyRecommendation;
      confidence += 10;
      reasoning += 'NUPL suggests undervaluation. ';
    } else if (nupl > 0.7) {
      buyRecommendation = buyRecommendation === 'HOLD' ? 'SELL' : buyRecommendation;
      confidence += 10;
      reasoning += 'NUPL suggests overvaluation. ';
    }
    
    // Determine breakout potential
    if (activeAddresses > 500000 && mvrv > 1 && mvrv < 1.8) {
      breakoutPotential = 'HIGH';
      reasoning += 'High network activity suggests breakout potential. ';
    } else if (rsi > 60 && rsi < 70 && fearGreedIndex > 50) {
      breakoutPotential = 'MEDIUM';
      reasoning += 'Moderate momentum suggests possible breakout. ';
    } else {
      breakoutPotential = 'LOW';
      reasoning += 'Low momentum suggests limited breakout potential. ';
    }
    
    // Normalize confidence
    confidence = Math.min(95, Math.max(5, confidence));
    
    // Generate trend analysis
    const trendAnalysis = this.generateTrendAnalysis(context);
    
    // Generate risk factors
    const riskFactors = this.generateRiskFactors(context);
    
    // Generate opportunities
    const opportunities = this.generateOpportunities(context);
    
    return {
      provider: 'RULE_BASED_FALLBACK',
      trendAnalysis,
      buyRecommendation,
      confidence,
      reasoning,
      breakoutPotential,
      breakoutReasoning: reasoning,
      keyLevels: this.generateKeyLevels(context),
      timeHorizon: this.generateTimeHorizon(buyRecommendation),
      riskFactors,
      opportunities,
      marketRegime: this.generateMarketRegime(context)
    };
  }
  
  private generateTrendAnalysis(context: AIPromptContext): string {
    const { mvrv, rsi, fearGreedIndex, nupl } = context;
    
    if (mvrv < 1 && rsi < 40 && fearGreedIndex < 30) {
      return "Market shows strong accumulation signals with bearish sentiment creating buying opportunities.";
    } else if (mvrv > 2 && rsi > 60 && fearGreedIndex > 70) {
      return "Market shows distribution signals with bullish sentiment suggesting caution.";
    } else if (nupl > 0.5 && rsi > 50) {
      return "Market shows moderate bullish momentum with profitable holders dominating.";
    } else {
      return "Market shows mixed signals with balanced buying and selling pressure.";
    }
  }
  
  private generateRiskFactors(context: AIPromptContext): string[] {
    const factors: string[] = [];
    const { mvrv, rsi, fearGreedIndex, fundingRate } = context;
    
    if (mvrv > 2.5) factors.push("High valuation risk");
    if (mvrv < 0.8) factors.push("Extreme undervaluation uncertainty");
    if (rsi > 80) factors.push("Overbought conditions");
    if (rsi < 20) factors.push("Oversold volatility");
    if (fearGreedIndex > 90) factors.push("Euphoric market sentiment");
    if (fearGreedIndex < 10) factors.push("Panic selling risk");
    if (Math.abs(fundingRate) > 0.02) factors.push("Extreme funding rates");
    
    return factors.length > 0 ? factors : ["Normal market conditions"];
  }
  
  private generateOpportunities(context: AIPromptContext): string[] {
    const opportunities: string[] = [];
    const { mvrv, rsi, fearGreedIndex, activeAddresses } = context;
    
    if (mvrv < 1.2 && rsi < 35) opportunities.push("Value accumulation opportunity");
    if (fearGreedIndex < 25 && activeAddresses > 300000) opportunities.push("Fear-based buying opportunity");
    if (rsi > 30 && rsi < 50 && mvrv > 1) opportunities.push("Momentum building opportunity");
    if (activeAddresses > 1000000) opportunities.push("Network growth opportunity");
    
    return opportunities.length > 0 ? opportunities : ["Monitor market conditions"];
  }
  
  private generateKeyLevels(context: AIPromptContext): { support: number[]; resistance: number[] } {
    const price = context.currentPrice;
    
    return {
      support: [
        price * 0.95,  // 5% below current price
        price * 0.90,  // 10% below current price
        price * 0.85   // 15% below current price
      ],
      resistance: [
        price * 1.05,  // 5% above current price
        price * 1.10,  // 10% above current price
        price * 1.15   // 15% above current price
      ]
    };
  }
  
  private generateTimeHorizon(recommendation: string): string {
    switch (recommendation) {
      case 'STRONG_BUY':
        return 'LONG_TERM';
      case 'BUY':
        return 'MEDIUM_TERM';
      case 'SELL':
        return 'SHORT_TERM';
      case 'STRONG_SELL':
        return 'IMMEDIATE';
      default:
        return 'MEDIUM_TERM';
    }
  }
  
  private generateMarketRegime(context: AIPromptContext): 'BULLISH' | 'BEARISH' | 'RANGING' | 'VOLATILE' {
    const { mvrv, rsi, fearGreedIndex } = context;
    
    if (mvrv > 1.5 && rsi > 55 && fearGreedIndex > 60) {
      return 'BULLISH';
    } else if (mvrv < 1 && rsi < 45 && fearGreedIndex < 40) {
      return 'BEARISH';
    } else if (Math.abs(rsi - 50) > 20) {
      return 'VOLATILE';
    } else {
      return 'RANGING';
    }
  }

  /**
   * Parse AI response and validate structure
   */
  private parseAIResponse(response: string, provider: 'Z.AI' | 'ChatGPT', analysisType: string): AIAnalysisResult {
    try {
      // Clean the response to extract JSON
      let jsonStr = response;
      
      // Remove markdown code blocks if present
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      // Try to find JSON object in the response
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(jsonStr);
      
      // Validate and normalize the response
      return this.validateAndNormalizeResponse(parsed, provider, analysisType);
      
    } catch (error) {
      console.error(`❌ Failed to parse ${provider} response:`, error);
      console.error('Response content:', response);
      throw new Error(`Invalid JSON response from ${provider}`);
    }
  }

  /**
   * Validate and normalize AI response
   */
  private validateAndNormalizeResponse(response: any, provider: 'Z.AI' | 'ChatGPT', analysisType: string): AIAnalysisResult {
    // Ensure required fields exist
    const validated: AIAnalysisResult = {
      provider,
      trendAnalysis: response.trendAnalysis || 'Analysis not available',
      buyRecommendation: response.buyRecommendation || response.recommendation || 'HOLD',
      confidence: Math.min(100, Math.max(0, response.confidence || 50)),
      reasoning: response.reasoning || 'Reasoning not available',
      breakoutPotential: response.breakoutPotential || 'MEDIUM',
      breakoutReasoning: response.breakoutReasoning || 'Breakout analysis not available',
      keyLevels: {
        support: Array.isArray(response.keyLevels?.support) ? response.keyLevels.support : [],
        resistance: Array.isArray(response.keyLevels?.resistance) ? response.keyLevels.resistance : []
      },
      timeHorizon: response.timeHorizon || 'MEDIUM_TERM',
      riskFactors: Array.isArray(response.riskFactors) ? response.riskFactors : [],
      opportunities: Array.isArray(response.opportunities) ? response.opportunities : [],
      marketRegime: response.marketRegime || 'RANGING'
    };

    // Normalize buyRecommendation
    const validRecommendations = ['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'];
    if (!validRecommendations.includes(validated.buyRecommendation)) {
      validated.buyRecommendation = 'HOLD';
    }

    return validated;
  }

  /**
   * Consolidate results from multiple AI providers
   */
  private consolidateResults(context: AIPromptContext, providerResults: Record<string, AIAnalysisResult>): ConsolidatedAIAnalysis {
    const providers = Object.keys(providerResults);
    
    if (providers.length === 0) {
      throw new Error('No AI provider results available');
    }

    // Calculate consensus score
    const recommendations = providers.map(p => providerResults[p].buyRecommendation);
    const consensusScore = this.calculateConsensusScore(recommendations);

    // Determine overall recommendation
    const overallRecommendation = this.determineOverallRecommendation(recommendations, providerResults);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(providerResults);

    // Generate summary insights
    const summary = this.generateSummary(providerResults, context);

    // Determine market regime and time horizon
    const marketRegime = this.determineMarketRegime(providerResults);
    const timeHorizon = this.determineTimeHorizon(providerResults);

    // Create action plan
    const actionPlan = this.createActionPlan(overallRecommendation, providerResults, context);

    return {
      timestamp: new Date(),
      coinId: context.coinId,
      overallRecommendation,
      overallConfidence,
      consensusScore,
      providers: providerResults,
      summary,
      marketRegime,
      timeHorizon,
      actionPlan
    };
  }

  /**
   * Calculate consensus score between AI providers
   */
  private calculateConsensusScore(recommendations: string[]): number {
    if (recommendations.length === 1) return 100;

    const recommendationWeights = {
      'STRONG_BUY': 5,
      'BUY': 4,
      'HOLD': 3,
      'SELL': 2,
      'STRONG_SELL': 1
    };

    const values = recommendations.map(r => recommendationWeights[r as keyof typeof recommendationWeights]);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Convert back to consensus score (higher = more consensus)
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const maxVariance = 4; // Maximum possible variance
    const consensusScore = Math.max(0, 100 - (variance / maxVariance) * 100);

    return Math.round(consensusScore);
  }

  /**
   * Determine overall recommendation from multiple providers
   */
  private determineOverallRecommendation(recommendations: string[], providerResults: Record<string, AIAnalysisResult>): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' {
    if (recommendations.length === 1) {
      return recommendations[0] as any;
    }

    // Weight by confidence
    const weightedScores = new Map<string, number>();
    
    Object.entries(providerResults).forEach(([provider, result]) => {
      const weight = result.confidence / 100;
      const currentScore = weightedScores.get(result.buyRecommendation) || 0;
      weightedScores.set(result.buyRecommendation, currentScore + weight);
    });

    // Find the recommendation with highest weighted score
    let maxScore = 0;
    let overallRecommendation = 'HOLD';

    weightedScores.forEach((score, recommendation) => {
      if (score > maxScore) {
        maxScore = score;
        overallRecommendation = recommendation;
      }
    });

    return overallRecommendation as any;
  }

  /**
   * Calculate overall confidence from multiple providers
   */
  private calculateOverallConfidence(providerResults: Record<string, AIAnalysisResult>): number {
    const confidences = Object.values(providerResults).map(r => r.confidence);
    const averageConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    
    // Boost confidence if providers agree
    const consensusBonus = this.calculateConsensusScore(confidences.map(c => c > 70 ? 'BUY' : c < 30 ? 'SELL' : 'HOLD')) / 100 * 10;
    
    return Math.min(100, Math.round(averageConfidence + consensusBonus));
  }

  /**
   * Generate summary insights from provider results
   */
  private generateSummary(providerResults: Record<string, AIAnalysisResult>, context: AIPromptContext) {
    const providers = Object.values(providerResults);
    
    // Aggregate trend analysis
    const trendAnalyses = providers.map(p => p.trendAnalysis);
    const trendAnalysis = this.aggregateTrendAnalysis(trendAnalyses);

    // Extract key insights
    const riskFactors = [...new Set(providers.flatMap(p => p.riskFactors))];
    const opportunities = [...new Set(providers.flatMap(p => p.opportunities))];

    // Generate risk assessment
    const riskAssessment = this.generateRiskAssessment(providers, context);

    return {
      trendAnalysis,
      keyInsights: [
        `Market regime: ${providers[0]?.marketRegime || 'Unknown'}`,
        `Breakout potential: ${providers[0]?.breakoutPotential || 'Unknown'}`,
        `Time horizon: ${providers[0]?.timeHorizon || 'Unknown'}`
      ],
      riskAssessment,
      opportunityHighlights: opportunities.slice(0, 5) // Top 5 opportunities
    };
  }

  /**
   * Aggregate trend analysis from multiple providers
   */
  private aggregateTrendAnalysis(trendAnalyses: string[]): string {
    if (trendAnalyses.length === 1) return trendAnalyses[0];

    // Simple aggregation - in real implementation, you could use NLP for more sophisticated synthesis
    const bullishKeywords = ['bullish', 'upward', 'positive', 'growth', 'momentum'];
    const bearishKeywords = ['bearish', 'downward', 'negative', 'decline', 'pressure'];

    const bullishCount = trendAnalyses.filter(analysis => 
      bullishKeywords.some(keyword => analysis.toLowerCase().includes(keyword))
    ).length;

    const bearishCount = trendAnalyses.filter(analysis => 
      bearishKeywords.some(keyword => analysis.toLowerCase().includes(keyword))
    ).length;

    if (bullishCount > bearishCount) {
      return "Multiple AI providers indicate bullish market conditions with positive momentum and growth potential.";
    } else if (bearishCount > bullishCount) {
      return "Multiple AI providers indicate bearish market conditions with downward pressure and caution advised.";
    } else {
      return "AI providers show mixed market signals with balanced bullish and bearish indicators.";
    }
  }

  /**
   * Generate risk assessment
   */
  private generateRiskAssessment(providers: AIAnalysisResult[], context: AIPromptContext): string {
    const highRiskFactors = providers.flatMap(p => p.riskFactors);
    
    if (highRiskFactors.length === 0) {
      return "Market conditions appear stable with manageable risk levels.";
    }

    // Assess risk based on technical indicators
    const technicalRisk = context.rsi >= 70 || context.rsi <= 30 ? 'High technical risk detected. ' : '';
    const valuationRisk = context.mvrv > 2 ? 'Overvaluation concerns present. ' : '';
    const sentimentRisk = context.fearGreedIndex >= 80 || context.fearGreedIndex <= 20 ? 'Extreme sentiment conditions. ' : '';

    return `${technicalRisk}${valuationRisk}${sentimentRisk}Key risks include: ${highRiskFactors.slice(0, 3).join(', ')}.`;
  }

  /**
   * Determine market regime
   */
  private determineMarketRegime(providerResults: Record<string, AIAnalysisResult>): 'BULLISH' | 'BEARISH' | 'RANGING' | 'VOLATILE' {
    const regimes = Object.values(providerResults).map(p => p.marketRegime);
    
    // Simple majority vote
    const regimeCounts = regimes.reduce((acc, regime) => {
      acc[regime] = (acc[regime] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxCount = Math.max(...Object.values(regimeCounts));
    const dominantRegime = Object.keys(regimeCounts).find(r => regimeCounts[r] === maxCount);

    return (dominantRegime || 'RANGING') as any;
  }

  /**
   * Determine time horizon
   */
  private determineTimeHorizon(providerResults: Record<string, AIAnalysisResult>): 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' {
    const horizons = Object.values(providerResults).map(p => p.timeHorizon);
    
    // Simple majority vote
    const horizonCounts = horizons.reduce((acc, horizon) => {
      acc[horizon] = (acc[horizon] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxCount = Math.max(...Object.values(horizonCounts));
    const dominantHorizon = Object.keys(horizonCounts).find(h => horizonCounts[h] === maxCount);

    return (dominantHorizon || 'MEDIUM_TERM') as any;
  }

  /**
   * Create action plan based on recommendation and analysis
   */
  private createActionPlan(
    recommendation: string, 
    providerResults: Record<string, AIAnalysisResult>, 
    context: AIPromptContext
  ) {
    const currentPrice = context.currentPrice;
    const supportLevels = Object.values(providerResults).flatMap(p => p.keyLevels.support).slice(0, 3);
    const resistanceLevels = Object.values(providerResults).flatMap(p => p.keyLevels.resistance).slice(0, 3);

    switch (recommendation) {
      case 'STRONG_BUY':
      case 'BUY':
        return {
          immediate: `Accumulate positions around current price level ($${currentPrice.toLocaleString()})`,
          shortTerm: `Add to positions on dips toward support levels (${supportLevels.map(l => `$${l.toLocaleString()}`).join(', ')})`,
          mediumTerm: `Hold positions with targets at resistance levels (${resistanceLevels.map(l => `$${l.toLocaleString()}`).join(', ')})`
        };

      case 'SELL':
      case 'STRONG_SELL':
        return {
          immediate: `Reduce positions at current price level ($${currentPrice.toLocaleString()})`,
          shortTerm: `Take profits near resistance levels (${resistanceLevels.map(l => `$${l.toLocaleString()}`).join(', ')})`,
          mediumTerm: `Wait for better entry opportunities near support levels (${supportLevels.map(l => `$${l.toLocaleString()}`).join(', ')})`
        };

      case 'HOLD':
      default:
        return {
          immediate: `Maintain current positions at ($${currentPrice.toLocaleString()})`,
          shortTerm: `Monitor key levels: Support ${supportLevels.map(l => `$${l.toLocaleString()}`).join(', ')}, Resistance ${resistanceLevels.map(l => `$${l.toLocaleString()}`).join(', ')}`,
          mediumTerm: `Wait for clearer signals before making significant position changes`
        };
    }
  }

  /**
   * Get service status
   */
  getStatus(): any {
    return {
      initialized: !!this.zaiClient || this.demoMode,
      demoMode: this.demoMode,
      openaiConfigured: OpenAI && hasApiKey('openai'),
      zaiConfigured: hasApiKey('zai'),
      config: this.config,
      providers: this.config.providers,
      analysisTypes: this.config.analysisTypes,
      environment: {
        hasOpenAIKey: OpenAI && hasApiKey('openai'),
        hasZAIConfig: hasApiKey('zai'),
        hasAnyAIKey: (OpenAI && hasApiKey('openai')) || hasApiKey('zai')
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AIAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}