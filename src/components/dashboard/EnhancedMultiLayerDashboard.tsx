'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AIAnalysisPanel } from './AIAnalysisPanel';

interface EnhancedMultiLayerDashboardProps {
  selectedCoin?: string;
  data: {
    onChain: any;
    technical: any;
    sentiment: any;
    derivatives: any;
  };
  signal: {
    type: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
    confidence: number;
    reasoning: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    conditions: any;
    triggers: string[];
  };
  alerts: Array<{
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
  }>;
  analysis?: any;
}

export function EnhancedMultiLayerDashboard({ 
  selectedCoin,
  data, 
  signal, 
  alerts,
  analysis 
}: EnhancedMultiLayerDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'STRONG_BUY': return 'bg-green-600 text-white';
      case 'BUY': return 'bg-green-500 text-white';
      case 'HOLD': return 'bg-yellow-500 text-white';
      case 'SELL': return 'bg-orange-500 text-white';
      case 'STRONG_SELL': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'STRONG_BUY':
      case 'BUY': return '📈';
      case 'STRONG_SELL':
      case 'SELL': return '📉';
      case 'HOLD': return '➡️';
      default: return '❓';
    }
  };

  const getMVRVColor = (mvrv: number) => {
    if (mvrv < 1) return 'text-green-600 bg-green-50';
    if (mvrv < 1.5) return 'text-yellow-600 bg-yellow-50';
    if (mvrv < 2) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getNUPLColor = (nupl: number) => {
    if (nupl < 0) return 'text-green-600 bg-green-50';
    if (nupl < 0.5) return 'text-yellow-600 bg-yellow-50';
    if (nupl < 0.75) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getSentimentColor = (value: number) => {
    if (value <= 25) return 'text-red-600 bg-red-50';
    if (value <= 45) return 'text-orange-600 bg-orange-50';
    if (value <= 55) return 'text-yellow-600 bg-yellow-50';
    if (value <= 75) return 'text-green-600 bg-green-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'CRITICAL': return 'border-red-500 bg-red-50';
      case 'WARNING': return 'border-orange-500 bg-orange-50';
      case 'INFO': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getTrendDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'rising': return '📈';
      case 'falling': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Signal Coordination Panel */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            {getSignalIcon(signal.type)}
            TRADING SIGNAL COORDINATION - HỆ THỐNG TÍN HIỆU GIAO DỊCH
          </CardTitle>
          <CardDescription className="text-blue-600">
            Phân tích tổng hợp từ tất cả các lớp chỉ số theo báo cáo chuyên sâu
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 px-4 py-2 rounded-lg ${getSignalColor(signal.type)}`}>
                {signal.type}
              </div>
              <div className="text-sm text-gray-600">Trading Signal</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-blue-600">
                {signal.confidence}%
              </div>
              <div className="text-sm text-gray-600">Confidence Level</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold mb-2 px-3 py-1 rounded ${getRiskColor(signal.riskLevel)}`}>
                {signal.riskLevel}
              </div>
              <div className="text-sm text-gray-600">Risk Level</div>
            </div>
          </div>
          
          {/* Trading Conditions */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">MVRV</div>
              <div className={`text-lg font-bold ${getMVRVColor(signal.conditions.mvrv)}`}>
                {signal.conditions.mvrv?.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Fear & Greed</div>
              <div className={`text-lg font-bold ${getSentimentColor(signal.conditions.fearGreed)}`}>
                {signal.conditions.fearGreed}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Funding Rate</div>
              <div className={`text-lg font-bold ${signal.conditions.fundingRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(signal.conditions.fundingRate * 100)?.toFixed(3)}%
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">RSI</div>
              <div className="text-lg font-bold text-gray-800">
                {signal.conditions.rsi?.toFixed(1)}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Analysis Reasoning:</h4>
            <p className="text-sm text-gray-700">{signal.reasoning}</p>
            <div className="mt-2">
              <h5 className="font-medium text-gray-700 mb-1">Triggered Conditions:</h5>
              <div className="flex flex-wrap gap-2">
                {signal.triggers.map((trigger, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {trigger}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* AI Analysis Recommendations */}
          {analysis && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-4">🤖 Phân tích chi tiết từ AI:</h4>
              
              {/* Z.AI Detailed Analysis */}
              {analysis.zaiAnalysis && (
                <div className="mb-6 p-4 bg-white rounded-lg border-l-4 border-blue-500 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      Z
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-blue-800">Z.AI nhận định</h5>
                      <p className="text-xs text-blue-600">Phân tích từ Z.AI dựa trên dữ liệu thị trường đa chiều</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {analysis.zaiAnalysis.confidence || signal.confidence}% confidence
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-600 mb-1">Khuyến nghị</div>
                      <Badge 
                        variant={analysis.zaiAnalysis.recommendation?.includes('MUA') ? 'default' : 
                                analysis.zaiAnalysis.recommendation?.includes('BÁN') ? 'destructive' : 'secondary'}
                        className="text-sm font-medium"
                      >
                        {analysis.zaiAnalysis.recommendation || analysis.recommendation}
                      </Badge>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-600 mb-1">Khung thời gian</div>
                      <div className="text-sm font-medium text-blue-900">
                        {analysis.zaiAnalysis.timeframe || analysis.timeframe}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-600 mb-1">Breakout</div>
                      <Badge 
                        variant={analysis.zaiAnalysis.breakoutPotential === 'HIGH' ? 'default' : 
                                analysis.zaiAnalysis.breakoutPotential === 'MEDIUM' ? 'secondary' : 'outline'}
                      >
                        {analysis.zaiAnalysis.breakoutPotential || 'MEDIUM'}
                      </Badge>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-600 mb-1">Độ tin cậy</div>
                      <div className="text-lg font-bold text-blue-600">
                        {analysis.zaiAnalysis.confidence || signal.confidence}%
                      </div>
                    </div>
                  </div>
                  
                  {analysis.zaiAnalysis.reasoning && (
                    <div className="mt-3">
                      <h6 className="font-medium text-blue-700 mb-2">🧠 Phân tích chi tiết:</h6>
                      <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-900 leading-relaxed border border-blue-200">
                        {analysis.zaiAnalysis.reasoning}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ChatGPT Detailed Analysis */}
              {analysis.chatGPTAnalysis && (
                <div className="mb-6 p-4 bg-white rounded-lg border-l-4 border-green-500 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      C
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-green-800">ChatGPT nhận định</h5>
                      <p className="text-xs text-green-600">Phân tích từ ChatGPT dựa trên dữ liệu thị trường và chỉ báo kỹ thuật</p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {analysis.chatGPTAnalysis.confidence || signal.confidence}% confidence
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-green-600 mb-1">Khuyến nghị</div>
                      <Badge 
                        variant={analysis.chatGPTAnalysis.recommendation?.includes('MUA') ? 'default' : 
                                analysis.chatGPTAnalysis.recommendation?.includes('BÁN') ? 'destructive' : 'secondary'}
                        className="text-sm font-medium"
                      >
                        {analysis.chatGPTAnalysis.recommendation || analysis.recommendation}
                      </Badge>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-green-600 mb-1">Khung thời gian</div>
                      <div className="text-sm font-medium text-green-900">
                        {analysis.chatGPTAnalysis.timeframe || analysis.timeframe}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-green-600 mb-1">Breakout</div>
                      <Badge 
                        variant={analysis.chatGPTAnalysis.breakoutPotential === 'HIGH' ? 'default' : 
                                analysis.chatGPTAnalysis.breakoutPotential === 'MEDIUM' ? 'secondary' : 'outline'}
                      >
                        {analysis.chatGPTAnalysis.breakoutPotential || 'MEDIUM'}
                      </Badge>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-green-600 mb-1">Độ tin cậy</div>
                      <div className="text-lg font-bold text-green-600">
                        {analysis.chatGPTAnalysis.confidence || signal.confidence}%
                      </div>
                    </div>
                  </div>
                  
                  {analysis.chatGPTAnalysis.reasoning && (
                    <div className="mt-3">
                      <h6 className="font-medium text-green-700 mb-2">🧠 Phân tích chi tiết:</h6>
                      <div className="bg-green-50 p-3 rounded-md text-sm text-green-900 leading-relaxed border border-green-200">
                        {analysis.chatGPTAnalysis.reasoning}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Consensus Analysis */}
              <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-purple-500 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-purple-800">📊 Tổng hợp nhận định AI:</span>
                  <Badge variant="outline" className="bg-purple-100 text-purple-700">
                    Consensus
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-purple-700">Khuyến nghị chung:</span>
                    <span className="ml-2 text-purple-900 font-semibold">{analysis.recommendation}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Khung thời gian:</span>
                    <span className="ml-2 text-purple-900">{analysis.timeframe}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Điểm vào lệnh:</span>
                    <span className="ml-2 text-purple-900">{analysis.entryPoints}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Yếu tố rủi ro:</span>
                    <span className="ml-2 text-purple-900">{analysis.riskFactors?.join(', ')}</span>
                  </div>
                </div>
                {analysis.stopLoss && analysis.takeProfit && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-purple-700">Stop Loss:</span>
                      <span className="ml-2 text-red-600 font-medium">{analysis.stopLoss}</span>
                    </div>
                    <div>
                      <span className="font-medium text-purple-700">Take Profit:</span>
                      <span className="ml-2 text-green-600 font-medium">{analysis.takeProfit}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Alerts Panel */}
      {alerts.length > 0 && (
        <Card className="border-2 border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-800">
              🚨 ACTIVE ALERTS - CẢNH BÁO THỊ TRƯỜNG
            </CardTitle>
            <CardDescription className="text-red-600">
              Cảnh báo thời gian thực về các điều kiện thị trường cực đoan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <Alert key={alert.id} className={getAlertColor(alert.type)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={alert.type === 'CRITICAL' ? 'destructive' : alert.type === 'WARNING' ? 'default' : 'secondary'}>
                            {alert.type}
                          </Badge>
                          <Badge variant="outline">{alert.category}</Badge>
                          <span className="text-xs text-gray-500">
                            {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                        <h5 className="font-semibold text-sm mb-1">{alert.title}</h5>
                        <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                        {alert.recommendedAction && (
                          <p className="text-sm font-medium text-blue-700">
                            💡 {alert.recommendedAction}
                          </p>
                        )}
                      </div>
                      {alert.actionRequired && (
                        <Badge variant="destructive" className="ml-2">
                          Action Required
                        </Badge>
                      )}
                    </div>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Multi-Layer Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">📊 Tổng Quan</TabsTrigger>
          <TabsTrigger value="onchain">⛓️ On-Chain</TabsTrigger>
          <TabsTrigger value="technical">📈 Technical</TabsTrigger>
          <TabsTrigger value="sentiment">😊 Sentiment</TabsTrigger>
          <TabsTrigger value="derivatives">📊 Derivatives</TabsTrigger>
          <TabsTrigger value="ai-analysis">🤖 AI Analysis</TabsTrigger>
          <TabsTrigger value="system-info">ℹ️ Thông Tin Hệ Thống</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* On-chain Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  ⛓️ On-Chain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>MVRV:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getMVRVColor(data.onChain.mvrv || 0)}`}>
                      {data.onChain.mvrv?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>NUPL:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getNUPLColor(data.onChain.nupl || 0)}`}>
                      {data.onChain.nupl?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Active Addr:</span>
                    <span className="font-medium">
                      {((data.onChain.activeAddresses || 0) / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Net Flow:</span>
                    <span className={`font-medium ${(data.onChain.exchangeInflow - data.onChain.exchangeOutflow) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {((data.onChain.exchangeInflow || 0) - (data.onChain.exchangeOutflow || 0)).toLocaleString()} BTC
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  📈 Technical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>RSI:</span>
                    <span className="font-medium">{data.technical.rsi?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>MA50/200:</span>
                    <span className="font-medium">
                      {data.technical.ma50 > data.technical.ma200 ? '📈' : '📉'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>MACD:</span>
                    <span className="font-medium">
                      {data.technical.macd > 0 ? '📈' : '📉'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Bollinger:</span>
                    <span className="font-medium">
                      {data.technical.bollingerUpper ? '📊' : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  😊 Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Fear & Greed:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(data.sentiment.fearGreedIndex || 50)}`}>
                      {data.sentiment.fearGreedIndex || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Social:</span>
                    <span className="font-medium">
                      {data.sentiment.social?.twitterSentiment > 0.5 ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>News:</span>
                    <span className="font-medium">
                      {data.sentiment.news?.newsSentiment > 0.5 ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Google:</span>
                    <span className="font-medium">
                      {getTrendDirectionIcon(data.sentiment.googleTrends?.trendDirection)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Derivatives Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  📊 Derivatives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Funding:</span>
                    <span className={`font-medium ${data.derivatives.fundingRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(data.derivatives.fundingRate * 100)?.toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>OI:</span>
                    <span className="font-medium">
                      {((data.derivatives.openInterest || 0) / 1000000000).toFixed(1)}B
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Liquidations:</span>
                    <span className="font-medium">
                      ${((data.derivatives.liquidationVolume || 0) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>P/C Ratio:</span>
                    <span className="font-medium">{data.derivatives.putCallRatio?.toFixed(2) || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="onchain" className="space-y-4">
          {/* Layer 1: On-chain Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">MVRV Ratio</CardTitle>
                <CardDescription>Market Value / Realized Value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold mb-2 p-3 rounded-lg text-center ${getMVRVColor(data.onChain.mvrv || 0)}`}>
                  {data.onChain.mvrv?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {data.onChain.mvrv < 1 ? '🟢 Undervalued' : 
                   data.onChain.mvrv < 1.5 ? '🟡 Fair Value' : 
                   data.onChain.mvrv < 2 ? '🟠 Overvalued' : '🔴 Expensive'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">NUPL</CardTitle>
                <CardDescription>Net Unrealized Profit/Loss</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold mb-2 p-3 rounded-lg text-center ${getNUPLColor(data.onChain.nupl || 0)}`}>
                  {data.onChain.nupl?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {data.onChain.nupl < 0 ? '🟢 Capitulation' : 
                   data.onChain.nupl < 0.5 ? '🟡 Hope' : 
                   data.onChain.nupl < 0.75 ? '🟠 Optimism' : '🔴 Euphoria'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">SOPR</CardTitle>
                <CardDescription>Spent Output Profit Ratio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {data.onChain.sopr?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {data.onChain.sopr < 1 ? '🔴 Loss Taking' : '🟢 Profit Taking'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Addresses</CardTitle>
                <CardDescription>Số địa chỉ hoạt động</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {((data.onChain.activeAddresses || 0) / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Network Activity
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exchange Flows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Exchange Inflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600 text-center">
                  {data.onChain.exchangeInflow?.toLocaleString() || 'N/A'} BTC
                </div>
                <div className="text-xs text-gray-600 text-center">Tiền vào sàn</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Exchange Outflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600 text-center">
                  {data.onChain.exchangeOutflow?.toLocaleString() || 'N/A'} BTC
                </div>
                <div className="text-xs text-gray-600 text-center">Tiền ra sàn</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold text-center ${
                  (data.onChain.exchangeInflow - data.onChain.exchangeOutflow) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {((data.onChain.exchangeInflow || 0) - (data.onChain.exchangeOutflow || 0)).toLocaleString()} BTC
                </div>
                <div className="text-xs text-gray-600 text-center">Dòng tiền ròng</div>
              </CardContent>
            </Card>
          </div>

          {/* Supply Distribution */}
          {data.onChain.supplyDistribution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Supply Distribution</CardTitle>
                <CardDescription>Phân bổ nguồn cung</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {data.onChain.whaleHoldingsPercentage}%
                    </div>
                    <div className="text-xs text-gray-600">Whales</div>
                    <Progress value={data.onChain.whaleHoldingsPercentage} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {data.onChain.retailHoldingsPercentage}%
                    </div>
                    <div className="text-xs text-gray-600">Retail</div>
                    <Progress value={data.onChain.retailHoldingsPercentage} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {data.onChain.exchangeHoldingsPercentage}%
                    </div>
                    <div className="text-xs text-gray-600">Exchanges</div>
                    <Progress value={data.onChain.exchangeHoldingsPercentage} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {100 - (data.onChain.whaleHoldingsPercentage + data.onChain.retailHoldingsPercentage + data.onChain.exchangeHoldingsPercentage)}%
                    </div>
                    <div className="text-xs text-gray-600">Others</div>
                    <Progress value={100 - (data.onChain.whaleHoldingsPercentage + data.onChain.retailHoldingsPercentage + data.onChain.exchangeHoldingsPercentage)} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          {/* Technical Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">RSI</CardTitle>
                <CardDescription>Relative Strength Index</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {data.technical.rsi?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {data.technical.rsi >= 70 ? '🔴 Overbought' : 
                   data.technical.rsi <= 30 ? '🟢 Oversold' : '🟡 Neutral'}
                </div>
                <Progress value={data.technical.rsi || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Moving Averages</CardTitle>
                <CardDescription>MA50 vs MA200</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold mb-2 text-center">
                  {data.technical.ma50 > data.technical.ma200 ? '📈 Golden Cross' : '📉 Death Cross'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  MA50: ${data.technical.ma50?.toLocaleString()}<br/>
                  MA200: ${data.technical.ma200?.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">MACD</CardTitle>
                <CardDescription>Moving Average Convergence Divergence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {data.technical.macd > 0 ? '📈' : '📉'} {data.technical.macd?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {data.technical.macd > 0 ? 'Bullish Momentum' : 'Bearish Momentum'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bollinger Bands</CardTitle>
                <CardDescription>Volatility Bands</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold mb-2 text-center">
                  Upper: ${data.technical.bollingerUpper?.toLocaleString()}<br/>
                  Middle: ${data.technical.bollingerMiddle?.toLocaleString()}<br/>
                  Lower: ${data.technical.bollingerLower?.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Volatility Indicator
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          {/* Fear & Greed Index */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Fear & Greed Index</CardTitle>
              <CardDescription>Chỉ số tâm lý thị trường</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${getSentimentColor(data.sentiment.fearGreedIndex || 50)}`}>
                  {data.sentiment.fearGreedIndex || 'N/A'}
                </div>
                <div className="text-lg text-gray-600 mb-4">
                  {data.sentiment.fearGreedClassification || 'Neutral'}
                </div>
                <Progress value={data.sentiment.fearGreedIndex || 50} className="max-w-md mx-auto" />
              </div>
            </CardContent>
          </Card>

          {/* Social Sentiment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Social Sentiment</CardTitle>
                <CardDescription>Twitter & Reddit Analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Twitter Sentiment</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(data.sentiment.social?.twitterSentiment || 0) * 100} className="w-20" />
                      <span className="text-sm font-medium">
                        {((data.sentiment.social?.twitterSentiment || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reddit Sentiment</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(data.sentiment.social?.redditSentiment || 0) * 100} className="w-20" />
                      <span className="text-sm font-medium">
                        {((data.sentiment.social?.redditSentiment || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Social Volume</span>
                    <span className="text-sm font-medium">
                      {data.sentiment.social?.socialVolume?.toLocaleString()} mentions
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Trending Score</span>
                    <span className="text-sm font-medium">
                      {data.sentiment.social?.trendingScore}/100
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">News Sentiment</CardTitle>
                <CardDescription>News Analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">News Sentiment</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(data.sentiment.news?.newsSentiment || 0) * 100} className="w-20" />
                      <span className="text-sm font-medium">
                        {((data.sentiment.news?.newsSentiment || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">News Volume</span>
                    <span className="text-sm font-medium">
                      {data.sentiment.news?.newsVolume?.toLocaleString()} articles
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Positive News</span>
                    <span className="text-sm font-medium text-green-600">
                      {data.sentiment.news?.positiveNewsCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Negative News</span>
                    <span className="text-sm font-medium text-red-600">
                      {data.sentiment.news?.negativeNewsCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Google Trends</CardTitle>
              <CardDescription>Xu hướng tìm kiếm Google</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold mb-2">
                      {data.sentiment.googleTrends?.trendsScore || 'N/A'}/100
                    </div>
                    <div className="text-sm text-gray-600">Trends Score</div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {getTrendDirectionIcon(data.sentiment.googleTrends?.trendDirection)}
                      <span className="text-sm font-medium">
                        {data.sentiment.googleTrends?.trendDirection || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Trending Keywords</h5>
                  <div className="flex flex-wrap gap-2">
                    {data.sentiment.googleTrends?.trendingKeywords?.map((keyword: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <h5 className="font-medium text-gray-700 mb-2 mt-4">Search Volume</h5>
                  <div className="text-sm text-gray-600">
                    {data.sentiment.googleTrends?.searchVolume?.toLocaleString()} monthly searches
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="derivatives" className="space-y-4">
          {/* Derivatives Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Funding Rate</CardTitle>
                <CardDescription>Phí funding 8h</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold mb-2 text-center ${data.derivatives.fundingRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(data.derivatives.fundingRate * 100)?.toFixed(3)}%
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {data.derivatives.fundingRate > 0 ? 'Longs pay Shorts' : 'Shorts pay Longs'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Interest</CardTitle>
                <CardDescription>Tổng giá trị hợp đồng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  ${((data.derivatives.openInterest || 0) / 1000000000).toFixed(1)}B
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Market Interest
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Liquidations</CardTitle>
                <CardDescription>Khối lượng thanh lý</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center text-red-600">
                  ${((data.derivatives.liquidationVolume || 0) / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-600 text-center">
                  24h Liquidations
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Put/Call Ratio</CardTitle>
                <CardDescription>Tỷ lệ Put/Call options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {data.derivatives.putCallRatio?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {data.derivatives.putCallRatio < 1 ? '🟢 Bullish' : '🔴 Bearish'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-4">
          <AIAnalysisPanel coinId={selectedCoin || 'bitcoin'} analysis={analysis} />
        </TabsContent>

        <TabsContent value="system-info" className="space-y-6">
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                ℹ️ THÔNG TIN HỆ THỐNG - GIẢI THÍCH CHỈ SỐ
              </CardTitle>
              <CardDescription className="text-blue-600">
                Hướng dẫn chi tiết ý nghĩa và cách đánh giá các chỉ số trên dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                
                {/* On-Chain Metrics Explanation */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    ⛓️ CHỈ SỐ ON-CHAIN
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h5 className="font-medium text-green-700 mb-2">📊 MVRV Ratio</h5>
                      <p className="text-green-800 mb-2">
                        <strong>Ý nghĩa:</strong> Tỷ lệ giữa Market Value và Realized Value. Cho biết tài sản đang được định giá cao hay thấp so với giá mua trung bình.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (MVRV &lt; 1):</strong> Tài sản bị định giá thấp, cơ hội mua</p>
                        <p><strong>🟡 Trung lập (1-1.5):</strong> Định giá hợp lý</p>
                        <p><strong>🔴 Xấu (&gt; 2):</strong> Định giá cao, rủi ro điều chỉnh</p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                      <h5 className="font-medium text-green-700 mb-2">💰 NUPL</h5>
                      <p className="text-green-800 mb-2">
                        <strong>Ý nghĩa:</strong> Net Unrealized Profit/Loss. Phản ánh tâm lý thị trường qua lợi nhuận/lỗ chưa thực hiện của holder.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (&lt; 0):</strong> Capitulation, cơ hội mua giá thấp</p>
                        <p><strong>🟡 Trung lập (0-0.5):</strong> Hope - Optimism</p>
                        <p><strong>🔴 Xấu (&gt; 0.75):</strong> Euphoria, rủi ro cao</p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                      <h5 className="font-medium text-green-700 mb-2">🔄 SOPR</h5>
                      <p className="text-green-800 mb-2">
                        <strong>Ý nghĩa:</strong> Spent Output Profit Ratio. Cho biết holder đang chốt lời hay cắt lỗ.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (&lt; 1):</strong> Holder đang cắt lỗ, đáy thị trường</p>
                        <p><strong>🟡 Trung lập (= 1):</strong> Cân bằng giữa lãi/lỗ</p>
                        <p><strong>🔴 Xấu (&gt; 1):</strong> Holder chốt lời, có thể đỉnh</p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                      <h5 className="font-medium text-green-700 mb-2">👥 Active Addresses</h5>
                      <p className="text-green-800 mb-2">
                        <strong>Ý nghĩa:</strong> Số địa chỉ hoạt động hàng ngày. Đo lường mức độ adoption và hoạt động mạng lưới.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (Tăng):</strong> Adoption tăng, sức khỏe mạng tốt</p>
                        <p><strong>🟡 Trung lập (Ổn định):</strong> Mạng lưới hoạt động bình thường</p>
                        <p><strong>🔴 Xấu (Giảm):</strong> Suy giảm interest, có thể bearish</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Technical Indicators Explanation */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    📈 CHỈ BÁO KỸ THUẬT
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h5 className="font-medium text-blue-700 mb-2">📊 RSI (Relative Strength Index)</h5>
                      <p className="text-blue-800 mb-2">
                        <strong>Ý nghĩa:</strong> Chỉ báo sức mạnh tương đối, đo lường tốc độ và thay đổi giá để xác định overbought/oversold.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (&lt; 30):</strong> Oversold, cơ hội mua</p>
                        <p><strong>🟡 Trung lập (30-70):</strong> Vùng trung tính</p>
                        <p><strong>🔴 Xấu (&gt; 70):</strong> Overbought, rủi ro điều chỉnh</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h5 className="font-medium text-blue-700 mb-2">📈 MA50/MA200</h5>
                      <p className="text-blue-800 mb-2">
                        <strong>Ý nghĩa:</strong> Đường trung bình động 50 và 200 ngày. Xác định xu hướng dài hạn.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (Golden Cross):</strong> MA50 &gt; MA200, xu hướng tăng</p>
                        <p><strong>🟡 Trung lập (Cắt nhau):</strong> Đang thay đổi xu hướng</p>
                        <p><strong>🔴 Xấu (Death Cross):</strong> MA50 &lt; MA200, xu hướng giảm</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h5 className="font-medium text-blue-700 mb-2">📊 MACD</h5>
                      <p className="text-blue-800 mb-2">
                        <strong>Ý nghĩa:</strong> Moving Average Convergence Divergence. Xác định momentum và xu hướng.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (&gt; 0):</strong> Momentum tăng, bullish</p>
                        <p><strong>🟡 Trung lập (= 0):</strong> Cân bằng, không xu hướng rõ</p>
                        <p><strong>🔴 Xấu (&lt; 0):</strong> Momentum giảm, bearish</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h5 className="font-medium text-blue-700 mb-2">📊 Bollinger Bands</h5>
                      <p className="text-blue-800 mb-2">
                        <strong>Ý nghĩa:</strong> Dải bollinger đo lường volatility và các mức hỗ trợ/kháng cự động.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (Giá giữa dải):</strong> Bình thường, follow trend</p>
                        <p><strong>🟡 Trung lập (Chạm dải):</strong> Có thể đảo chiều</p>
                        <p><strong>🔴 Xấu (Vượt dải):</strong> Extreme, có thể pullback</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Market Sentiment Explanation */}
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    😊 CHỈ SỐ TÂM LÝ THỊ TRƯỜNG
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h5 className="font-medium text-yellow-700 mb-2">😱 Fear & Greed Index</h5>
                      <p className="text-yellow-800 mb-2">
                        <strong>Ý nghĩa:</strong> Chỉ số sợ hãi và tham lam, đo lường tâm lý tổng thể thị trường từ 0-100.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (0-25):</strong> Extreme Fear, cơ hội mua</p>
                        <p><strong>🟡 Trung lập (25-75):</strong> Neutral - Greed</p>
                        <p><strong>🔴 Xấu (75-100):</strong> Extreme Greed, rủi ro cao</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h5 className="font-medium text-yellow-700 mb-2">💬 Social Sentiment</h5>
                      <p className="text-yellow-800 mb-2">
                        <strong>Ý nghĩa:</strong> Tâm lý xã hội từ Twitter, Reddit, các nền tảng MXH. Phản ánh interest của cộng đồng.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (&gt; 0.6):</strong> Tích cực, bullish sentiment</p>
                        <p><strong>🟡 Trung lập (0.4-0.6):</strong> Neutral sentiment</p>
                        <p><strong>🔴 Xấu (&lt; 0.4):</strong> Tiêu cực, bearish sentiment</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h5 className="font-medium text-yellow-700 mb-2">🔍 Google Trends</h5>
                      <p className="text-yellow-800 mb-2">
                        <strong>Ý nghĩa:</strong> Mức độ quan tâm tìm kiếm trên Google. Đo lường public interest và adoption.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (Tăng):</strong> Interest tăng, adoption growing</p>
                        <p><strong>🟡 Trung lập (Ổn định):</strong> Interest ổn định</p>
                        <p><strong>🔴 Xấu (Giảm):</strong> Interest giảm, fading attention</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h5 className="font-medium text-yellow-700 mb-2">📰 News Sentiment</h5>
                      <p className="text-yellow-800 mb-2">
                        <strong>Ý nghĩa:</strong> Tâm lý từ tin tức truyền thông. Phản ánh cách truyền thông đưa tin về thị trường.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (&gt; 0.6):</strong> Tin tích cực, bullish news</p>
                        <p><strong>🟡 Trung lập (0.4-0.6):</strong> Tin cân bằng</p>
                        <p><strong>🔴 Xấu (&lt; 0.4):</strong> Tin tiêu cực, bearish news</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Derivatives Metrics Explanation */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    📊 CHỈ SỐ DERIVATIVES
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h5 className="font-medium text-red-700 mb-2">💰 Funding Rate</h5>
                      <p className="text-red-800 mb-2">
                        <strong>Ý nghĩa:</strong> Tỷ lệ funding giữa long và short positions. Phản ánh áp lực mua/bán trong derivatives market.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (Âm nhỏ):</strong> Shorts pay longs, bearish nhẹ</p>
                        <p><strong>🟡 Trung lập (Gần 0):</strong> Cân bằng thị trường</p>
                        <p><strong>🔴 Xấu (Dương cao &gt; 0.01%):</strong> Longs pay shorts, rủi ro squeeze</p>
                      </div>
                    </div>

                    <div className="bg-red-50 p-3 rounded-lg">
                      <h5 className="font-medium text-red-700 mb-2">📈 Open Interest</h5>
                      <p className="text-red-800 mb-2">
                        <strong>Ý nghĩa:</strong> Tổng giá trị contracts chưa đóng. Đo lường capital và interest trong derivatives.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (Tăng ổn định):</strong> Capital flowing in, healthy growth</p>
                        <p><strong>🟡 Trung lập (Ổn định):</strong> Stable market interest</p>
                        <p><strong>🔴 Xấu (Tăng đột biến):</strong> Speculation extreme, rủi ro</p>
                      </div>
                    </div>

                    <div className="bg-red-50 p-3 rounded-lg">
                      <h5 className="font-medium text-red-700 mb-2">💥 Liquidation Volume</h5>
                      <p className="text-red-800 mb-2">
                        <strong>Ý nghĩa:</strong> Khối lượng positions bị thanh lý. Cho biết mức độ leverage và rủi ro thị trường.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (Thấp):</strong> Low leverage, stable market</p>
                        <p><strong>🟡 Trung lập (Vừa phải):</strong> Normal leverage activity</p>
                        <p><strong>🔴 Xấu (Cao):</strong> High leverage, cascade risk</p>
                      </div>
                    </div>

                    <div className="bg-red-50 p-3 rounded-lg">
                      <h5 className="font-medium text-red-700 mb-2">⚖️ Put/Call Ratio</h5>
                      <p className="text-red-800 mb-2">
                        <strong>Ý nghĩa:</strong> Tỷ lệ giữa put options (bearish) và call options (bullish). Phản ánh sentiment của options traders.
                      </p>
                      <div className="space-y-1">
                        <p><strong>🟢 Tốt (&lt; 0.7):</strong> More calls, bullish sentiment</p>
                        <p><strong>🟡 Trung lập (0.7-1.3):</strong> Balanced sentiment</p>
                        <p><strong>🔴 Xấu (&gt; 1.3):</strong> More puts, bearish sentiment</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Trading Signals Explanation */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    🎯 TÍN HIỆU GIAO DỊCH
                  </h4>
                  <div className="bg-purple-50 p-4 rounded-lg text-sm">
                    <h5 className="font-medium text-purple-700 mb-2">📊 Trading Signal Coordination</h5>
                    <p className="text-purple-800 mb-3">
                      <strong>Ý nghĩa:</strong> Hệ thống tổng hợp tất cả các chỉ số để đưa ra khuyến nghị giao dịch. Signal được tạo ra khi có sự đồng thuận từ nhiều nhóm chỉ số.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p><strong>🟢 BUY Signal:</strong> Khi đa số chỉ báo chỉ ra cơ hội mua</p>
                        <p class="text-xs text-purple-600 mt-1">Điều kiện: MVRV thấp, Fear & Greed thấp, RSI oversold</p>
                      </div>
                      <div>
                        <p><strong>🔴 SELL Signal:</strong> Khi đa số chỉ báo chỉ ra rủi ro</p>
                        <p class="text-xs text-purple-600 mt-1">Điều kiện: MVRV cao, Fear & Greed cao, RSI overbought</p>
                      </div>
                      <div>
                        <p><strong>🟡 HOLD Signal:</strong> Khi thị trường không có xu hướng rõ</p>
                        <p class="text-xs text-purple-600 mt-1">Điều kiện: Chỉ báo hỗn hợp, không consensus</p>
                      </div>
                      <div>
                        <p><strong>📊 Confidence Level:</strong> Độ tin cậy của signal</p>
                        <p className="text-xs text-purple-600 mt-1">&gt; 80%: Rất cao, 60-80%: Trung bình, &lt; 60%: Thấp</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment Guide */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    ⚠️ HƯỚNG DẪN ĐÁNH GIÁ RỦI RO
                  </h4>
                  <div className="bg-orange-50 p-4 rounded-lg text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-medium text-orange-700 mb-2">🟢 LOW RISK</h5>
                        <p class="text-orange-800">Khi đa số chỉ báo ở vùng an toàn:</p>
                        <ul class="text-xs text-orange-700 mt-1 space-y-1">
                          <li>• MVRV &lt; 1.2</li>
                          <li>• Fear & Greed &lt; 30</li>
                          <li>• RSI 30-70</li>
                          <li>• Funding rate gần 0</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-orange-700 mb-2">🟡 MEDIUM RISK</h5>
                        <p class="text-orange-800">Khi chỉ báo hỗn hợp:</p>
                        <ul class="text-xs text-orange-700 mt-1 space-y-1">
                          <li>• MVRV 1.2-1.8</li>
                          <li>• Fear & Greed 30-70</li>
                          <li>• RSI near extremes</li>
                          <li>• Funding rate ±0.01%</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-orange-700 mb-2">🔴 HIGH RISK</h5>
                        <p class="text-orange-800">Khi chỉ báo cực đoan:</p>
                        <ul className="text-xs text-orange-700 mt-1 space-y-1">
                          <li>• MVRV &gt; 2.0</li>
                          <li>• Fear &amp; Greed &gt; 80</li>
                          <li>• RSI &gt; 70 hoặc &lt; 30</li>
                          <li>• Funding rate &gt; 0.02%</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}