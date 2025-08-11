'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MultiLayerDashboardProps {
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
  };
}

export function MultiLayerDashboard({ data, signal }: MultiLayerDashboardProps) {
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

  return (
    <div className="space-y-6">
      {/* Signal Coordination Panel */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            {getSignalIcon(signal.type)}
            TRADING SIGNAL COORDINATION
          </CardTitle>
          <CardDescription className="text-blue-600">
            Phân tích tổng hợp từ tất cả các lớp chỉ số
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
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Analysis Reasoning:</h4>
            <p className="text-sm text-gray-700">{signal.reasoning}</p>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Layer Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">📊 Tổng Quan</TabsTrigger>
          <TabsTrigger value="onchain">⛓️ On-Chain</TabsTrigger>
          <TabsTrigger value="technical">📈 Technical</TabsTrigger>
          <TabsTrigger value="sentiment">😊 Sentiment</TabsTrigger>
          <TabsTrigger value="derivatives">📊 Derivatives</TabsTrigger>
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
                      {data.sentiment.socialSentiment > 0.5 ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>News:</span>
                    <span className="font-medium">
                      {data.sentiment.newsSentiment > 0.5 ? '🟢' : '🔴'}
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
                    <div className="text-xs text-gray-600">Cá voi</div>
                    <div className="text-xs text-gray-500">
                      {data.onChain.supplyDistribution.whaleHoldings?.addressCount || 'N/A'} địa chỉ
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {data.onChain.retailHoldingsPercentage}%
                    </div>
                    <div className="text-xs text-gray-600">Retail</div>
                    <div className="text-xs text-gray-500">
                      {data.onChain.supplyDistribution.retailHoldings?.addressCount?.toLocaleString() || 'N/A'} địa chỉ
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {data.onChain.exchangeHoldingsPercentage}%
                    </div>
                    <div className="text-xs text-gray-600">Sàn giao dịch</div>
                    <div className="text-xs text-gray-500">
                      {data.onChain.supplyDistribution.exchangeHoldings?.addressCount || 'N/A'} địa chỉ
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">
                      {100 - (data.onChain.whaleHoldingsPercentage + data.onChain.retailHoldingsPercentage + data.onChain.exchangeHoldingsPercentage)}%
                    </div>
                    <div className="text-xs text-gray-600">Khác</div>
                    <div className="text-xs text-gray-500">
                      {data.onChain.supplyDistribution.otherHoldings?.addressCount?.toLocaleString() || 'N/A'} địa chỉ
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          {/* Layer 2: Technical Indicators */}
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
                  {data.technical.rsi < 30 ? '🔴 Oversold' : 
                   data.technical.rsi < 70 ? '🟡 Neutral' : '🟢 Overbought'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">MA50/200</CardTitle>
                <CardDescription>Moving Averages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold mb-2 text-center">
                  {data.technical.ma50 > data.technical.ma200 ? '📈 Golden Cross' : '📉 Death Cross'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  MA50: ${data.technical.ma50?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  MA200: ${data.technical.ma200?.toLocaleString() || 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">MACD</CardTitle>
                <CardDescription>MACD Signal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {data.technical.macd > 0 ? '📈 Bullish' : '📉 Bearish'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  MACD: {data.technical.macd?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Signal: {data.technical.macdSignal?.toFixed(2) || 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bollinger Bands</CardTitle>
                <CardDescription>Volatility Bands</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold mb-2 text-center">
                  {data.technical.bollingerUpper && data.technical.bollingerLower ? 
                   '📊 Active' : '⚪ Inactive'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Upper: ${data.technical.bollingerUpper?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Lower: ${data.technical.bollingerLower?.toLocaleString() || 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          {/* Layer 3: Market Sentiment */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fear & Greed</CardTitle>
                <CardDescription>Market Sentiment Index</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold mb-2 p-3 rounded-lg text-center ${getSentimentColor(data.sentiment.fearGreedIndex || 50)}`}>
                  {data.sentiment.fearGreedIndex || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {data.sentiment.fearGreedClassification || 'Neutral'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Social Sentiment</CardTitle>
                <CardDescription>Social Media Analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {data.sentiment.socialSentiment > 0.5 ? '🟢 Positive' : '🔴 Negative'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Score: {(data.sentiment.socialSentiment * 100)?.toFixed(0) || 'N/A'}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Google Trends</CardTitle>
                <CardDescription>Search Volume Trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {data.sentiment.googleTrends > 50 ? '📈 Rising' : '📉 Falling'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Interest: {data.sentiment.googleTrends || 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">News Sentiment</CardTitle>
                <CardDescription>News Analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {data.sentiment.newsSentiment > 0.5 ? '🟢 Positive' : '🔴 Negative'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Score: {(data.sentiment.newsSentiment * 100)?.toFixed(0) || 'N/A'}%
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="derivatives" className="space-y-4">
          {/* Layer 4: Derivative Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Funding Rate</CardTitle>
                <CardDescription>Perpetual Funding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold mb-2 text-center ${data.derivatives.fundingRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(data.derivatives.fundingRate * 100)?.toFixed(3)}%
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {data.derivatives.fundingRate > 0.01 ? '🟠 High Longs' : 
                   data.derivatives.fundingRate < -0.01 ? '🔵 High Shorts' : '⚪ Balanced'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Interest</CardTitle>
                <CardDescription>Total Open Positions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {((data.derivatives.openInterest || 0) / 1000000000).toFixed(1)}B
                </div>
                <div className="text-xs text-gray-600 text-center">
                  USD
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Liquidations</CardTitle>
                <CardDescription>Liquidation Volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center text-red-600">
                  {((data.derivatives.liquidationVolume || 0) / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-600 text-center">
                  USD (24h)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Put/Call Ratio</CardTitle>
                <CardDescription>Options Sentiment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2 text-center">
                  {data.derivatives.putCallRatio?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {data.derivatives.putCallRatio < 0.8 ? '🟢 Bullish' : 
                   data.derivatives.putCallRatio > 1.2 ? '🔴 Bearish' : '⚪ Neutral'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}