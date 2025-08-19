'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  Clock
} from 'lucide-react';

interface EnhancedAIAnalysisData {
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

interface AnalysisStatusMessage {
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

interface EnhancedAIAnalysisPanelProps {
  coinId: string;
  analysis?: any;
  enhancedAnalysis?: EnhancedAIAnalysisData;
  statusMessage?: AnalysisStatusMessage;
  fallbackUsed?: boolean;
  providerStatus?: {
    zai: 'success' | 'failed' | 'not_available';
    chatgpt: 'success' | 'failed' | 'not_available';
  };
  className?: string;
}

export function EnhancedAIAnalysisPanel({ 
  coinId, 
  analysis, 
  enhancedAnalysis,
  statusMessage,
  fallbackUsed = false,
  providerStatus,
  className = '' 
}: EnhancedAIAnalysisPanelProps) {
  const [analysisData, setAnalysisData] = useState<EnhancedAIAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentStatusMessage, setCurrentStatusMessage] = useState<AnalysisStatusMessage | null>(statusMessage || null);

  const fetchEnhancedAIAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai-analysis?action=analyze&analysisType=enhanced&coinId=${coinId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisSubType: 'multitimeframe',
          coinId
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        setAnalysisData(result.data);
        setCurrentStatusMessage(result.statusMessage);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Failed to fetch enhanced AI analysis');
        setCurrentStatusMessage(result.statusMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setCurrentStatusMessage({
        type: 'error',
        title: 'Lỗi Kết Nối',
        message: 'Không thể kết nối đến dịch vụ AI. Đang sử dụng dữ liệu fallback.',
        details: errorMessage,
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If enhanced analysis data is provided via props, use it
    if (enhancedAnalysis) {
      setAnalysisData(enhancedAnalysis);
      setLastUpdated(new Date());
    } else if (analysis && (analysis.zaiAnalysis || analysis.chatGPTAnalysis)) {
      // Convert legacy analysis to enhanced format
      const convertedData: EnhancedAIAnalysisData = {
        provider: analysis.provider || 'RULE_BASED',
        analysisType: 'MULTI_TIMEFRAME',
        trendAnalysis: {
          longTerm: {
            trend: analysis.recommendation?.includes('MUA') || analysis.recommendation?.includes('BUY') ? 'BULLISH' : 
                     analysis.recommendation?.includes('BÁN') || analysis.recommendation?.includes('SELL') ? 'BEARISH' : 'NEUTRAL',
            confidence: analysis.zaiAnalysis?.confidence || 50,
            reasoning: analysis.zaiAnalysis?.reasoning || 'Long-term analysis based on available data',
            keyDrivers: ['Market trend', 'Technical indicators']
          },
          mediumTerm: {
            trend: analysis.recommendation?.includes('MUA') || analysis.recommendation?.includes('BUY') ? 'BULLISH' : 
                     analysis.recommendation?.includes('BÁN') || analysis.recommendation?.includes('SELL') ? 'BEARISH' : 'NEUTRAL',
            confidence: analysis.chatGPTAnalysis?.confidence || 50,
            reasoning: analysis.chatGPTAnalysis?.reasoning || 'Medium-term analysis based on available data',
            keyDrivers: ['Price action', 'Market sentiment']
          },
          shortTerm: {
            trend: analysis.recommendation?.includes('MUA') || analysis.recommendation?.includes('BUY') ? 'BULLISH' : 
                     analysis.recommendation?.includes('BÁN') || analysis.recommendation?.includes('SELL') ? 'BEARISH' : 'NEUTRAL',
            confidence: Math.max(analysis.zaiAnalysis?.confidence || 0, analysis.chatGPTAnalysis?.confidence || 0),
            reasoning: 'Short-term analysis based on current market conditions',
            keyDrivers: ['Current signals', 'Market momentum']
          }
        },
        tradingRecommendations: {
          overallSignal: analysis.recommendation?.includes('MUA MẠNH') ? 'STRONG_BUY' :
                          analysis.recommendation?.includes('MUA') || analysis.recommendation?.includes('BUY') ? 'BUY' :
                          analysis.recommendation?.includes('BÁN MẠNH') ? 'STRONG_SELL' :
                          analysis.recommendation?.includes('BÁN') || analysis.recommendation?.includes('SELL') ? 'SELL' : 'HOLD',
          entryPoints: {
            longTerm: {
              priceRange: analysis.entryPoints || 'Waiting for signals',
              confidence: 70,
              reasoning: 'Long-term entry strategy'
            },
            mediumTerm: {
              priceRange: analysis.entryPoints || 'Waiting for signals',
              confidence: 80,
              reasoning: 'Medium-term entry strategy'
            },
            shortTerm: {
              priceRange: analysis.entryPoints || 'Current price level',
              confidence: 90,
              reasoning: 'Short-term entry opportunity'
            }
          },
          exitPoints: {
            takeProfit: {
              level1: 0,
              level2: 0,
              level3: 0
            },
            stopLoss: {
              conservative: 0,
              aggressive: 0
            }
          }
        },
        riskManagement: {
          overallRiskLevel: analysis.riskFactors?.length > 2 ? 'HIGH' : analysis.riskFactors?.length > 0 ? 'MEDIUM' : 'LOW',
          positionSize: {
            conservative: '1-3%',
            moderate: '4-6%',
            aggressive: '7-10%'
          },
          riskRewardRatio: 2.0,
          keyRiskFactors: analysis.riskFactors || ['Market volatility'],
          mitigationStrategies: analysis.riskFactors?.map((risk: string) => `Monitor ${risk.toLowerCase()}`) || ['Diversification']
        },
        marketTiming: {
          optimalEntryWindow: analysis.timeframe || 'Short-term',
          catalysts: ['Market signals', 'Technical indicators'],
          warnings: ['Market volatility', 'External factors'],
          timeHorizon: analysis.timeframe || '1-4 weeks'
        },
        keyLevels: {
          support: [],
          resistance: []
        },
        marketRegime: analysis.recommendation?.includes('MUA') || analysis.recommendation?.includes('BUY') ? 'BULLISH' : 
                     analysis.recommendation?.includes('BÁN') || analysis.recommendation?.includes('SELL') ? 'BEARISH' : 'RANGING',
        breakoutPotential: analysis.zaiAnalysis?.breakoutPotential || analysis.chatGPTAnalysis?.breakoutPotential || 'MEDIUM',
        confidence: Math.max(analysis.zaiAnalysis?.confidence || 0, analysis.chatGPTAnalysis?.confidence || 0),
        reasoning: analysis.recommendation || 'Market analysis completed'
      };
      
      setAnalysisData(convertedData);
      setLastUpdated(new Date());
    } else {
      // Otherwise fetch from API
      fetchEnhancedAIAnalysis();
    }
  }, [coinId, analysis, enhancedAnalysis]);

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY': return 'bg-green-600 text-white';
      case 'BUY': return 'bg-green-500 text-white';
      case 'HOLD': return 'bg-yellow-500 text-white';
      case 'SELL': return 'bg-orange-500 text-white';
      case 'STRONG_SELL': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY':
      case 'BUY': return <TrendingUp className="w-5 h-5" />;
      case 'STRONG_SELL':
      case 'SELL': return <TrendingDown className="w-5 h-5" />;
      case 'HOLD': return <Minus className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'BULLISH': return <TrendingUp className="w-4 h-4" />;
      case 'BEARISH': return <TrendingDown className="w-4 h-4" />;
      case 'NEUTRAL': return <Minus className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getProviderStatusIcon = (status: 'success' | 'failed' | 'not_available') => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'not_available': return <WifiOff className="w-4 h-4 text-gray-400" />;
      default: return <Wifi className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusAlert = () => {
    if (!currentStatusMessage) return null;

    const alertVariant = currentStatusMessage.type === 'error' ? 'destructive' : 
                        currentStatusMessage.type === 'warning' ? 'default' : 'default';

    return (
      <Alert variant={alertVariant} className="mb-4">
        {currentStatusMessage.type === 'error' && <AlertTriangle className="h-4 w-4" />}
        {currentStatusMessage.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
        {currentStatusMessage.type === 'success' && <CheckCircle className="h-4 w-4" />}
        <AlertTitle>{currentStatusMessage.title}</AlertTitle>
        <AlertDescription>
          {currentStatusMessage.message}
          {currentStatusMessage.details && (
            <div className="mt-2 text-sm opacity-80">
              {currentStatusMessage.details}
            </div>
          )}
          {currentStatusMessage.providerStatus && (
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="font-medium">Provider Status:</span>
              <div className="flex items-center gap-2">
                {getProviderStatusIcon(currentStatusMessage.providerStatus.zai)}
                <span>Z.AI: {currentStatusMessage.providerStatus.zai}</span>
              </div>
              <div className="flex items-center gap-2">
                {getProviderStatusIcon(currentStatusMessage.providerStatus.chatgpt)}
                <span>ChatGPT: {currentStatusMessage.providerStatus.chatgpt}</span>
              </div>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  if (loading) {
    return (
      <Card className={`border-2 border-purple-200 ${className}`}>
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Brain className="w-5 h-5" />
            Enhanced AI Analysis - Loading...
          </CardTitle>
          <CardDescription className="text-purple-600">
            AI is analyzing market data with multi-timeframe analysis for {coinId.toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !analysisData) {
    return (
      <Card className={`border-2 border-red-200 ${className}`}>
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <XCircle className="w-5 h-5" />
            Enhanced AI Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {getStatusAlert()}
          <div className="mt-4 flex justify-center">
            <Button onClick={fetchEnhancedAIAnalysis} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData) {
    return (
      <Card className={`border-2 border-gray-200 ${className}`}>
        <CardHeader className="bg-gray-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Brain className="w-5 h-5" />
            Enhanced AI Analysis
          </CardTitle>
          <CardDescription className="text-gray-600">
            Multi-timeframe AI analysis with entry-exit points and risk management
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Button onClick={fetchEnhancedAIAnalysis}>
              <Brain className="w-4 h-4 mr-2" />
              Start Enhanced Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 border-purple-200 ${className}`}>
      <CardHeader className="bg-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Brain className="w-5 h-5" />
              Enhanced AI Analysis - {coinId.toUpperCase()}
            </CardTitle>
            <CardDescription className="text-purple-600">
              Multi-timeframe analysis with trading recommendations and risk management
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button onClick={fetchEnhancedAIAnalysis} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Status Message */}
        {getStatusAlert()}

        {/* Provider Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">AI Provider Status</span>
            {fallbackUsed && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Fallback Mode
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {getProviderStatusIcon(providerStatus?.zai || 'not_available')}
              <span className="text-sm">Z.AI</span>
            </div>
            <div className="flex items-center gap-2">
              {getProviderStatusIcon(providerStatus?.chatgpt || 'not_available')}
              <span className="text-sm">ChatGPT</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Provider: {analysisData.provider}</span>
            </div>
          </div>
        </div>

        {/* Main Recommendation Panel */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 px-4 py-2 rounded-lg ${getRecommendationColor(analysisData.tradingRecommendations.overallSignal)}`}>
                {getRecommendationIcon(analysisData.tradingRecommendations.overallSignal)} 
                {analysisData.tradingRecommendations.overallSignal}
              </div>
              <div className="text-sm text-gray-600">Overall Signal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2 text-purple-600">
                {analysisData.confidence}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold mb-2 px-3 py-1 rounded ${getRiskLevelColor(analysisData.riskManagement.overallRiskLevel)}`}>
                {analysisData.riskManagement.overallRiskLevel}
              </div>
              <div className="text-sm text-gray-600">Risk Level</div>
            </div>
          </div>
          
          <div className="text-center">
            <Badge variant="outline" className="mb-2">
              <Target className="w-3 h-3 mr-1" />
              {analysisData.marketRegime}
            </Badge>
            <div className="text-sm text-gray-600">
              {analysisData.marketTiming.optimalEntryWindow}
            </div>
          </div>
        </div>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Long-term Trend */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {getTrendIcon(analysisData.trendAnalysis.longTerm.trend)}
                    Long-term (6-12 months)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <Badge variant={analysisData.trendAnalysis.longTerm.trend === 'BULLISH' ? 'default' : 
                                   analysisData.trendAnalysis.longTerm.trend === 'BEARISH' ? 'destructive' : 'secondary'}>
                      {analysisData.trendAnalysis.longTerm.trend}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Confidence</div>
                    <Progress value={analysisData.trendAnalysis.longTerm.confidence} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">{analysisData.trendAnalysis.longTerm.confidence}%</div>
                  </div>
                  <div className="text-xs text-gray-700">
                    {analysisData.trendAnalysis.longTerm.reasoning}
                  </div>
                </CardContent>
              </Card>

              {/* Medium-term Trend */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {getTrendIcon(analysisData.trendAnalysis.mediumTerm.trend)}
                    Medium-term (1-3 months)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <Badge variant={analysisData.trendAnalysis.mediumTerm.trend === 'BULLISH' ? 'default' : 
                                   analysisData.trendAnalysis.mediumTerm.trend === 'BEARISH' ? 'destructive' : 'secondary'}>
                      {analysisData.trendAnalysis.mediumTerm.trend}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Confidence</div>
                    <Progress value={analysisData.trendAnalysis.mediumTerm.confidence} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">{analysisData.trendAnalysis.mediumTerm.confidence}%</div>
                  </div>
                  <div className="text-xs text-gray-700">
                    {analysisData.trendAnalysis.mediumTerm.reasoning}
                  </div>
                </CardContent>
              </Card>

              {/* Short-term Trend */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {getTrendIcon(analysisData.trendAnalysis.shortTerm.trend)}
                    Short-term (1-4 weeks)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <Badge variant={analysisData.trendAnalysis.shortTerm.trend === 'BULLISH' ? 'default' : 
                                   analysisData.trendAnalysis.shortTerm.trend === 'BEARISH' ? 'destructive' : 'secondary'}>
                      {analysisData.trendAnalysis.shortTerm.trend}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Confidence</div>
                    <Progress value={analysisData.trendAnalysis.shortTerm.confidence} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">{analysisData.trendAnalysis.shortTerm.confidence}%</div>
                  </div>
                  <div className="text-xs text-gray-700">
                    {analysisData.trendAnalysis.shortTerm.reasoning}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trading" className="space-y-4">
            {/* Entry Points */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Entry Points by Timeframe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded">
                    <div className="font-medium text-sm mb-2">Long-term</div>
                    <div className="text-xs text-gray-600 mb-1">{analysisData.tradingRecommendations.entryPoints.longTerm.priceRange}</div>
                    <div className="text-xs text-gray-500">Confidence: {analysisData.tradingRecommendations.entryPoints.longTerm.confidence}%</div>
                    <Progress value={analysisData.tradingRecommendations.entryPoints.longTerm.confidence} className="h-1 mt-1" />
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium text-sm mb-2">Medium-term</div>
                    <div className="text-xs text-gray-600 mb-1">{analysisData.tradingRecommendations.entryPoints.mediumTerm.priceRange}</div>
                    <div className="text-xs text-gray-500">Confidence: {analysisData.tradingRecommendations.entryPoints.mediumTerm.confidence}%</div>
                    <Progress value={analysisData.tradingRecommendations.entryPoints.mediumTerm.confidence} className="h-1 mt-1" />
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium text-sm mb-2">Short-term</div>
                    <div className="text-xs text-gray-600 mb-1">{analysisData.tradingRecommendations.entryPoints.shortTerm.priceRange}</div>
                    <div className="text-xs text-gray-500">Confidence: {analysisData.tradingRecommendations.entryPoints.shortTerm.confidence}%</div>
                    <Progress value={analysisData.tradingRecommendations.entryPoints.shortTerm.confidence} className="h-1 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exit Points */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Exit Points & Risk Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Take Profit Levels</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Level 1:</span>
                        <span>${analysisData.tradingRecommendations.exitPoints.takeProfit.level1.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Level 2:</span>
                        <span>${analysisData.tradingRecommendations.exitPoints.takeProfit.level2.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Level 3:</span>
                        <span>${analysisData.tradingRecommendations.exitPoints.takeProfit.level3.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Stop Loss Levels</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Conservative:</span>
                        <span>${analysisData.tradingRecommendations.exitPoints.stopLoss.conservative.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Aggressive:</span>
                        <span>${analysisData.tradingRecommendations.exitPoints.stopLoss.aggressive.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Risk Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Position Sizing</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Conservative:</span>
                        <span>{analysisData.riskManagement.positionSize.conservative}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Moderate:</span>
                        <span>{analysisData.riskManagement.positionSize.moderate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Aggressive:</span>
                        <span>{analysisData.riskManagement.positionSize.aggressive}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Risk Metrics</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Risk/Reward Ratio:</span>
                        <span>{analysisData.riskManagement.riskRewardRatio}:1</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overall Risk:</span>
                        <Badge variant={analysisData.riskManagement.overallRiskLevel === 'LOW' ? 'default' : 
                                       analysisData.riskManagement.overallRiskLevel === 'MEDIUM' ? 'secondary' : 'destructive'}
                                       className="text-xs">
                          {analysisData.riskManagement.overallRiskLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">Key Risk Factors</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.riskManagement.keyRiskFactors.map((risk, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {risk}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Market Timing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Optimal Entry Window</h4>
                    <p className="text-sm text-gray-700">{analysisData.marketTiming.optimalEntryWindow}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Time Horizon</h4>
                    <p className="text-sm text-gray-700">{analysisData.marketTiming.timeHorizon}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Catalysts</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.marketTiming.catalysts.map((catalyst, index) => (
                        <Badge key={index} variant="default" className="text-xs">
                          {catalyst}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Warnings</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.marketTiming.warnings.map((warning, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {warning}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}