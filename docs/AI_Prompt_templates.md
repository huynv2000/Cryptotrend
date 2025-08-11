# AI PROMPT TEMPLATES DOCUMENTATION v2.0
## Hệ Thống Prompt Template Nâng Cao Cho Phân Tích Crypto

**Ngày:** 11/08/2025  
**Phiên bản:** 2.0  
**Developer:** Z.AI  
**Ngôn ngữ:** Tiếng Việt

---

## 1. TÓM TẮT HỆ THỐNG PROMPT NÂNG CAO

### 1.1 Giới Thiệu
Hệ thống AI Prompt Templates phiên bản 2.0 được thiết kế để cung cấp phân tích thị trường cryptocurrency chuyên sâu với đa khung thời gian (Multi-Timeframe Analysis). Các prompt được tối ưu hóa để phân tích dài hạn, trung hạn và ngắn hạn, cung cấp các điểm mua/bán cụ thể và khuyến nghị đầu tư chi tiết.

### 1.2 Mục Tiêu Thiết Kế v2.0
- **Đa khung thời gian**: Phân tích riêng biệt cho dài hạn (6-12 tháng), trung hạn (1-3 tháng), ngắn hạn (1-4 tuần)
- **Chi tiết giao dịch**: Cung cấp điểm vào/thoát cụ thể, stop loss, take profit
- **Quản lý rủi ro**: Khuyến nghị position sizing, risk-reward ratio
- **Tích hợp dữ liệu**: 47+ chỉ báo thị trường được phân loại theo khung thời gian
- **Định dạng chuẩn hóa**: Output JSON có cấu trúc cho dễ tích hợp

---

## 2. CẤU TRÚC PROMPT TEMPLATES v2.0

### 2.1 Enhanced Interface Định Nghĩa

```typescript
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
```

### 2.2 Enhanced Kết Quả Phân Tích

```typescript
export interface EnhancedAIAnalysisResult {
  provider: 'Z.AI' | 'ChatGPT';
  analysisType: 'LONG_TERM' | 'MEDIUM_TERM' | 'SHORT_TERM';
  
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
```

---

## 3. CÁC LOẠI PROMPT TEMPLATE v2.0

### 3.1 Multi-Timeframe Analysis Prompt
**Mục đích**: Phân tích toàn diện theo 3 khung thời gian với 47+ chỉ báo

**Use Case**: Phân tích đầu tư chuyên sâu, quyết định portfolio dài hạn

```typescript
static getMultiTimeframeAnalysisPrompt(context: EnhancedAIPromptContext): string {
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
- Realized Cap: $${(context.longTerm.realizedCap / 1000000000).toFixed(1)}B
- Thermocap Ratio: ${context.longTerm.thermocapRatio.toFixed(2)}
- Stock-to-Flow: ${context.longTerm.stockToFlow.toFixed(2)}

**PHÂN TÍCH TRUNG HẠN (1-3 THÁNG):**
- RSI: ${context.mediumTerm.rsi.toFixed(1)} (${context.mediumTerm.rsi >= 70 ? 'Quá mua' : context.mediumTerm.rsi <= 30 ? 'Quá bán' : 'Trung tính'})
- MA50 vs MA200: ${context.mediumTerm.ma50 > context.mediumTerm.ma200 ? 'Golden Cross (Tích cực)' : 'Death Cross (Tiêu cực)'} (MA50: $${context.mediumTerm.ma50.toLocaleString()}, MA200: $${context.mediumTerm.ma200.toLocaleString()})
- MACD: ${context.mediumTerm.macd > 0 ? 'Tích cực' : 'Tiêu cực'} (${context.mediumTerm.macd.toFixed(2)})
- Bollinger Bands: Upper $${context.mediumTerm.bollingerUpper.toLocaleString()}, Lower $${context.mediumTerm.bollingerLower.toLocaleString()}
- Volume Profile: ${context.mediumTerm.volumeProfile > 0 ? 'Tích cực' : 'Tiêu cực'}
- Kênh giá: Upper $${context.mediumTerm.priceChannels.upper.toLocaleString()}, Lower $${context.mediumTerm.priceChannels.lower.toLocaleString()}
- Cấu trúc thị trường: ${context.mediumTerm.marketStructure}
- Tương quan với BTC: ${context.mediumTerm.correlationWithBTC.toFixed(2)}

**PHÂN TÍCH NGẮN HẠN (1-4 TUẦN):**
- Fear & Greed Index: ${context.shortTerm.fearGreedIndex} (${context.shortTerm.fearGreedClassification})
- Sentiment MXH: Twitter ${context.shortTerm.twitterSentiment.toFixed(2)}, Reddit ${context.shortTerm.redditSentiment.toFixed(2)}
- Volume MXH: ${context.shortTerm.socialVolume.toLocaleString()} lượt đề cập
- Sentiment Tin tức: ${context.shortTerm.newsSentiment.toFixed(2)} (${context.shortTerm.newsVolume} bài viết)
- Google Trends: ${context.shortTerm.googleTrendsScore}/100 (${context.shortTerm.googleTrendsDirection})
- Funding Rate: ${(context.shortTerm.fundingRate * 100).toFixed(3)}% (${context.shortTerm.fundingRate > 0 ? 'Long trả Short' : 'Short trả Long'})
- Open Interest: $${(context.shortTerm.openInterest / 1000000000).toFixed(1)}B
- Thanh lý: $${(context.shortTerm.liquidationVolume / 1000000).toFixed(1)}M
- Put/Call Ratio: ${context.shortTerm.putCallRatio.toFixed(2)}
- Tín hiệu giao dịch: ${context.shortTerm.tradingSignal}
- Độ tin cậy: ${context.shortTerm.signalConfidence}%
- Mức độ rủi ro: ${context.shortTerm.signalRisk}
- Biến động: ${context.shortTerm.volatility.toFixed(2)}%
- Depth Order Book: Bids $${(context.shortTerm.orderBookDepth.bids / 1000000).toFixed(1)}M, Asks $${(context.shortTerm.orderBookDepth.asks / 1000000).toFixed(1)}M

Hãy cung cấp phân tích chi tiết theo các mục sau:

1. **PHÂN TÍCH XU HƯỚNG THEO KHUNG THỜI GIAN:**
   - Dài hạn (6-12 tháng): Xu hướng, độ tin cậy, lý do, động lực chính
   - Trung hạn (1-3 tháng): Xu hướng, độ tin cậy, lý do, động lực chính
   - Ngắn hạn (1-4 tuần): Xu hướng, độ tin cậy, lý do, động lực chính

2. **KHUYẾN NGHỊ GIAO DỊCH:**
   - Tín hiệu tổng thể: STRONG_BUY/BUY/HOLD/SELL/STRONG_SELL
   - Điểm vào lệnh theo từng khung thời gian (khoảng giá, độ tin cậy, lý do)
   - Điểm thoát lệnh: Chốt lời 3 cấp, Stop loss 2 mức

3. **QUẢN LÝ RỦI RO:**
   - Mức độ rủi ro tổng thể: LOW/MEDIUM/HIGH
   - Khuyến nghị position sizing: Bảo thủ/Độ vừa mạo hiểm/Mạo hiểm
   - Tỷ lệ Risk/Reward
   - Yếu tố rủi ro chính và chiến lược giảm thiểu

4. **THỜI ĐIỂM THỊ TRƯỜNG:**
   - Cửa sổ vào lệnh tối ưu
   - Chất xúc tác tiềm năng
   - Cảnh báo rủi ro
   - Khung thời gian đầu tư

5. **CÁC MỨC GIÁ QUAN TRỌNG:**
   - Hỗ trợ: [các mức hỗ trợ chính]
   - Kháng cự: [các mức kháng cự chính]

6. **THÔNG TIN BỔ SUNG:**
   - Chế độ thị trường: BULLISH/BEARISH/RANGING/VOLATILE
   - Tiềm năng breakout: HIGH/MEDIUM/LOW
   - Độ tin cậy tổng thể: 0-100
   - Lý do chi tiết

Format phản hồi dưới dạng JSON:
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
      "conservative": "ví dụ: 1-2%",
      "moderate": "ví dụ: 3-5%",
      "aggressive": "ví dụ: 6-10%"
    },
    "riskRewardRatio": số,
    "keyRiskFactors": ["rủi ro 1", "rủi ro 2", "rủi ro 3"],
    "mitigationStrategies": ["chiến lược 1", "chiến lược 2", "chiến lược 3"]
  },
  "marketTiming": {
    "optimalEntryWindow": "mô tả cửa sổ thời gian",
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
```

### 3.2 Entry-Exit Analysis Prompt
**Mục đích**: Phân tích chi tiết điểm vào/thoát lệnh với stop loss và take profit

**Use Case**: Xác định điểm vào lệnh chính xác, quản lý rủi ro, chốt lời

```typescript
static getEntryExitAnalysisPrompt(context: EnhancedAIPromptContext): string {
  return `Bạn là một chuyên gia giao dịch tiền điện tử chuyên nghiệp. Hãy phân tích chi tiết các điểm vào và thoát lệnh cho ${context.coinName}:

**THÔNG TIN HIỆN TẠI:**
- Giá hiện tại: $${context.currentPrice.toLocaleString()}
- Biến động 24h: ${context.priceChange24h > 0 ? '+' : ''}${context.priceChange24h.toFixed(2)}%

**PHÂN TÍCH KỸ THUẬT:**
- RSI: ${context.mediumTerm.rsi.toFixed(1)} (${context.mediumTerm.rsi >= 70 ? 'Quá mua' : context.mediumTerm.rsi <= 30 ? 'Quá bán' : 'Trung tính'})
- MA50: $${context.mediumTerm.ma50.toLocaleString()}
- MA200: $${context.mediumTerm.ma200.toLocaleString()}
- Bollinger Bands: Upper $${context.mediumTerm.bollingerUpper.toLocaleString()}, Lower $${context.mediumTerm.bollingerLower.toLocaleString()}
- MACD: ${context.mediumTerm.macd.toFixed(2)}

**THỊ TRƯỜNG NGẮN HẠN:**
- Fear & Greed: ${context.shortTerm.fearGreedIndex} (${context.shortTerm.fearGreedClassification})
- Funding Rate: ${(context.shortTerm.fundingRate * 100).toFixed(3)}%
- Open Interest: $${(context.shortTerm.openInterest / 1000000000).toFixed(1)}B
- Tín hiệu hiện tại: ${context.shortTerm.tradingSignal}

Hãy xác định:

1. **ĐIỂM VÀO LỆNH TỐI ƯU:**
   - Khoảng giá vào lệnh đề xuất
   - Độ tin cậy của điểm vào lệnh
   - Lý do chọn điểm vào lệnh
   - Thời gian vào lệnh đề xuất

2. **QUẢN LÝ RỦI RO:**
   - Stop Loss bảo thủ (nên đặt ở đâu, lý do)
   - Stop Loss tích cực (nên đặt ở đâu, lý do)
   - Khoảng cách stop loss hợp lý

3. **CHỐT LỜI:**
   - Take Profit Level 1 (mục tiêu đầu tiên)
   - Take Profit Level 2 (mục tiêu trung bình)
   - Take Profit Level 3 (mục tiêu dài hạn)
   - Lý do cho từng mức chốt lời

4. **QUẢN LÝ VỐN:**
   - % vốn đề xuất cho lệnh này
   - Tỷ lệ Risk/Reward
   - Chiến lược scaling vào/thoát lệnh

5. **THỜI ĐIỂM THỊ TRƯỜNG:**
   - Cửa sổ thời gian tốt nhất để vào lệnh
   - Các chất xúc tác cần theo dõi
   - Cảnh báo rủi ro tiềm ẩn

Format phản hồi JSON:
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
```

### 3.3 Risk Management Analysis Prompt
**Mục đích**: Phân tích rủi ro chi tiết với khuyến nghị position sizing

**Use Case**: Quản lý rủi ro portfolio, xác định kích thước vị thế

```typescript
static getRiskManagementAnalysisPrompt(context: EnhancedAIPromptContext): string {
  return `Bạn là một chuyên gia quản lý rủi ro trong giao dịch tiền điện tử. Hãy đánh giá rủi ro chi tiết cho ${context.coinName}:

**THÔNG TIN RỦI RO HIỆN TẠI:**
- Giá hiện tại: $${context.currentPrice.toLocaleString()}
- Biến động 24h: ${context.priceChange24h > 0 ? '+' : ''}${context.priceChange24h.toFixed(2)}%

**RỦI RO DÀI HẠN:**
- MVRV: ${context.longTerm.mvrv.toFixed(2)} (${context.longTerm.mvrv > 2 ? 'Cao' : context.longTerm.mvrv > 1.5 ? 'Trung bình' : 'Thấp'})
- NUPL: ${context.longTerm.nupl.toFixed(2)} (${context.longTerm.nupl > 0.75 ? 'Cao' : context.longTerm.nupl > 0.5 ? 'Trung bình' : 'Thấp'})
- SOPR: ${context.longTerm.sopr.toFixed(2)}

**RỦI RO TRUNG HẠN:**
- RSI: ${context.mediumTerm.rsi.toFixed(1)} (${context.mediumTerm.rsi >= 70 || context.mediumTerm.rsi <= 30 ? 'Cực đoan' : 'Bình thường'})
- Cấu trúc thị trường: ${context.mediumTerm.marketStructure}

**RỦI RO NGẮN HẠN:**
- Fear & Greed: ${context.shortTerm.fearGreedIndex} (${context.shortTerm.fearGreedIndex >= 80 || context.shortTerm.fearGreedIndex <= 20 ? 'Cực đoan' : 'Bình thường'})
- Funding Rate: ${(context.shortTerm.fundingRate * 100).toFixed(3)}% (${Math.abs(context.shortTerm.fundingRate) > 0.01 ? 'Cao' : 'Bình thường'})
- Biến động: ${context.shortTerm.volatility.toFixed(2)}%

Hãy phân tích:

1. **ĐÁNH GIÁ RỦI RO TỔNG THỂ:**
   - Mức độ rủi ro: LOW/MEDIUM/HIGH
   - Điểm số rủi ro (0-100)
   - Lý do đánh giá

2. **CÁC YẾU TỐ RỦI RO CHÍNH:**
   - Rủi ro định giá
   - Rủi ro kỹ thuật
   - Rủi ro thị trường
   - Rủi ro thanh khoản
   - Rủi ro đòn bẩy

3. **KHUYẾN NGHỊ POSITION SIZING:**
   - Portfolio size: 1-5% (bảo thủ)
   - Portfolio size: 6-10% (độ vừa mạo hiểm)
   - Portfolio size: 11-15% (mạo hiểm)
   - Lý do cho từng mức

4. **CHIẾN LƯỢC GIẢM THIỂU RỦI RO:**
   - Diversification đề xuất
   - Hedging strategies
   - Stop loss placement
   - Take profit levels

5. **KỊCH BẢN RỦI RO:**
   - Kịch bản xấu nhất
   - Kịch bản cơ sở
   - Kịch bản tốt nhất
   - Xác suất từng kịch bản

Format phản hồi JSON:
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
      "reasoning": "lý do",
      "maxAllocation": "$số"
    },
    "moderate": {
      "percentage": "6-10%",
      "reasoning": "lý do",
      "maxAllocation": "$số"
    },
    "aggressive": {
      "percentage": "11-15%",
      "reasoning": "lý do",
      "maxAllocation": "$số"
    }
  },
  "riskMitigation": {
    "diversification": "chiến lược đa dạng hóa",
    "hedging": "chiến lược phòng ngừa",
    "stopLoss": "chiến lược stop loss",
    "takeProfit": "chiến lược chốt lời"
  },
  "riskScenarios": {
    "worstCase": {
      "scenario": "mô tả",
      "probability": 0-100,
      "potentialLoss": "%"
    },
    "baseCase": {
      "scenario": "mô tả",
      "probability": 0-100,
      "potentialReturn": "%"
    },
    "bestCase": {
      "scenario": "mô tả",
      "probability": 0-100,
      "potentialReturn": "%"
    }
  },
  "recommendations": ["khuyến nghị 1", "khuyến nghị 2", "khuyến nghị 3"],
  "confidence": 0-100
}`;
}
```

---

## 4. TÍCH HỢP VÀO HỆ THỐNG v2.0

### 4.1 Enhanced AI Analysis Service

```typescript
export class EnhancedAIAnalysisService {
  private async executeEnhancedAIAnalysis(
    provider: 'Z.AI' | 'ChatGPT', 
    context: EnhancedAIPromptContext, 
    analysisType: 'multitimeframe' | 'entryexit' | 'riskmanagement'
  ): Promise<EnhancedAIAnalysisResult> {
    let prompt: string;
    
    switch (analysisType) {
      case 'multitimeframe':
        prompt = EnhancedAIPromptTemplates.getMultiTimeframeAnalysisPrompt(context);
        break;
      case 'entryexit':
        prompt = EnhancedAIPromptTemplates.getEntryExitAnalysisPrompt(context);
        break;
      case 'riskmanagement':
        prompt = EnhancedAIPromptTemplates.getRiskManagementAnalysisPrompt(context);
        break;
      default:
        prompt = EnhancedAIPromptTemplates.getMultiTimeframeAnalysisPrompt(context);
    }

    const response = await this.callAIProvider(provider, prompt);
    return this.parseEnhancedAIResponse(response, provider, analysisType);
  }

  private async callAIProvider(provider: 'Z.AI' | 'ChatGPT', prompt: string): Promise<any> {
    try {
      if (provider === 'Z.AI') {
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
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
        return completion.choices[0]?.message?.content;
      } else {
        // ChatGPT implementation
        return await this.callChatGPTAPI(prompt);
      }
    } catch (error) {
      throw new Error(`${provider} analysis failed: ${error.message}`);
    }
  }
}
```

### 4.2 Enhanced Configuration

```typescript
export interface EnhancedAIAnalysisConfig {
  providers: ('Z.AI' | 'ChatGPT')[];
  analysisTypes: ('multitimeframe' | 'entryexit' | 'riskmanagement')[];
  timeout: number;
  retryAttempts: number;
  enableFallback: boolean;
  enhancedDataCollection: boolean;
}

const enhancedConfig: EnhancedAIAnalysisConfig = {
  providers: ['Z.AI', 'ChatGPT'],
  analysisTypes: ['multitimeframe', 'entryexit', 'riskmanagement'],
  timeout: 45000,
  retryAttempts: 3,
  enableFallback: true,
  enhancedDataCollection: true
};
```

### 4.3 Enhanced Data Collection

```typescript
export class EnhancedDataCollector {
  async collectEnhancedMarketData(coinId: string): Promise<EnhancedAIPromptContext> {
    const [marketData, onChainData, technicalData, sentimentData, derivativesData] = await Promise.all([
      this.getBasicMarketData(coinId),
      this.getOnChainMetrics(coinId),
      this.getTechnicalIndicators(coinId),
      this.getSentimentData(coinId),
      this.getDerivativesData(coinId)
    ]);

    return this.organizeDataByTimeframe(marketData, onChainData, technicalData, sentimentData, derivativesData);
  }

  private organizeDataByTimeframe(...dataSources): EnhancedAIPromptContext {
    // Organize data into long-term, medium-term, and short-term categories
    // This is where the magic happens - categorizing 47+ indicators by timeframe
    return {
      // Basic info
      coinId: dataSources[0].coinId,
      coinName: dataSources[0].coinName,
      currentPrice: dataSources[0].currentPrice,
      priceChange24h: dataSources[0].priceChange24h,
      priceChange7d: dataSources[0].priceChange7d,
      priceChange30d: dataSources[0].priceChange30d,
      marketCap: dataSources[0].marketCap,
      volume24h: dataSources[0].volume24h,
      
      // Long-term metrics
      longTerm: {
        mvrv: dataSources[1].mvrv,
        nupl: dataSources[1].nupl,
        sopr: dataSources[1].sopr,
        activeAddresses30d: dataSources[1].activeAddresses30d,
        networkGrowth: dataSources[1].networkGrowth,
        holderDistribution: dataSources[1].holderDistribution,
        realizedCap: dataSources[1].realizedCap,
        thermocapRatio: dataSources[1].thermocapRatio,
        stockToFlow: dataSources[1].stockToFlow,
        hodlWaves: dataSources[1].hodlWaves
      },
      
      // Medium-term metrics
      mediumTerm: {
        rsi: dataSources[2].rsi,
        ma50: dataSources[2].ma50,
        ma200: dataSources[2].ma200,
        macd: dataSources[2].macd,
        bollingerUpper: dataSources[2].bollingerUpper,
        bollingerLower: dataSources[2].bollingerLower,
        volumeProfile: dataSources[2].volumeProfile,
        priceChannels: dataSources[2].priceChannels,
        marketStructure: dataSources[2].marketStructure,
        correlationWithBTC: dataSources[2].correlationWithBTC
      },
      
      // Short-term metrics
      shortTerm: {
        fearGreedIndex: dataSources[3].fearGreedIndex,
        fearGreedClassification: dataSources[3].fearGreedClassification,
        twitterSentiment: dataSources[3].twitterSentiment,
        redditSentiment: dataSources[3].redditSentiment,
        socialVolume: dataSources[3].socialVolume,
        newsSentiment: dataSources[3].newsSentiment,
        newsVolume: dataSources[3].newsVolume,
        googleTrendsScore: dataSources[3].googleTrendsScore,
        googleTrendsDirection: dataSources[3].googleTrendsDirection,
        fundingRate: dataSources[4].fundingRate,
        openInterest: dataSources[4].openInterest,
        liquidationVolume: dataSources[4].liquidationVolume,
        putCallRatio: dataSources[4].putCallRatio,
        tradingSignal: dataSources[4].tradingSignal,
        signalConfidence: dataSources[4].signalConfidence,
        signalRisk: dataSources[4].signalRisk,
        volatility: dataSources[4].volatility,
        orderBookDepth: dataSources[4].orderBookDepth
      }
    };
  }
}
```

---

## 5. XỬ LÝ LỖI VÀ FALLBACK v2.0

### 5.1 Enhanced Error Handling with Clear Messaging

```typescript
export class EnhancedAIAnalysisService {
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
    errorMessage?: string;
  }> {
    const providerStatus = {
      zai: 'not_available' as const,
      chatgpt: 'not_available' as const
    };
    
    let lastError: string | null = null;
    let fallbackResult: EnhancedAIAnalysisResult | null = null;

    // Try Z.AI first
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

    // Try ChatGPT as fallback
    try {
      console.log(`🤖 [ChatGPT] Attempting ${analysisType} analysis as fallback...`);
      const chatgptResult = await this.executeEnhancedAIAnalysis('ChatGPT', context, analysisType);
      providerStatus.chatgpt = 'success';
      
      return {
        success: true,
        data: chatgptResult,
        fallbackUsed: true,
        providerStatus,
        errorMessage: `Z.AI failed (${lastError}), using ChatGPT fallback`
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'ChatGPT analysis failed';
      providerStatus.chatgpt = 'failed';
      console.warn(`❌ [ChatGPT] Analysis failed: ${lastError}`);
    }

    // Ultimate fallback to rule-based analysis
    try {
      console.log(`🤖 [Rule-based] Generating fallback analysis...`);
      fallbackResult = await this.generateEnhancedRuleBasedAnalysis(context, analysisType);
      
      return {
        success: true,
        data: fallbackResult,
        fallbackUsed: true,
        providerStatus,
        errorMessage: `Both AI providers failed. Z.AI: ${providerStatus.zai === 'failed' ? lastError : 'N/A'}, ChatGPT: ${providerStatus.chatgpt === 'failed' ? lastError : 'N/A'}. Using rule-based fallback analysis.`
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Rule-based analysis failed';
      console.error(`❌ [Rule-based] Analysis failed: ${lastError}`);
      
      return {
        success: false,
        fallbackUsed: true,
        providerStatus,
        errorMessage: `All analysis methods failed. Last error: ${lastError}`
      };
    }
  }
}
```

### 5.2 Dashboard Error Messaging

```typescript
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

export function getAnalysisStatusMessage(analysisResult: any): AnalysisStatusMessage {
  const timestamp = new Date().toISOString();
  
  if (!analysisResult.success) {
    return {
      type: 'error',
      title: 'Lỗi Phân Tích',
      message: 'Không thể thực hiện phân tích. Vui lòng thử lại sau.',
      details: analysisResult.errorMessage,
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
      details: analysisResult.errorMessage,
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
```

---

## 6. PERFORMANCE VÀ OPTIMIZATION v2.0

### 6.1 Enhanced Caching Strategy

```typescript
export class EnhancedAnalysisCache {
  private cache = new Map<string, CachedEnhancedAnalysis>();
  private readonly CACHE_DURATION = {
    multitimeframe: 60 * 60 * 1000, // 1 hour
    entryexit: 30 * 60 * 1000,      // 30 minutes
    riskmanagement: 45 * 60 * 1000   // 45 minutes
  };

  async getCachedAnalysis(
    coinId: string,
    analysisType: 'multitimeframe' | 'entryexit' | 'riskmanagement'
  ): Promise<EnhancedAIAnalysisResult | null> {
    const cacheKey = this.generateCacheKey(coinId, analysisType);
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isExpired(cached, analysisType)) {
      console.log(`🎯 [Cache] Using cached ${analysisType} analysis for ${coinId}`);
      return cached.data;
    }
    
    return null;
  }

  private generateCacheKey(coinId: string, analysisType: string): string {
    return `${coinId}_${analysisType}_${Date.now()}`;
  }

  private isExpired(cached: CachedEnhancedAnalysis, analysisType: string): boolean {
    const age = Date.now() - cached.timestamp;
    return age > this.CACHE_DURATION[analysisType];
  }
}
```

### 6.2 Parallel Analysis Execution

```typescript
export class ParallelAnalysisExecutor {
  async executeParallelAnalysis(
    context: EnhancedAIPromptContext
  ): Promise<{
    multitimeframe?: EnhancedAIAnalysisResult;
    entryexit?: EnhancedAIAnalysisResult;
    riskmanagement?: EnhancedAIAnalysisResult;
    executionTime: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    const analysisPromises = [
      this.executeAnalysisType('multitimeframe', context),
      this.executeAnalysisType('entryexit', context),
      this.executeAnalysisType('riskmanagement', context)
    ];

    const results = await Promise.allSettled(analysisPromises);
    
    const finalResults: any = {
      executionTime: Date.now() - startTime,
      errors
    };

    results.forEach((result, index) => {
      const analysisType = ['multitimeframe', 'entryexit', 'riskmanagement'][index];
      
      if (result.status === 'fulfilled') {
        finalResults[analysisType] = result.value;
      } else {
        errors.push(`${analysisType} analysis failed: ${result.reason}`);
      }
    });

    return finalResults;
  }
}
```

---

## 7. BACKWARD COMPATIBILITY

### 7.1 API Enhancement with Version Support

```typescript
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const analysisType = searchParams.get('analysisType') || 'basic';
  const coinId = searchParams.get('coinId') || 'bitcoin';
  
  try {
    if (analysisType === 'enhanced') {
      // Use new enhanced analysis
      return await performEnhancedAIAnalysis(coinId, await request.json());
    } else {
      // Use original analysis for backward compatibility
      return await performBasicAIAnalysis(coinId, await request.json());
    }
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### 7.2 Data Transformation Layer

```typescript
export class AnalysisDataTransformer {
  static transformToEnhancedFormat(basicData: any): EnhancedAIPromptContext {
    // Transform basic data structure to enhanced format
    // This ensures backward compatibility while enabling new features
    return {
      coinId: basicData.coinId,
      coinName: basicData.coinName,
      currentPrice: basicData.currentPrice,
      priceChange24h: basicData.priceChange24h,
      priceChange7d: basicData.priceChange7d || 0,
      priceChange30d: basicData.priceChange30d || 0,
      marketCap: basicData.marketCap,
      volume24h: basicData.volume24h,
      
      longTerm: {
        mvrv: basicData.mvrv || 1,
        nupl: basicData.nupl || 0,
        sopr: basicData.sopr || 1,
        activeAddresses30d: basicData.activeAddresses || 0,
        networkGrowth: 0,
        holderDistribution: 0,
        realizedCap: 0,
        thermocapRatio: 0,
        stockToFlow: 0,
        hodlWaves: []
      },
      
      mediumTerm: {
        rsi: basicData.rsi || 50,
        ma50: basicData.ma50 || basicData.currentPrice,
        ma200: basicData.ma200 || basicData.currentPrice,
        macd: basicData.macd || 0,
        bollingerUpper: basicData.bollingerUpper || basicData.currentPrice * 1.1,
        bollingerLower: basicData.bollingerLower || basicData.currentPrice * 0.9,
        volumeProfile: 0,
        priceChannels: {
          upper: basicData.currentPrice * 1.05,
          lower: basicData.currentPrice * 0.95
        },
        marketStructure: 'RANGING',
        correlationWithBTC: 0.8
      },
      
      shortTerm: {
        fearGreedIndex: basicData.fearGreedIndex || 50,
        fearGreedClassification: basicData.fearGreedClassification || 'Neutral',
        twitterSentiment: 0,
        redditSentiment: 0,
        socialVolume: 0,
        newsSentiment: 0,
        newsVolume: 0,
        googleTrendsScore: 0,
        googleTrendsDirection: 'stable',
        fundingRate: basicData.fundingRate || 0,
        openInterest: basicData.openInterest || 0,
        liquidationVolume: 0,
        putCallRatio: 1,
        tradingSignal: basicData.tradingSignal || 'HOLD',
        signalConfidence: basicData.signalConfidence || 50,
        signalRisk: basicData.signalRisk || 'MEDIUM',
        volatility: 0,
        orderBookDepth: {
          bids: 0,
          asks: 0
        }
      }
    };
  }
}
```

---

## 8. DEPLOYMENT VÀ TESTING

### 8.1 Deployment Strategy

1. **Phase 1**: Deploy enhanced prompts and data collection
2. **Phase 2**: Deploy enhanced analysis service
3. **Phase 3**: Deploy enhanced error handling and messaging
4. **Phase 4**: Deploy dashboard updates for enhanced error display

### 8.2 Testing Checklist

- [ ] Enhanced data collection works correctly
- [ ] Multi-timeframe analysis generates valid results
- [ ] Entry-exit analysis provides specific price levels
- [ ] Risk management analysis gives proper position sizing
- [ ] Error handling shows clear messages on dashboard
- [ ] Fallback mechanism works when AI fails
- [ ] Backward compatibility maintained for existing API
- [ ] Performance is acceptable with enhanced analysis

---

## 9. KẾT LUẬN

Phiên bản 2.0 của hệ thống AI Prompt Templates mang lại những cải tiến đáng kể:

1. **Phân tích đa khung thời gian**: Cung cấp cái nhìn toàn diện từ dài hạn đến ngắn hạn
2. **Khuyến nghị giao dịch chi tiết**: Điểm vào/thoát cụ thể với stop loss và take profit
3. **Quản lý rủi ro chuyên nghiệp**: Position sizing và risk-reward ratio rõ ràng
4. **Xử lý lỗi minh bạch**: Người dùng luôn biết khi nào đang sử dụng dữ liệu fallback
5. **Tương thích ngược**: API cũ vẫn hoạt động bình thường

Hệ thống này sẽ cung cấp phân tích chuyên sâu hơn, giúp người dùng ra quyết định đầu tư tốt hơn với đầy đủ thông tin quản lý rủi ro.