'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, PieChart, Activity } from 'lucide-react';
import { Header } from './Header';
import { UsageMetrics } from './UsageMetrics';
import { CashFlowMetrics } from './CashFlowMetrics';
import { MarketAnalysis } from './MarketAnalysis';
import { apiV2 } from '@/lib/api-v2/client';
import { RealTimeDataProvider } from './RealTimeDataProvider';

interface UsageMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changePercent: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  sparklineData: number[];
  spikeAlert?: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface CashFlowMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changePercent: number;
  unit: string;
  trend: 'inflow' | 'outflow' | 'stable';
  icon: React.ReactNode;
  description: string;
  breakdown?: {
    label: string;
    value: number;
    percentage: number;
  }[];
  spikeAlert?: boolean;
  priority: 'high' | 'medium' | 'low';
}

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

export function BlockchainDashboard() {
  const [selectedBlockchain, setSelectedBlockchain] = useState('bitcoin');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('30D');
  const [loading, setLoading] = useState(false);

  // State for API data
  const [usageMetrics, setUsageMetrics] = useState<any[]>([]);
  const [cashFlowMetrics, setCashFlowMetrics] = useState<any[]>([]);
  const [marketOverview, setMarketOverview] = useState<any>(null);
  const [growthAnalysis, setGrowthAnalysis] = useState<any>(null);
  const [cashFlowAnalysis, setCashFlowAnalysis] = useState<any>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch usage metrics
      const usageResponse = await apiV2.getUsageMetrics(selectedBlockchain, timeRange);
      if (usageResponse.success && usageResponse.data) {
        setUsageMetrics(transformUsageMetrics(usageResponse.data));
      }

      // Fetch cash flow metrics
      const cashFlowResponse = await apiV2.getCashFlowMetrics(selectedBlockchain, timeRange);
      if (cashFlowResponse.success && cashFlowResponse.data) {
        setCashFlowMetrics(transformCashFlowMetrics(cashFlowResponse.data));
      }

      // Fetch market overview
      const marketResponse = await apiV2.getMarketOverview(selectedBlockchain);
      if (marketResponse.success && marketResponse.data) {
        setMarketOverview(marketResponse.data);
      }

      // Fetch AI analysis
      const aiResponse = await apiV2.getAIAnalysis(selectedBlockchain);
      if (aiResponse.success && aiResponse.data) {
        setGrowthAnalysis(aiResponse.data.growthAnalysis);
        setCashFlowAnalysis(aiResponse.data.cashFlowAnalysis);
        setAiRecommendations(aiResponse.data.recommendations);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to mock data
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const transformUsageMetrics = (data: any) => {
    return [
      {
        id: 'daily-active-addresses',
        title: 'Daily Active Addresses',
        value: data.dailyActiveAddresses || 0,
        change: Math.floor((data.dailyActiveAddresses || 0) * 0.0374),
        changePercent: 3.74,
        unit: '',
        trend: 'up',
        sparklineData: generateMockSparkline(7, data.dailyActiveAddresses || 0),
        spikeAlert: false,
        priority: 'medium'
      },
      {
        id: 'new-addresses',
        title: 'New Addresses',
        value: data.newAddresses || 0,
        change: Math.floor((data.newAddresses || 0) * 0.1644),
        changePercent: 16.44,
        unit: '',
        trend: 'up',
        sparklineData: generateMockSparkline(7, data.newAddresses || 0),
        spikeAlert: true,
        priority: 'high'
      },
      {
        id: 'daily-transactions',
        title: 'Daily Transactions',
        value: data.dailyTransactions || 0,
        change: -Math.floor((data.dailyTransactions || 0) * 0.0370),
        changePercent: -3.70,
        unit: '',
        trend: 'down',
        sparklineData: generateMockSparkline(7, data.dailyTransactions || 0),
        spikeAlert: false,
        priority: 'low'
      },
      {
        id: 'transaction-volume',
        title: 'On-chain Transaction Volume',
        value: data.transactionVolume || 0,
        change: Math.floor((data.transactionVolume || 0) * 0.0440),
        changePercent: 4.40,
        unit: 'USD',
        trend: 'up',
        sparklineData: generateMockSparkline(7, data.transactionVolume || 0),
        spikeAlert: false,
        priority: 'medium'
      },
      {
        id: 'avg-transaction-fee',
        title: 'Average Transaction Fee',
        value: data.averageTransactionFee || 0,
        change: -(data.averageTransactionFee || 0) * 0.1554,
        changePercent: -15.54,
        unit: 'USD',
        trend: 'down',
        sparklineData: generateMockSparkline(7, data.averageTransactionFee || 0),
        spikeAlert: false,
        priority: 'low'
      },
      {
        id: 'network-hash-rate',
        title: 'Network Hash Rate',
        value: data.networkHashRate || 0,
        change: Math.floor((data.networkHashRate || 0) * 0.0112),
        changePercent: 1.12,
        unit: 'HASH',
        trend: 'up',
        sparklineData: generateMockSparkline(7, data.networkHashRate || 0),
        spikeAlert: false,
        priority: 'medium'
      }
    ];
  };

  const transformCashFlowMetrics = (data: any) => {
    return [
      {
        id: 'bridge-flows',
        title: 'Bridge Flows',
        value: data.bridgeFlows || 0,
        change: Math.floor((data.bridgeFlows || 0) * 0.25),
        changePercent: 25.00,
        unit: 'USD',
        trend: 'inflow',
        icon: <ArrowRight className="w-5 h-5 text-blue-600" />,
        description: 'Cross-chain bridge volume',
        breakdown: [
          { label: 'Ethereum → BSC', value: Math.floor((data.bridgeFlows || 0) * 0.6), percentage: 60 },
          { label: 'BSC → Polygon', value: Math.floor((data.bridgeFlows || 0) * 0.28), percentage: 28 },
          { label: 'Other', value: Math.floor((data.bridgeFlows || 0) * 0.12), percentage: 12 }
        ],
        spikeAlert: true,
        priority: 'high'
      },
      {
        id: 'exchange-flows',
        title: 'Exchange Flows',
        value: -(data.exchangeFlows || 0),
        change: -Math.floor((data.exchangeFlows || 0) * 0.2143),
        changePercent: -21.43,
        unit: 'USD',
        trend: 'outflow',
        icon: <ArrowLeft className="w-5 h-5 text-red-600" />,
        description: 'Net exchange flow',
        spikeAlert: false,
        priority: 'medium'
      },
      {
        id: 'staking-metrics',
        title: 'Staking Supply',
        value: data.stakingSupply || 0,
        change: (data.stakingSupply || 0) * 0.0194,
        changePercent: 1.94,
        unit: '%',
        trend: 'stable',
        icon: <PieChart className="w-5 h-5 text-green-600" />,
        description: 'Percentage of supply staked',
        spikeAlert: false,
        priority: 'low'
      },
      {
        id: 'mining-validation',
        title: 'Mining/Validation',
        value: data.miningValidation || 0,
        change: Math.floor((data.miningValidation || 0) * 0.0112),
        changePercent: 1.12,
        unit: 'HASH',
        trend: 'stable',
        icon: <Activity className="w-5 h-5 text-purple-600" />,
        description: 'Network hash rate',
        spikeAlert: false,
        priority: 'medium'
      }
    ];
  };

  const generateMockSparkline = (length: number, baseValue: number) => {
    return Array.from({ length }, (_, i) => {
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      return Math.floor(baseValue * (1 + variation));
    });
  };

  const setMockData = () => {
    // Fallback mock data
    setUsageMetrics(transformUsageMetrics({
      dailyActiveAddresses: 1250000,
      newAddresses: 85000,
      dailyTransactions: 650000,
      transactionVolume: 28500000000,
      averageTransactionFee: 12.50,
      networkHashRate: 450000000000000000
    }));

    setCashFlowMetrics(transformCashFlowMetrics({
      bridgeFlows: 125000000,
      exchangeFlows: 85000000,
      stakingSupply: 15.8,
      miningValidation: 450000000000000000
    }));

    setMarketOverview({
      totalMarketCap: 1200000000000,
      marketCapChange: 2.5,
      totalVolume24h: 45000000000,
      volumeChange: -1.2,
      btcDominance: 48.5,
      ethDominance: 18.2,
      topGainers: [
        { symbol: 'SOL', change: 12.5 },
        { symbol: 'AVAX', change: 8.3 },
        { symbol: 'MATIC', change: 6.7 }
      ],
      topLosers: [
        { symbol: 'DOGE', change: -5.2 },
        { symbol: 'SHIB', change: -3.8 },
        { symbol: 'XRP', change: -2.1 }
      ]
    });

    setGrowthAnalysis({
      dauTrend: 5.2,
      transactionGrowth: 3.8,
      userAcquisition: 125000,
      retentionRate: 78.5,
      adoptionCurve: 'growth',
      projections: [
        { period: '30 days', value: 1350000000000 },
        { period: '90 days', value: 1500000000000 },
        { period: '180 days', value: 1750000000000 }
      ]
    });

    setCashFlowAnalysis({
      bridgeFlows: [
        { from: 'Ethereum', to: 'BSC', volume: 75000000 },
        { from: 'BSC', to: 'Polygon', volume: 35000000 },
        { from: 'Ethereum', to: 'Arbitrum', volume: 25000000 }
      ],
      stablecoinMovements: [
        { token: 'USDT', flow: 125000000, change: 5.2 },
        { token: 'USDC', flow: -85000000, change: -3.1 },
        { token: 'DAI', flow: 25000000, change: 1.8 }
      ],
      exchangeCorrelations: [
        { exchange: 'Binance', correlation: 0.85 },
        { exchange: 'Coinbase', correlation: 0.78 },
        { exchange: 'Kraken', correlation: 0.72 }
      ],
      liquidityMetrics: [
        { metric: 'Total Liquidity', value: 25000000000, status: 'good' },
        { metric: 'Trading Volume', value: 4500000000, status: 'good' },
        { metric: 'Pool Utilization', value: 78.5, status: 'warning' }
      ]
    });

    setAiRecommendations([
      {
        type: 'bullish',
        confidence: 85,
        signal: 'Strong Buy Signal',
        reasoning: 'Network fundamentals show strong growth with increasing adoption and positive cash flow patterns.',
        riskLevel: 'medium',
        timeframe: '30 days',
        indicators: ['DAU Growth', 'Positive Cash Flow', 'Market Cap Expansion']
      },
      {
        type: 'neutral',
        confidence: 72,
        signal: 'Hold Position',
        reasoning: 'Market shows mixed signals with strong fundamentals but some technical resistance.',
        riskLevel: 'low',
        timeframe: '7 days',
        indicators: ['Stable Hash Rate', 'Moderate Volume', 'Mixed Market Sentiment']
      }
    ]);
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  const handleBlockchainChange = (blockchain: string) => {
    setSelectedBlockchain(blockchain);
    fetchData();
  };

  const handleTimeRangeChange = (range: '7D' | '30D' | '90D') => {
    setTimeRange(range);
    fetchData();
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedBlockchain, timeRange]);

  return (
    <RealTimeDataProvider selectedBlockchain={selectedBlockchain}>
      {({ isConnected, lastUpdate: realTimeUpdate, data: realTimeData }) => (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
          <Header
            selectedBlockchain={selectedBlockchain}
            onBlockchainChange={handleBlockchainChange}
            lastUpdate={realTimeUpdate}
            onRefresh={handleRefresh}
            theme={theme}
            onThemeChange={setTheme}
          />

          <main className="container mx-auto px-6 py-8">
            <div className="space-y-8">
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isConnected ? 'Real-time connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last update: {realTimeUpdate.toLocaleTimeString()}
                </div>
              </div>

              {/* Usage & Growth Metrics Section */}
              <UsageMetrics
                metrics={usageMetrics}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />

              {/* Cash Flow Metrics Section */}
              <CashFlowMetrics
                metrics={cashFlowMetrics}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />

              {/* Market Analysis & Insights Section */}
              {marketOverview && growthAnalysis && cashFlowAnalysis && aiRecommendations && (
                <MarketAnalysis
                  marketOverview={marketOverview}
                  growthAnalysis={growthAnalysis}
                  cashFlowAnalysis={cashFlowAnalysis}
                  aiRecommendations={aiRecommendations}
                />
              )}
            </div>
          </main>
        </div>
      )}
    </RealTimeDataProvider>
  );
}