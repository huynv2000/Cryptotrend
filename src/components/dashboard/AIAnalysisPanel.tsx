'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface AIAnalysisData {
  timestamp: Date;
  coinId: string;
  overallRecommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  overallConfidence: number;
  consensusScore: number;
  providers: {
    'Z.AI'?: any;
    'ChatGPT'?: any;
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

interface AIAnalysisPanelProps {
  coinId: string;
  analysis?: any;
  className?: string;
}

export function AIAnalysisPanel({ coinId, analysis, className = '' }: AIAnalysisPanelProps) {
  const [analysisData, setAnalysisData] = useState<AIAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAIAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai-analysis?action=analyze&coinId=${coinId}`);
      const result = await response.json();

      if (result.success) {
        setAnalysisData(result.data);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Failed to fetch AI analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If analysis data is provided via props, use it
    if (analysis && (analysis.zaiAnalysis || analysis.chatGPTAnalysis)) {
      // Convert the analysis prop to the expected format
      const convertedData: AIAnalysisData = {
        timestamp: new Date(),
        coinId: coinId,
        overallRecommendation: analysis.recommendation?.includes('MUA') || analysis.recommendation?.includes('BUY') ? 'BUY' : 
                              analysis.recommendation?.includes('BÁN') || analysis.recommendation?.includes('SELL') ? 'SELL' : 'HOLD',
        overallConfidence: Math.max(
          analysis.zaiAnalysis?.confidence || 0, 
          analysis.chatGPTAnalysis?.confidence || 0
        ),
        consensusScore: Math.round((
          (analysis.zaiAnalysis?.confidence || 0) + 
          (analysis.chatGPTAnalysis?.confidence || 0)
        ) / 2),
        providers: {
          'Z.AI': {
            ...analysis.zaiAnalysis,
            buyRecommendation: analysis.zaiAnalysis?.recommendation,
            confidence: analysis.zaiAnalysis?.confidence || 0,
            reasoning: analysis.zaiAnalysis?.reasoning
          },
          'ChatGPT': {
            ...analysis.chatGPTAnalysis,
            buyRecommendation: analysis.chatGPTAnalysis?.recommendation,
            confidence: analysis.chatGPTAnalysis?.confidence || 0,
            reasoning: analysis.chatGPTAnalysis?.reasoning
          }
        },
        summary: {
          trendAnalysis: analysis.recommendation || 'Market analysis in progress',
          keyInsights: [
            analysis.zaiAnalysis?.reasoning ? 'Z.AI analysis completed' : '',
            analysis.chatGPTAnalysis?.reasoning ? 'ChatGPT analysis completed' : ''
          ].filter(Boolean),
          riskAssessment: analysis.riskFactors?.join(', ') || 'Risk assessment pending',
          opportunityHighlights: [
            analysis.entryPoints || 'Entry points identified',
            analysis.exitPoints || 'Exit points identified'
          ]
        },
        marketRegime: analysis.recommendation?.includes('MUA') || analysis.recommendation?.includes('BUY') ? 'BULLISH' : 
                     analysis.recommendation?.includes('BÁN') || analysis.recommendation?.includes('SELL') ? 'BEARISH' : 'RANGING',
        timeHorizon: analysis.timeframe?.includes('ngắn') || analysis.timeframe?.includes('short') ? 'SHORT_TERM' : 
                     analysis.timeframe?.includes('trung') || analysis.timeframe?.includes('medium') ? 'MEDIUM_TERM' : 'LONG_TERM',
        actionPlan: {
          immediate: analysis.entryPoints || 'Monitor market conditions',
          shortTerm: analysis.stopLoss || 'Set risk management',
          mediumTerm: analysis.takeProfit || 'Plan exit strategy'
        }
      };
      
      setAnalysisData(convertedData);
      setLastUpdated(new Date());
    } else {
      // Otherwise fetch from API
      fetchAIAnalysis();
    }
  }, [coinId, analysis]);

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
      case 'BUY': return '📈';
      case 'STRONG_SELL':
      case 'SELL': return '📉';
      case 'HOLD': return '➡️';
      default: return '❓';
    }
  };

  const getMarketRegimeColor = (regime: string) => {
    switch (regime) {
      case 'BULLISH': return 'text-green-600 bg-green-50';
      case 'BEARISH': return 'text-red-600 bg-red-50';
      case 'VOLATILE': return 'text-orange-600 bg-orange-50';
      case 'RANGING': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConsensusColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className={`border-2 border-purple-200 ${className}`}>
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            🤖 AI Analysis - Loading...
          </CardTitle>
          <CardDescription className="text-purple-600">
            AI is analyzing market data for {coinId.toUpperCase()}
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

  if (error) {
    return (
      <Card className={`border-2 border-red-200 ${className}`}>
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-800">
            ❌ AI Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={fetchAIAnalysis} variant="outline">
              🔄 Retry Analysis
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
            🤖 AI Analysis
          </CardTitle>
          <CardDescription className="text-gray-600">
            No AI analysis data available
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Button onClick={fetchAIAnalysis}>
              🚀 Start AI Analysis
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
              🤖 AI Analysis - {coinId.toUpperCase()}
            </CardTitle>
            <CardDescription className="text-purple-600">
              Advanced AI-powered market analysis from multiple providers
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button onClick={fetchAIAnalysis} size="sm" variant="outline">
              🔄 Refresh
            </Button>
            {analysis && (
              <Button onClick={() => {
                setAnalysisData(null);
                fetchAIAnalysis();
              }} size="sm" variant="outline">
                🔄 Fetch New Data
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Main Recommendation Panel */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 px-4 py-2 rounded-lg ${getRecommendationColor(analysisData.overallRecommendation)}`}>
                {getRecommendationIcon(analysisData.overallRecommendation)} {analysisData.overallRecommendation}
              </div>
              <div className="text-sm text-gray-600">AI Recommendation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-purple-600">
                {analysisData.overallConfidence}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 px-3 py-1 rounded ${getMarketRegimeColor(analysisData.marketRegime)}`}>
                {analysisData.marketRegime}
              </div>
              <div className="text-sm text-gray-600">Market Regime</div>
            </div>
          </div>
          
          {/* Consensus Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">AI Consensus Score</span>
              <span className={`text-sm font-bold ${getConsensusColor(analysisData.consensusScore)}`}>
                {analysisData.consensusScore}%
              </span>
            </div>
            <Progress value={analysisData.consensusScore} className="h-2" />
          </div>

          {/* Provider Status */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">AI Providers:</span>
            {Object.keys(analysisData.providers).map((provider) => (
              <Badge key={provider} variant="secondary" className="text-xs">
                {provider} ✓
              </Badge>
            ))}
          </div>
        </div>

        {/* Detailed AI Analysis Section */}
        <div className="space-y-6">
          {/* Z.AI Analysis */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  Z
                </div>
                Z.AI Analysis
                <Badge variant="outline" className="ml-auto">
                  {analysisData.providers['Z.AI']?.confidence || 0}% confidence
                </Badge>
              </CardTitle>
              <CardDescription>
                Phân tích từ Z.AI dựa trên dữ liệu thị trường đa chiều
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Khuyến nghị</h4>
                <Badge 
                  variant={analysisData.providers['Z.AI']?.buyRecommendation?.includes('MUA') || analysisData.providers['Z.AI']?.buyRecommendation?.includes('BUY') ? 'default' : 
                          analysisData.providers['Z.AI']?.buyRecommendation?.includes('BÁN') || analysisData.providers['Z.AI']?.buyRecommendation?.includes('SELL') ? 'destructive' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {analysisData.providers['Z.AI']?.buyRecommendation || analysisData.overallRecommendation || 'N/A'}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">⏰ Khung thời gian</h4>
                <p className="text-sm text-gray-700">{analysisData.providers['Z.AI']?.timeframe || analysisData.timeHorizon?.replace('_', ' ') || 'N/A'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📈 Tiềm năng breakout</h4>
                <Badge 
                  variant={analysisData.providers['Z.AI']?.breakoutPotential === 'HIGH' ? 'default' : 
                          analysisData.providers['Z.AI']?.breakoutPotential === 'MEDIUM' ? 'secondary' : 'outline'}
                >
                  {analysisData.providers['Z.AI']?.breakoutPotential || 'MEDIUM'}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🧠 Phân tích chi tiết</h4>
                <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 leading-relaxed">
                  {analysisData.providers['Z.AI']?.reasoning || analysisData.providers['Z.AI']?.analysis || 'Z.AI đang phân tích dữ liệu thị trường...'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ChatGPT Analysis */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  C
                </div>
                ChatGPT Analysis
                <Badge variant="outline" className="ml-auto">
                  {analysisData.providers['ChatGPT']?.confidence || 0}% confidence
                </Badge>
              </CardTitle>
              <CardDescription>
                Phân tích từ ChatGPT dựa trên dữ liệu thị trường và chỉ báo kỹ thuật
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Khuyến nghị</h4>
                <Badge 
                  variant={analysisData.providers['ChatGPT']?.buyRecommendation?.includes('MUA') || analysisData.providers['ChatGPT']?.buyRecommendation?.includes('BUY') ? 'default' : 
                          analysisData.providers['ChatGPT']?.buyRecommendation?.includes('BÁN') || analysisData.providers['ChatGPT']?.buyRecommendation?.includes('SELL') ? 'destructive' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {analysisData.providers['ChatGPT']?.buyRecommendation || analysisData.overallRecommendation || 'N/A'}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">⏰ Khung thời gian</h4>
                <p className="text-sm text-gray-700">{analysisData.providers['ChatGPT']?.timeframe || analysisData.timeHorizon?.replace('_', ' ') || 'N/A'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📈 Tiềm năng breakout</h4>
                <Badge 
                  variant={analysisData.providers['ChatGPT']?.breakoutPotential === 'HIGH' ? 'default' : 
                          analysisData.providers['ChatGPT']?.breakoutPotential === 'MEDIUM' ? 'secondary' : 'outline'}
                >
                  {analysisData.providers['ChatGPT']?.breakoutPotential || 'MEDIUM'}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🧠 Phân tích chi tiết</h4>
                <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 leading-relaxed">
                  {analysisData.providers['ChatGPT']?.reasoning || analysisData.providers['ChatGPT']?.analysis || 'ChatGPT đang phân tích dữ liệu thị trường...'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Consensus Summary */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Tổng hợp nhận định AI
              </CardTitle>
              <CardDescription>
                Tổng hợp phân tích từ cả hai AI providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">🎯 Khuyến nghị chung</h4>
                  <Badge 
                    variant={analysisData.overallRecommendation?.includes('BUY') ? 'default' : 
                            analysisData.overallRecommendation?.includes('SELL') ? 'destructive' : 'secondary'}
                    className="text-lg px-4 py-2"
                  >
                    {analysisData.overallRecommendation || 'N/A'}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">⏰ Khung thời gian</h4>
                  <p className="text-sm text-gray-700 font-medium">{analysisData.timeHorizon?.replace('_', ' ') || 'N/A'}</p>
                </div>
                
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">📊 Mức độ đồng thuận</h4>
                  <div className="flex items-center justify-center gap-2">
                    <Progress value={analysisData.consensusScore} className="w-20" />
                    <span className={`text-sm font-bold ${getConsensusColor(analysisData.consensusScore)}`}>
                      {analysisData.consensusScore}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📈 Phân tích xu hướng</h4>
                  <p className="text-sm text-gray-700">{analysisData.summary?.trendAnalysis || 'N/A'}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">⚠️ Đánh giá rủi ro</h4>
                  <p className="text-sm text-gray-700">{analysisData.summary?.riskAssessment || 'N/A'}</p>
                </div>
              </div>

              {/* Action Plan */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">🎯 Kế hoạch hành động</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-medium text-blue-700 mb-1">Ngay lập tức</h5>
                    <p className="text-sm text-blue-900">{analysisData.actionPlan?.immediate || 'N/A'}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-700 mb-1">Ngắn hạn</h5>
                    <p className="text-sm text-blue-900">{analysisData.actionPlan?.shortTerm || 'N/A'}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-700 mb-1">Trung hạn</h5>
                    <p className="text-sm text-blue-900">{analysisData.actionPlan?.mediumTerm || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}