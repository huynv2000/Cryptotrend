/**
 * Trading Signal Service
 * Implements coordinated trading signal rules based on the report specifications
 * 
 * Rules from the report:
 * - MUA: MVRV < 1 + Fear & Greed < 20 + Funding âm + SOPR gần 1
 * - BÁN: MVRV > 2 + Fear & Greed > 80 + Funding dương cao + RSI > 70
 * - HOLD: MVRV/NUPL ổn định, volume on-chain tăng, không có extreme ở phái sinh/sentiment
 */

export interface TradingSignal {
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
  confidence: number // 0-100
  reasoning: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  conditions: {
    mvrv: number
    fearGreed: number
    fundingRate: number
    sopr: number
    rsi: number
    nupl: number
    volumeTrend: 'increasing' | 'stable' | 'decreasing'
    extremeDetected: boolean
  }
  triggers: string[] // List of conditions that triggered the signal
}

export interface SignalThresholds {
  // BUY conditions
  buyMvrvThreshold: number // default: 1
  buyFearGreedThreshold: number // default: 20
  buyFundingRateThreshold: number // default: 0 (negative)
  buySoprThreshold: number // default: 1 (near 1)
  
  // SELL conditions
  sellMvrvThreshold: number // default: 2
  sellFearGreedThreshold: number // default: 80
  sellFundingRateThreshold: number // default: 0.01 (high positive)
  sellRsiThreshold: number // default: 70
  
  // HOLD conditions
  holdMvrvStabilityRange: [number, number] // default: [1, 1.5]
  holdNuplStabilityRange: [number, number] // default: [0.3, 0.7]
}

export class TradingSignalService {
  private static instance: TradingSignalService
  private thresholds: SignalThresholds

  constructor() {
    this.thresholds = {
      buyMvrvThreshold: 1,
      buyFearGreedThreshold: 20,
      buyFundingRateThreshold: 0,
      buySoprThreshold: 1,
      sellMvrvThreshold: 2,
      sellFearGreedThreshold: 80,
      sellFundingRateThreshold: 0.01,
      sellRsiThreshold: 70,
      holdMvrvStabilityRange: [1, 1.5],
      holdNuplStabilityRange: [0.3, 0.7]
    }
  }

  static getInstance(): TradingSignalService {
    if (!TradingSignalService.instance) {
      TradingSignalService.instance = new TradingSignalService()
    }
    return TradingSignalService.instance
  }

  /**
   * Generate trading signal based on market data
   */
  generateSignal(marketData: {
    mvrv: number
    fearGreedIndex: number
    fundingRate: number
    sopr: number
    rsi: number
    nupl: number
    transactionVolume: number
    previousTransactionVolume?: number
    openInterest?: number
    socialSentiment?: number
    newsSentiment?: number
  }): TradingSignal {
    const {
      mvrv,
      fearGreedIndex,
      fundingRate,
      sopr,
      rsi,
      nupl,
      transactionVolume,
      previousTransactionVolume = transactionVolume * 0.9, // assume slight decrease if not provided
      openInterest = 0,
      socialSentiment = 0.5,
      newsSentiment = 0.5
    } = marketData

    // Calculate volume trend
    const volumeTrend: 'increasing' | 'stable' | 'decreasing' = 
      transactionVolume > previousTransactionVolume * 1.05 ? 'increasing' :
      transactionVolume > previousTransactionVolume * 0.95 ? 'stable' : 'decreasing'

    // Detect extreme conditions
    const extremeDetected = this.detectExtremeConditions({
      fearGreedIndex,
      fundingRate,
      rsi,
      openInterest,
      socialSentiment,
      newsSentiment
    })

    // Initialize signal components
    let signal: TradingSignal['signal'] = 'HOLD'
    let confidence = 50
    let reasoning = ''
    let riskLevel: TradingSignal['riskLevel'] = 'MEDIUM'
    const triggers: string[] = []

    // Check BUY conditions (MVRV < 1 + Fear & Greed < 20 + Funding âm + SOPR gần 1)
    const buyConditions = [
      { condition: mvrv < this.thresholds.buyMvrvThreshold, weight: 0.3, name: 'MVRV < 1' },
      { condition: fearGreedIndex < this.thresholds.buyFearGreedThreshold, weight: 0.25, name: 'Fear & Greed < 20' },
      { condition: fundingRate < this.thresholds.buyFundingRateThreshold, weight: 0.25, name: 'Funding Rate âm' },
      { condition: Math.abs(sopr - 1) < 0.1, weight: 0.2, name: 'SOPR gần 1' }
    ]

    const buyScore = buyConditions.filter(c => c.condition).reduce((sum, c) => sum + c.weight, 0)

    // Check SELL conditions (MVRV > 2 + Fear & Greed > 80 + Funding dương cao + RSI > 70)
    const sellConditions = [
      { condition: mvrv > this.thresholds.sellMvrvThreshold, weight: 0.3, name: 'MVRV > 2' },
      { condition: fearGreedIndex > this.thresholds.sellFearGreedThreshold, weight: 0.25, name: 'Fear & Greed > 80' },
      { condition: fundingRate > this.thresholds.sellFundingRateThreshold, weight: 0.25, name: 'Funding Rate dương cao' },
      { condition: rsi > this.thresholds.sellRsiThreshold, weight: 0.2, name: 'RSI > 70' }
    ]

    const sellScore = sellConditions.filter(c => c.condition).reduce((sum, c) => sum + c.weight, 0)

    // Check HOLD conditions (MVRV/NUPL ổn định, volume on-chain tăng, không có extreme)
    const mvrvStable = mvrv >= this.thresholds.holdMvrvStabilityRange[0] && mvrv <= this.thresholds.holdMvrvStabilityRange[1]
    const nuplStable = nupl >= this.thresholds.holdNuplStabilityRange[0] && nupl <= this.thresholds.holdNuplStabilityRange[1]
    const volumeIncreasing = volumeTrend === 'increasing'
    const noExtremes = !extremeDetected

    const holdScore = (mvrvStable ? 0.4 : 0) + (nuplStable ? 0.3 : 0) + (volumeIncreasing ? 0.2 : 0) + (noExtremes ? 0.1 : 0)

    // Determine signal based on scores
    if (buyScore >= 0.8) {
      signal = buyScore >= 0.95 ? 'STRONG_BUY' : 'BUY'
      confidence = Math.round(buyScore * 100)
      riskLevel = buyScore >= 0.95 ? 'LOW' : 'MEDIUM'
      triggers.push(...buyConditions.filter(c => c.condition).map(c => c.name))
      reasoning = `Tín hiệu MUA mạnh: ${triggers.join(', ')}. Thị trường đang ở vùng giá thấp, tâm lý sợ hãi, và dòng tiền phái sinh tiêu cực.`
    } else if (sellScore >= 0.8) {
      signal = sellScore >= 0.95 ? 'STRONG_SELL' : 'SELL'
      confidence = Math.round(sellScore * 100)
      riskLevel = sellScore >= 0.95 ? 'LOW' : 'MEDIUM'
      triggers.push(...sellConditions.filter(c => c.condition).map(c => c.name))
      reasoning = `Tín hiệu BÁN mạnh: ${triggers.join(', ')}. Thị trường đang ở vùng giá cao, tâm lý tham lam, và có dấu hiệu quá mua.`
    } else if (holdScore >= 0.7) {
      signal = 'HOLD'
      confidence = Math.round(holdScore * 100)
      riskLevel = 'LOW'
      triggers.push('Thị trường ổn định')
      reasoning = `Tín hiệu GIỮ: MVRV/NUPL ổn định, khối lượng on-chain tăng, không có dấu hiệu cực đoan.`
    } else {
      signal = 'HOLD'
      confidence = 50
      riskLevel = 'MEDIUM'
      reasoning = 'Tín hiệu trung lập: Không đủ điều kiện để MUA hoặc BÁN. Cần theo dõi thêm.'
    }

    return {
      signal,
      confidence,
      reasoning,
      riskLevel,
      conditions: {
        mvrv,
        fearGreed: fearGreedIndex,
        fundingRate,
        sopr,
        rsi,
        nupl,
        volumeTrend,
        extremeDetected
      },
      triggers
    }
  }

  /**
   * Detect extreme market conditions
   */
  private detectExtremeConditions(data: {
    fearGreedIndex: number
    fundingRate: number
    rsi: number
    openInterest: number
    socialSentiment: number
    newsSentiment: number
  }): boolean {
    const {
      fearGreedIndex,
      fundingRate,
      rsi,
      openInterest,
      socialSentiment,
      newsSentiment
    } = data

    // Extreme fear or greed
    const extremeSentiment = fearGreedIndex <= 10 || fearGreedIndex >= 90
    
    // Extreme funding rate (very high positive or negative)
    const extremeFunding = Math.abs(fundingRate) > 0.05
    
    // Extreme RSI (overbought or oversold)
    const extremeRsi = rsi >= 80 || rsi <= 20
    
    // Extreme social sentiment
    const extremeSocial = socialSentiment >= 0.9 || socialSentiment <= 0.1
    
    // Extreme news sentiment
    const extremeNews = newsSentiment >= 0.9 || newsSentiment <= 0.1

    return extremeSentiment || extremeFunding || extremeRsi || extremeSocial || extremeNews
  }

  /**
   * Get detailed signal analysis
   */
  getSignalAnalysis(signal: TradingSignal) {
    const { signal: signalType, confidence, conditions, triggers } = signal

    const analysis = {
      recommendation: this.getRecommendation(signalType),
      timeframe: this.getTimeframe(signalType),
      riskFactors: this.getRiskFactors(conditions),
      entryPoints: this.getEntryPoints(signalType, conditions),
      exitPoints: this.getExitPoints(signalType, conditions),
      stopLoss: this.getStopLoss(signalType, conditions),
      takeProfit: this.getTakeProfit(signalType, conditions)
    }

    return analysis
  }

  private getRecommendation(signalType: TradingSignal['signal']): string {
    switch (signalType) {
      case 'STRONG_BUY':
        return 'MUA mạnh - Tích lũy vị thế dài hạn với tỷ trọng cao'
      case 'BUY':
        return 'MUA - Bắt đầu tích lũy với tỷ trọng vừa phải'
      case 'HOLD':
        return 'GIỮ - Duy trì vị thế hiện tại, quan sát thêm'
      case 'SELL':
        return 'BÁN - Giảm tỷ trọng, chốt lời một phần'
      case 'STRONG_SELL':
        return 'BÁN mạnh - Chốt lời toàn bộ, chuyển sang tiền tệ ổn định'
      default:
        return 'Quan sát'
    }
  }

  private getTimeframe(signalType: TradingSignal['signal']): string {
    switch (signalType) {
      case 'STRONG_BUY':
        return 'Dài hạn (1-3 tháng)'
      case 'BUY':
        return 'Trung hạn (2-4 tuần)'
      case 'HOLD':
        return 'Ngắn hạn (theo dõi hàng ngày)'
      case 'SELL':
        return 'Ngắn hạn (1-2 tuần)'
      case 'STRONG_SELL':
        return 'Ngay lập tức'
      default:
        return 'Không xác định'
    }
  }

  private getRiskFactors(conditions: TradingSignal['conditions']): string[] {
    const factors: string[] = []
    
    if (conditions.mvrv > 2.5) factors.push('Định giá cao')
    if (conditions.mvrv < 0.8) factors.push('Định giá thấp')
    if (conditions.fearGreed <= 15) factors.push('Tâm lý cực kỳ sợ hãi')
    if (conditions.fearGreed >= 85) factors.push('Tâm lý cực kỳ tham lam')
    if (Math.abs(conditions.fundingRate) > 0.05) factors.push('Funding rate cực đoan')
    if (conditions.rsi >= 80) factors.push('Quá mua')
    if (conditions.rsi <= 20) factors.push('Quá bán')
    if (conditions.extremeDetected) factors.push('Phát hiện điều kiện cực đoan')

    return factors
  }

  private getEntryPoints(signalType: TradingSignal['signal'], conditions: TradingSignal['conditions']): string {
    if (signalType === 'STRONG_BUY' || signalType === 'BUY') {
      return `Vào lệnh theo đợt, bắt đầu khi MVRV < ${conditions.mvrv.toFixed(2)} và Fear & Greed < ${conditions.fearGreed}`
    }
    return 'Không khuyến nghị vào lệnh'
  }

  private getExitPoints(signalType: TradingSignal['signal'], conditions: TradingSignal['conditions']): string {
    if (signalType === 'STRONG_SELL' || signalType === 'SELL') {
      return `Chốt lời khi MVRV > ${conditions.mvrv.toFixed(2)} và Fear & Greed > ${conditions.fearGreed}`
    }
    return 'Không khuyến nghị chốt lời'
  }

  private getStopLoss(signalType: TradingSignal['signal'], conditions: TradingSignal['conditions']): string {
    if (signalType === 'BUY' || signalType === 'STRONG_BUY') {
      return 'Stop loss tại mức hỗ trợ kỹ thuật hoặc -15% từ giá mua'
    }
    return 'Không áp dụng'
  }

  private getTakeProfit(signalType: TradingSignal['signal'], conditions: TradingSignal['conditions']): string {
    if (signalType === 'BUY' || signalType === 'STRONG_BUY') {
      return 'Take profit tại mức kháng cự kỹ thuật hoặc +25% từ giá mua'
    }
    return 'Không áp dụng'
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds: Partial<SignalThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
  }

  /**
   * Get current thresholds
   */
  getThresholds(): SignalThresholds {
    return { ...this.thresholds }
  }
}