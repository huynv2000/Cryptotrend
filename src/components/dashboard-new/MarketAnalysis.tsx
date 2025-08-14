'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Activity, 
  Brain, 
  AlertTriangle,
  Target,
  DollarSign,
  Users,
  Zap,
  ArrowRight
} from 'lucide-react';

interface MarketOverview {
  totalMarketCap: number;
  marketCapChange: number;
  totalVolume24h: number;
  volumeChange: number;
  btcDominance: number;
  ethDominance: number;
  topGainers: { symbol: string; change: number }[];
  topLosers: { symbol: string; change: number }[];
}

interface GrowthAnalysis {
  dauTrend: number;
  transactionGrowth: number;
  userAcquisition: number;
  retentionRate: number;
  adoptionCurve: 'early' | 'growth' | 'mature' | 'declining';
  projections: { period: string; value: number }[];
}

interface CashFlowAnalysis {
  bridgeFlows: { from: string; to: string; volume: number }[];
  stablecoinMovements: { token: string; flow: number; change: number }[];
  exchangeCorrelations: { exchange: string; correlation: number }[];
  liquidityMetrics: { metric: string; value: number; status: 'good' | 'warning' | 'critical' }[];
}

interface AIRecommendation {
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  signal: string;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
  indicators: string[];
}

interface MarketAnalysisProps {
  marketOverview: MarketOverview;
  growthAnalysis: GrowthAnalysis;
  cashFlowAnalysis: CashFlowAnalysis;
  aiRecommendations: AIRecommendation[];
}

export function MarketAnalysis({
  marketOverview,
  growthAnalysis,
  cashFlowAnalysis,
  aiRecommendations
}: MarketAnalysisProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getRecommendationColor = (type: 'bullish' | 'bearish' | 'neutral') => {
    switch (type) {
      case 'bullish': return 'text-green-600 bg-green-50 border-green-200';
      case 'bearish': return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
    }
  };

  const getAdoptionColor = (curve: 'early' | 'growth' | 'mature' | 'declining') => {
    switch (curve) {
      case 'early': return 'text-blue-600';
      case 'growth': return 'text-green-600';
      case 'mature': return 'text-yellow-600';
      case 'declining': return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Market Analysis & Insights</h2>
        <p className="text-gray-600 dark:text-gray-400">Comprehensive market analysis and AI-powered recommendations</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Growth</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Cash Flow</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>AI Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Market Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Market Cap */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Total Market Cap</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(marketOverview.totalMarketCap)}
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  marketOverview.marketCapChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {marketOverview.marketCapChange > 0 ? 
                    <TrendingUp className="w-4 h-4" /> : 
                    <TrendingDown className="w-4 h-4" />
                  }
                  <span>{formatPercent(marketOverview.marketCapChange)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Volume */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>24h Volume</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(marketOverview.totalVolume24h)}
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  marketOverview.volumeChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {marketOverview.volumeChange > 0 ? 
                    <TrendingUp className="w-4 h-4" /> : 
                    <TrendingDown className="w-4 h-4" />
                  }
                  <span>{formatPercent(marketOverview.volumeChange)}</span>
                </div>
              </CardContent>
            </Card>

            {/* BTC Dominance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <PieChart className="w-4 h-4" />
                  <span>BTC Dominance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {marketOverview.btcDominance.toFixed(1)}%
                </div>
                <Progress value={marketOverview.btcDominance} className="mt-2" />
              </CardContent>
            </Card>

            {/* ETH Dominance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <PieChart className="w-4 h-4" />
                  <span>ETH Dominance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {marketOverview.ethDominance.toFixed(1)}%
                </div>
                <Progress value={marketOverview.ethDominance} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Top Movers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Top Gainers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketOverview.topGainers.map((gainer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {gainer.symbol}
                      </span>
                      <Badge className="bg-green-100 text-green-800">
                        +{gainer.change.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span>Top Losers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketOverview.topLosers.map((loser, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {loser.symbol}
                      </span>
                      <Badge className="bg-red-100 text-red-800">
                        {loser.change.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Growth Analysis Tab */}
        <TabsContent value="growth" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>DAU Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercent(growthAnalysis.dauTrend)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Daily Active Users
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>Transaction Growth</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercent(growthAnalysis.transactionGrowth)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  30-day change
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>User Acquisition</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {growthAnalysis.userAcquisition.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  New users (7D)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Retention Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {growthAnalysis.retentionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  30-day retention
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Adoption Curve */}
          <Card>
            <CardHeader>
              <CardTitle>Adoption Curve Analysis</CardTitle>
              <CardDescription>
                Current adoption phase and growth projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Phase:</span>
                  <span className={`ml-2 font-medium ${getAdoptionColor(growthAnalysis.adoptionCurve)}`}>
                    {growthAnalysis.adoptionCurve.charAt(0).toUpperCase() + growthAnalysis.adoptionCurve.slice(1)}
                  </span>
                </div>
                <Badge variant={growthAnalysis.adoptionCurve === 'growth' ? 'default' : 'secondary'}>
                  {growthAnalysis.adoptionCurve === 'growth' ? 'Optimal' : 'Monitor'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">Growth Projections:</div>
                {growthAnalysis.projections.map((projection, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {projection.period}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(projection.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Analysis Tab */}
        <TabsContent value="cashflow" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bridge Flows</CardTitle>
                <CardDescription>Cross-chain bridge transaction volumes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cashFlowAnalysis.bridgeFlows.map((flow, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {flow.from}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {flow.to}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(flow.volume)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stablecoin Movements</CardTitle>
                <CardDescription>Stablecoin flow analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cashFlowAnalysis.stablecoinMovements.map((movement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {movement.token}
                        </span>
                        <div className={`text-xs ${
                          movement.change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercent(movement.change)}
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${
                        movement.flow > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.flow > 0 ? '+' : ''}{formatCurrency(movement.flow)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liquidity Metrics</CardTitle>
              <CardDescription>System liquidity health indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cashFlowAnalysis.liquidityMetrics.map((metric, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metric.metric}
                      </span>
                      <Badge variant={
                        metric.status === 'good' ? 'default' : 
                        metric.status === 'warning' ? 'secondary' : 'destructive'
                      }>
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(metric.value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiRecommendations.map((recommendation, index) => (
              <Card key={index} className={`border-l-4 ${getRecommendationColor(recommendation.type)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5" />
                      <span>AI Recommendation</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {recommendation.confidence}% confidence
                      </Badge>
                      <Badge className={getRiskColor(recommendation.riskLevel)}>
                        {recommendation.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {recommendation.timeframe} timeframe analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {recommendation.signal}
                    </span>
                    <Badge className={getRecommendationColor(recommendation.type)}>
                      {recommendation.type.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Analysis:
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {recommendation.reasoning}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Key Indicators:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.indicators.map((indicator, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}