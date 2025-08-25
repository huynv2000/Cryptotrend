'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedMultiLayerDashboard } from '@/components/dashboard/EnhancedMultiLayerDashboard';
import { CoinManagementPanel } from '@/components/CoinManagementPanel';
import { Plus } from 'lucide-react';

interface MarketMetrics {
  currentPrice: number;
  priceChange: number;
  volume24h: number;
  marketCap: number;
  fearGreedIndex: number;
  rsi: number;
  type: string;
}

interface AIAnalysis {
  jdkAnalysis: string;
  chatGPTAnalysis: string;
  overallSentiment: string;
}

interface DashboardData {
  onChain: any;
  technical: any;
  sentiment: any;
  derivatives: any;
}

interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
  confidence: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  conditions: any;
  triggers: string[];
}

interface Alert {
  id: string;
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  category: string;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  coinId: string;
  actionRequired: boolean;
  recommendedAction?: string;
}

export default function Home() {
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [tradingSignal, setTradingSignal] = useState<TradingSignal | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [availableCoins, setAvailableCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchAvailableCoins();
    fetchAllData();
  }, [selectedCoin]);

  const fetchAvailableCoins = async () => {
    try {
      const response = await fetch('/api/cryptocurrencies?activeOnly=true');
      if (response.ok) {
        const coins = await response.json();
        setAvailableCoins(coins);
        
        // Set selected coin to first available if current selection is not available
        if (coins.length > 0 && !coins.find((c: any) => c.coinGeckoId === selectedCoin)) {
          setSelectedCoin(coins[0].coinGeckoId);
        }
      }
    } catch (error) {
      console.error('Error fetching available coins:', error);
      // Fallback to default coins
      setAvailableCoins([
        { coinGeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
        { coinGeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
        { coinGeckoId: 'binancecoin', symbol: 'BNB', name: 'Binance Coin' },
        { coinGeckoId: 'solana', symbol: 'SOL', name: 'Solana' }
      ]);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic metrics (mock data for demo)
      const mockMetrics: MarketMetrics = {
        currentPrice: 116627,
        priceChange: 1.46,
        volume24h: 43043699449,
        marketCap: 2321404684888,
        fearGreedIndex: 67,
        rsi: 58.5,
        type: 'BUY'
      };

      const mockAIAnalysis: AIAnalysis = {
        jdkAnalysis: "Dựa trên phân tích kỹ thuật, thị trường đang cho thấy xu hướng tăng nhẹ. RSI ở mức trung tính cho thấy không có dấu hiệu quá mua. Khối lượng giao dịch duy trì ổn định.",
        chatGPTAnalysis: "Thị trường crypto đang trong giai đoạn tích cực với sự phục hồi của các đồng chính. Dòng tiền vào thị trường tăng nhẹ, cho thấy nhà đầu tư đang tích lũy.",
        overallSentiment: "Tích cực"
      };

      // Enhanced analysis with AI provider breakdown
      const enhancedAnalysis = {
        recommendation: 'MUA - Bắt đầu tích lũy với tỷ trọng vừa phải',
        timeframe: 'Trung hạn (2-4 tuần)',
        riskFactors: ['Định giá cao'],
        entryPoints: 'Vào lệnh theo đợt khi có tín hiệu xác nhận',
        exitPoints: 'Chốt lời khi MVRV > 2.5 và Fear & Greed > 80',
        stopLoss: 'Stop loss tại mức hỗ trợ kỹ thuật hoặc -15% từ giá mua',
        takeProfit: 'Take profit tại mức kháng cự kỹ thuật hoặc +25% từ giá mua',
        zaiAnalysis: {
          recommendation: 'MUA - Tích lũy dần với chiến lược DCA',
          confidence: 78,
          timeframe: 'Trung hạn (2-4 tuần)',
          breakoutPotential: 'MEDIUM',
          reasoning: 'Z.AI phân tích: MVRV ở mức hợp lý 1.8 cho thấy tài sản không bị định giá quá cao. Fear & Greed ở mức 67 (Greed) nhưng chưa đạt mức cực đoan. Funding rate dương thấp 0.0125% cho thấy áp lực mua vừa phải. RSI 58.5 ở vùng trung tính, không có dấu hiệu quá mua. Các chỉ báo on-chain cho thấy dòng tiền ổn định, whale accumulation đang diễn ra.'
        },
        chatGPTAnalysis: {
          recommendation: 'MUA - Vào lệnh khi có pullback',
          confidence: 82,
          timeframe: 'Ngắn hạn đến trung hạn (1-3 tuần)',
          breakoutPotential: 'HIGH',
          reasoning: 'ChatGPT phân tích: Thị trường đang trong xu hướng tăng với các dấu hiệu tích cực. Volume giao dịch tăng mạnh 43 tỷ USD cho thấy sự quan tâm của nhà đầu tư. MA50 (112K) đang nằm trên MA200 (108K) tạo thành golden cross. MACD dương 145.5 cho thấy đà tăng đang được duy trì. Social sentiment tích cực với Twitter sentiment 0.68 và Reddit sentiment 0.72. Google Trends đang tăng với score 78, cho thấy sự quan tâm của công chúng.'
        }
      };

      // Fetch enhanced dashboard data from database (fast, no API rate limits)
      const dashboardResponse = await fetch(`/api/dashboard?coinId=${selectedCoin}`);
      const dashboardData = await dashboardResponse.json();
      
      // Fetch trading signals from database (fast, no API rate limits)
      const signalResponse = await fetch(`/api/trading-signals-fast?action=signal&coinId=${selectedCoin}`);
      const signalData = await signalResponse.json();
      
      // Fetch alerts from database (fast, no API rate limits)
      const alertsResponse = await fetch(`/api/alerts-fast?action=process-data&coinId=${selectedCoin}`);
      const alertsData = await alertsResponse.json();

      // Create metrics from real dashboard data
      const realMetrics: MarketMetrics = {
        currentPrice: dashboardData.price?.usd || 0,
        priceChange: dashboardData.price?.usd_24h_change || 0,
        volume24h: dashboardData.price?.usd_24h_vol || 0,
        marketCap: dashboardData.price?.usd_market_cap || 0,
        fearGreedIndex: dashboardData.sentiment?.fearGreedIndex || 50,
        rsi: dashboardData.technical?.rsi || 50,
        type: signalData.signal?.type || 'HOLD'
      };

      // Fetch AI analysis using real data
      const aiAnalysisResponse = await fetch(`/api/ai-analysis?action=analyze&coinId=${selectedCoin}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketData: dashboardData,
          tradingSignal: signalData.signal,
          alerts: alertsData.alerts || [],
          coinId: selectedCoin
        })
      });
      
      let aiAnalysisData;
      let enhancedAnalysisData;
      if (aiAnalysisResponse.ok) {
        const aiResponse = await aiAnalysisResponse.json();
        if (aiResponse.success && aiResponse.data) {
          // Use the AI analysis data in the expected format
          enhancedAnalysisData = aiResponse.data;
          aiAnalysisData = {
            jdkAnalysis: aiResponse.data.zaiAnalysis?.reasoning || "Phân tích Z.AI dựa trên dữ liệu thị trường.",
            chatGPTAnalysis: aiResponse.data.chatGPTAnalysis?.reasoning || "Phân tích ChatGPT dựa trên dữ liệu thị trường.",
            overallSentiment: aiResponse.data.recommendation === 'MUA' ? 'Tích cực' : 
                             aiResponse.data.recommendation === 'BÁN' ? 'Tiêu cực' : 'Trung lập'
          };
        } else {
          // Fallback if AI analysis fails
          aiAnalysisData = {
            jdkAnalysis: "Phân tích dựa trên dữ liệu thị trường hiện tại.",
            chatGPTAnalysis: "Thị trường đang hoạt động trong phạm vi bình thường.",
            overallSentiment: "Trung lập"
          };
          enhancedAnalysisData = {
            recommendation: 'GIỮ',
            timeframe: 'Ngắn hạn',
            riskFactors: ['Cần phân tích thêm'],
            entryPoints: 'Chờ tín hiệu xác nhận',
            exitPoints: 'Chốt lời khi có tín hiệu',
            stopLoss: 'Quản lý rủi ro chặt chẽ',
            takeProfit: 'Lợi nhuận vừa phải',
            zaiAnalysis: {
              recommendation: 'GIỮ - Phân tích dữ liệu hiện tại',
              confidence: 60,
              timeframe: 'Ngắn hạn',
              breakoutPotential: 'LOW',
              reasoning: 'Phân tích dựa trên dữ liệu thị trường hiện tại'
            },
            chatGPTAnalysis: {
              recommendation: 'GIỮ - Theo dõi thị trường',
              confidence: 60,
              timeframe: 'Ngắn hạn',
              breakoutPotential: 'LOW',
              reasoning: 'Phân tích dựa trên dữ liệu thị trường gần nhất'
            }
          };
        }
      } else {
        // Fallback to basic analysis if AI analysis fails
        aiAnalysisData = {
          jdkAnalysis: "Phân tích dựa trên dữ liệu thị trường hiện tại.",
          chatGPTAnalysis: "Thị trường đang hoạt động trong phạm vi bình thường.",
          overallSentiment: "Trung lập"
        };
        enhancedAnalysisData = {
          recommendation: 'GIỮ',
          timeframe: 'Ngắn hạn',
          riskFactors: ['Cần phân tích thêm'],
          entryPoints: 'Chờ tín hiệu xác nhận',
          exitPoints: 'Chốt lời khi có tín hiệu',
          stopLoss: 'Quản lý rủi ro chặt chẽ',
          takeProfit: 'Lợi nhuận vừa phải',
          zaiAnalysis: {
            recommendation: 'GIỮ - Phân tích dữ liệu hiện tại',
            confidence: 60,
            timeframe: 'Ngắn hạn',
            breakoutPotential: 'LOW',
            reasoning: 'Phân tích dựa trên dữ liệu thị trường hiện tại'
          },
          chatGPTAnalysis: {
            recommendation: 'GIỮ - Theo dõi thị trường',
            confidence: 60,
            timeframe: 'Ngắn hạn',
            breakoutPotential: 'LOW',
            reasoning: 'Phân tích dựa trên dữ liệu thị trường gần nhất'
          }
        };
      }

      setMetrics(realMetrics);
      setAiAnalysis(aiAnalysisData);
      setDashboardData(dashboardData);
      setTradingSignal(signalData.signal);
      setAnalysis(enhancedAnalysisData); // Use the enhanced AI analysis data instead of fallback data
      setAlerts(alertsData.alerts || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to mock data
      const fallbackData = getFallbackData();
      setMetrics(fallbackData.metrics);
      setAiAnalysis(fallbackData.aiAnalysis);
      setDashboardData(fallbackData.dashboardData);
      setTradingSignal(fallbackData.tradingSignal);
      setAnalysis(fallbackData.analysis);
      setAlerts(fallbackData.alerts);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackData = () => {
    const fallbackMetrics: MarketMetrics = {
      currentPrice: 116627,
      priceChange: 1.46,
      volume24h: 43043699449,
      marketCap: 2321404684888,
      fearGreedIndex: 67,
      rsi: 58.5,
      type: 'BUY'
    };

    const fallbackAIAnalysis: AIAnalysis = {
      jdkAnalysis: "Dựa trên phân tích kỹ thuật, thị trường đang cho thấy xu hướng tăng nhẹ. RSI ở mức trung tính cho thấy không có dấu hiệu quá mua.",
      chatGPTAnalysis: "Thị trường crypto đang trong giai đoạn tích cực với sự phục hồi của các đồng chính.",
      overallSentiment: "Tích cực"
    };

    const fallbackDashboardData: DashboardData = {
      onChain: {
        mvrv: 1.8,
        nupl: 0.65,
        sopr: 1.02,
        activeAddresses: 950000,
        exchangeInflow: 15000,
        exchangeOutflow: 12000,
        transactionVolume: 25000000000,
        supplyDistribution: {
          whaleHoldings: { percentage: 42.3, addressCount: 850 },
          retailHoldings: { percentage: 38.7, addressCount: 42000000 },
          exchangeHoldings: { percentage: 12.5, addressCount: 150 },
          otherHoldings: { percentage: 6.5, addressCount: 120000 }
        },
        whaleHoldingsPercentage: 42.3,
        retailHoldingsPercentage: 38.7,
        exchangeHoldingsPercentage: 12.5
      },
      technical: {
        rsi: 58.5,
        ma50: 112000,
        ma200: 108000,
        macd: 145.5,
        bollingerUpper: 122000,
        bollingerLower: 111000,
        bollingerMiddle: 116627
      },
      sentiment: {
        fearGreedIndex: 67,
        fearGreedClassification: 'Greed',
        social: {
          twitterSentiment: 0.68,
          redditSentiment: 0.72,
          socialVolume: 45000,
          engagementRate: 0.085,
          influencerSentiment: 0.75,
          trendingScore: 85
        },
        news: {
          newsSentiment: 0.62,
          newsVolume: 1250,
          positiveNewsCount: 780,
          negativeNewsCount: 320,
          neutralNewsCount: 150,
          sentimentScore: 0.62,
          buzzScore: 75
        },
        googleTrends: {
          trendsScore: 78,
          searchVolume: 850000,
          trendingKeywords: ['bitcoin price', 'btc news', 'bitcoin mining'],
          regionalInterest: {
            US: 85,
            CN: 72,
            EU: 68,
            JP: 45,
            KR: 52
          },
          relatedQueries: [
            { query: 'bitcoin price today', score: 95, rising: true },
            { query: 'bitcoin prediction', score: 78, rising: true },
            { query: 'bitcoin mining', score: 65, rising: false }
          ],
          trendDirection: 'rising'
        }
      },
      derivatives: {
        openInterest: 18500000000,
        fundingRate: 0.0125,
        liquidationVolume: 45000000,
        putCallRatio: 0.85
      }
    };

    const fallbackTradingSignal: TradingSignal = {
      type: 'BUY',
      confidence: 78,
      reasoning: 'Tín hiệu MUA: MVRV ở mức hợp lý, Fear & Greed ở vùng trung lập, funding rate dương thấp. Thị trường đang cho dấu hiệu tích lũy.',
      riskLevel: 'MEDIUM',
      conditions: {
        mvrv: 1.8,
        fearGreed: 67,
        fundingRate: 0.0125,
        sopr: 1.02,
        rsi: 58.5,
        nupl: 0.65,
        volumeTrend: 'increasing',
        extremeDetected: false
      },
      triggers: ['MVRV hợp lý', 'Dòng tiền ổn định']
    };

    const fallbackAnalysis = {
      recommendation: 'MUA - Bắt đầu tích lũy với tỷ trọng vừa phải',
      timeframe: 'Trung hạn (2-4 tuần)',
      riskFactors: ['Định giá cao'],
      entryPoints: 'Vào lệnh theo đợt khi có tín hiệu xác nhận',
      exitPoints: 'Chốt lời khi MVRV > 2.5 và Fear & Greed > 80',
      stopLoss: 'Stop loss tại mức hỗ trợ kỹ thuật hoặc -15% từ giá mua',
      takeProfit: 'Take profit tại mức kháng cự kỹ thuật hoặc +25% từ giá mua',
      zaiAnalysis: {
        recommendation: 'MUA - Tích lũy dần với chiến lược DCA',
        confidence: 78,
        timeframe: 'Trung hạn (2-4 tuần)',
        breakoutPotential: 'MEDIUM',
        reasoning: 'Z.AI phân tích: MVRV ở mức hợp lý 1.8 cho thấy tài sản không bị định giá quá cao. Fear & Greed ở mức 67 (Greed) nhưng chưa đạt mức cực đoan. Funding rate dương thấp 0.0125% cho thấy áp lực mua vừa phải. RSI 58.5 ở vùng trung tính, không có dấu hiệu quá mua. Các chỉ báo on-chain cho thấy dòng tiền ổn định, whale accumulation đang diễn ra.'
      },
      chatGPTAnalysis: {
        recommendation: 'MUA - Vào lệnh khi có pullback',
        confidence: 82,
        timeframe: 'Ngắn hạn đến trung hạn (1-3 tuần)',
        breakoutPotential: 'HIGH',
        reasoning: 'ChatGPT phân tích: Thị trường đang trong xu hướng tăng với các dấu hiệu tích cực. Volume giao dịch tăng mạnh 43 tỷ USD cho thấy sự quan tâm của nhà đầu tư. MA50 (112K) đang nằm trên MA200 (108K) tạo thành golden cross. MACD dương 145.5 cho thấy đà tăng đang được duy trì. Social sentiment tích cực với Twitter sentiment 0.68 và Reddit sentiment 0.72. Google Trends đang tăng với score 78, cho thấy sự quan tâm của công chúng.'
      }
    };

    const fallbackAlerts: Alert[] = [
      {
        id: 'alert_1',
        type: 'INFO',
        category: 'VOLUME',
        title: 'Volume Spike Detected',
        message: 'Volume increased by 150% - indicating strong market interest.',
        severity: 'LOW',
        timestamp: new Date(),
        coinId: 'bitcoin',
        actionRequired: false,
        recommendedAction: 'Monitor for trend continuation'
      },
      {
        id: 'alert_2',
        type: 'WARNING',
        category: 'FUNDING_RATE',
        title: 'High Funding Rate Detected',
        message: 'Funding rate at 0.125% indicates strong long pressure.',
        severity: 'MEDIUM',
        timestamp: new Date(),
        coinId: 'bitcoin',
        actionRequired: true,
        recommendedAction: 'Monitor for potential long squeeze'
      }
    ];

    return {
      metrics: fallbackMetrics,
      aiAnalysis: fallbackAIAnalysis,
      dashboardData: fallbackDashboardData,
      tradingSignal: fallbackTradingSignal,
      analysis: fallbackAnalysis,
      alerts: fallbackAlerts
    };
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'STRONG_BUY': return 'bg-green-600 text-white';
      case 'BUY': return 'bg-green-500 text-white';
      case 'HOLD': return 'bg-yellow-500 text-white';
      case 'SELL': return 'bg-orange-500 text-white';
      case 'STRONG_SELL': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSentimentColor = (value: number) => {
    if (value <= 25) return 'text-red-600';
    if (value <= 45) return 'text-orange-500';
    if (value <= 55) return 'text-yellow-500';
    if (value <= 75) return 'text-green-500';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu thị trường...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚀 Crypto Analytics Dashboard Pro
              </h1>
              <p className="text-gray-600 mt-1">
                Hệ thống phân tích và dự báo thị trường Crypto chuyên sâu 2023-nay
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${metrics?.currentPrice.toLocaleString()}
                  </div>
                  <div className={`text-sm ${metrics?.priceChange && metrics.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics?.priceChange && metrics.priceChange >= 0 ? '+' : ''}{metrics?.priceChange.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Coin Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Select Coin:</label>
            <select 
              value={selectedCoin} 
              onChange={(e) => setSelectedCoin(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              {availableCoins.map((coin) => (
                <option key={coin.coinGeckoId} value={coin.coinGeckoId}>
                  {coin.name} ({coin.symbol})
                </option>
              ))}
            </select>
            <Button onClick={fetchAllData} variant="outline">
              🔄 Refresh Data
            </Button>
            <Link href="/coin-management">
              <Button variant="outline">
                ⚙️ Manage Coins
              </Button>
            </Link>
            <Button 
              onClick={() => {
                // Direct add coin functionality could be added here
                // For now, redirect to coin management page
                window.location.href = '/coin-management';
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm Coin Mới
            </Button>
          </div>
          {availableCoins.length === 0 && (
            <div className="mt-2 text-sm text-gray-500">
              No coins available.{' '}
              <Link href="/coin-management" className="text-blue-600 hover:underline">
                Add coins to get started
              </Link>
            </div>
          )}
        </div>

        {/* Enhanced Multi-Layer Dashboard */}
        {dashboardData && tradingSignal && (
          <EnhancedMultiLayerDashboard 
            selectedCoin={selectedCoin}
            data={dashboardData}
            signal={tradingSignal}
            alerts={alerts}
            analysis={analysis}
          />
        )}

        {/* Feature Navigation */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🛠️ Tính năng phân tích chuyên sâu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/volume">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 Volume Analysis
                  </CardTitle>
                  <CardDescription>
                    Phân tích khối lượng giao dịch chuyên sâu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Xem chi tiết</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/price">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💰 Price Analysis
                  </CardTitle>
                  <CardDescription>
                    Phân tích giá và xu hướng thị trường
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Xem chi tiết</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/technical">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📈 Technical Indicators
                  </CardTitle>
                  <CardDescription>
                    Các chỉ báo kỹ thuật quan trọng
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Xem chi tiết</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/sentiment">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    😊 Sentiment Analysis
                  </CardTitle>
                  <CardDescription>
                    Phân tích tâm lý thị trường
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Xem chi tiết</Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* AI Analysis Feature */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🤖 AI Analysis Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/data-collection">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🔄 Data Collection & AI Analysis
                  </CardTitle>
                  <CardDescription>
                    Thu thập dữ liệu thời gian thực và phân tích AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Xem chi tiết</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/test-ai-analysis">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🤖 AI Analysis Testing
                  </CardTitle>
                  <CardDescription>
                    Test và validate hệ thống AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Test AI System</Button>
                </CardContent>
              </Card>
            </Link>

            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚙️ Quản lý Coin
                </CardTitle>
                <CardDescription>
                  Thêm và quản lý các đồng coin mới
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/coin-management">
                  <Button className="w-full">Quản lý Coin</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧠 AI-Powered Insights
                </CardTitle>
                <CardDescription>
                  Nhận định thị trường từ nhiều AI providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => {
                  // Scroll to AI Analysis tab
                  const dashboard = document.querySelector('[value="ai-analysis"]');
                  if (dashboard) {
                    (dashboard as HTMLElement).click();
                  }
                }}>
                  View AI Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced AI Analysis Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🤖 Phân tích AI thông minh
              </h2>
              <p className="text-gray-600">
                Phân tích chuyên sâu từ Z.AI và ChatGPT dựa trên dữ liệu thị trường thời gian thực
              </p>
            </div>
            {!analysis && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Đang phân tích...</span>
              </div>
            )}
          </div>

          {analysis ? (
            <div className="space-y-6">
              {/* AI Summary Card */}
              <Card className="border-2 border-gradient-to-r from-blue-500 to-purple-600 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      📊
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">Tổng hợp nhận định AI</span>
                        <Badge 
                          variant={analysis.recommendation?.includes('MUA') ? 'default' : 
                                  analysis.recommendation?.includes('BÁN') ? 'destructive' : 'secondary'}
                          className="text-sm px-3 py-1"
                        >
                          {analysis.recommendation || 'N/A'}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">
                        Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysis.recommendation || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Khuyến nghị</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analysis.timeframe || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Khung thời gian</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((analysis.zaiAnalysis?.confidence || 0 + analysis.chatGPTAnalysis?.confidence || 0) / 2)}%
                      </div>
                      <div className="text-sm text-gray-600">Độ tin cậy TB</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {analysis.riskFactors?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Yếu tố rủi ro</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">⚠️ Yếu tố rủi ro chính</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.riskFactors?.map((risk: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs border-orange-200 text-orange-700">
                          {risk}
                        </Badge>
                      )) || (
                        <span className="text-sm text-gray-500">Không có yếu tố rủi ro đáng kể</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Providers Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Z.AI Analysis */}
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        Z
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>Z.AI Analysis</span>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {analysis.zaiAnalysis?.confidence || 0}% tin cậy
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          Phân tích đa chiều từ dữ liệu thị trường
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Khuyến nghị</div>
                        <Badge 
                          variant={analysis.zaiAnalysis?.recommendation?.includes('MUA') ? 'default' : 
                                  analysis.zaiAnalysis?.recommendation?.includes('BÁN') ? 'destructive' : 'secondary'}
                          className="w-full justify-center"
                        >
                          {analysis.zaiAnalysis?.recommendation || 'N/A'}
                        </Badge>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Tiềm năng</div>
                        <Badge 
                          variant={analysis.zaiAnalysis?.breakoutPotential === 'HIGH' ? 'default' : 
                                  analysis.zaiAnalysis?.breakoutPotential === 'MEDIUM' ? 'secondary' : 'outline'}
                          className="w-full justify-center"
                        >
                          {analysis.zaiAnalysis?.breakoutPotential || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">⏰ Khung thời gian</div>
                      <div className="font-medium text-purple-900">
                        {analysis.zaiAnalysis?.timeframe || 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-2">🧠 Phân tích chi tiết</div>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed border-l-4 border-l-blue-300">
                        {analysis.zaiAnalysis?.reasoning || 'Đang phân tích...'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ChatGPT Analysis */}
                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                        C
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>ChatGPT Analysis</span>
                          <Badge variant="outline" className="border-green-200 text-green-700">
                            {analysis.chatGPTAnalysis?.confidence || 0}% tin cậy
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          Phân tích kỹ thuật và chỉ báo thị trường
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Khuyến nghị</div>
                        <Badge 
                          variant={analysis.chatGPTAnalysis?.recommendation?.includes('MUA') ? 'default' : 
                                  analysis.chatGPTAnalysis?.recommendation?.includes('BÁN') ? 'destructive' : 'secondary'}
                          className="w-full justify-center"
                        >
                          {analysis.chatGPTAnalysis?.recommendation || 'N/A'}
                        </Badge>
                      </div>
                      
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Tiềm năng</div>
                        <Badge 
                          variant={analysis.chatGPTAnalysis?.breakoutPotential === 'HIGH' ? 'default' : 
                                  analysis.chatGPTAnalysis?.breakoutPotential === 'MEDIUM' ? 'secondary' : 'outline'}
                          className="w-full justify-center"
                        >
                          {analysis.chatGPTAnalysis?.breakoutPotential || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">⏰ Khung thời gian</div>
                      <div className="font-medium text-blue-900">
                        {analysis.chatGPTAnalysis?.timeframe || 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-2">🧠 Phân tích chi tiết</div>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed border-l-4 border-l-green-300">
                        {analysis.chatGPTAnalysis?.reasoning || 'Đang phân tích...'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trading Recommendations */}
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      💼
                    </div>
                    Chiến lược giao dịch đề xuất
                  </CardTitle>
                  <CardDescription>
                    Khuyến nghị dựa trên phân tích AI và quản lý rủi ro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          📥 Điểm vào lệnh
                        </h4>
                        <p className="text-sm text-gray-700">{analysis.entryPoints || 'N/A'}</p>
                      </div>
                      
                      <div className="p-4 bg-white rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          📤 Điểm chốt lời
                        </h4>
                        <p className="text-sm text-gray-700">{analysis.exitPoints || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          🛑 Stop Loss
                        </h4>
                        <p className="text-sm text-gray-700">{analysis.stopLoss || 'N/A'}</p>
                      </div>
                      
                      <div className="p-4 bg-white rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          💰 Take Profit
                        </h4>
                        <p className="text-sm text-gray-700">{analysis.takeProfit || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Đang phân tích dữ liệu AI
                </h3>
                <p className="text-gray-600 text-center max-w-md">
                  Hệ thống đang phân tích dữ liệu thị trường từ Z.AI và ChatGPT để cung cấp khuyến nghị chính xác nhất. Vui lòng chờ trong giây lát...
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* System Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Thông tin hệ thống</CardTitle>
            <CardDescription>
              Hệ thống phân tích crypto theo báo cáo chuyên sâu 2023-nay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="metrics">Chỉ số</TabsTrigger>
                <TabsTrigger value="alerts">Cảnh báo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">🎯 Tính năng chính</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Phân tích On-chain (MVRV, NUPL, SOPR, Active Addresses)</li>
                      <li>• Chỉ báo kỹ thuật (RSI, MA, MACD, Bollinger Bands)</li>
                      <li>• Phân tích tâm lý (Fear & Greed, Social, News, Google Trends)</li>
                      <li>• Dữ liệu phái sinh (Funding Rate, OI, Liquidations)</li>
                      <li>• Hệ thống cảnh báo thời gian thực</li>
                      <li>• Tín hiệu giao dịch phối hợp đa lớp</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">📊 Nguồn dữ liệu</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• CoinGecko (Giá, khối lượng, market cap)</li>
                      <li>• Alternative.me (Fear & Greed Index)</li>
                      <li>• Glassnode/CryptoQuant (On-chain metrics)</li>
                      <li>• Coinglass (Derivatives data)</li>
                      <li>• LunarCrush (Social sentiment)</li>
                      <li>• Google Trends (Search trends)</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">⛓️ On-chain Metrics</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>MVRV Ratio:</strong> Market Value / Realized Value</p>
                      <p><strong>NUPL:</strong> Net Unrealized Profit/Loss</p>
                      <p><strong>SOPR:</strong> Spent Output Profit Ratio</p>
                      <p><strong>Active Addresses:</strong> Số địa chỉ hoạt động</p>
                      <p><strong>Exchange Flows:</strong> Dòng tiền lên/xuống sàn</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">📈 Technical Indicators</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>RSI:</strong> Relative Strength Index</p>
                      <p><strong>MA50/200:</strong> Moving Averages</p>
                      <p><strong>MACD:</strong> Moving Average Convergence Divergence</p>
                      <p><strong>Bollinger Bands:</strong> Volatility bands</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="alerts" className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🚨 Điều kiện cảnh báo</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• <strong>Exchange Flow:</strong> Dòng tiền vào sàn tăng đột biến</p>
                    <p>• <strong>Funding Rate:</strong> &gt; +0.1%/8h hoặc &lt; -0.05%/8h</p>
                    <p>• <strong>Fear & Greed:</strong> &lt; 10 hoặc &gt; 90</p>
                    <p>• <strong>Open Interest:</strong> Đạt đỉnh lịch sử</p>
                    <p>• <strong>Volume:</strong> Biến động đột ngột &gt; 300%</p>
                    <p>• <strong>Volatility:</strong> Biến động giá &gt; 15%</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}