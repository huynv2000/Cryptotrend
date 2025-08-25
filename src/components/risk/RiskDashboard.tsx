// Risk Dashboard Component
// Displays various risk metrics, risk level indicators, and historical risk trends

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RiskMetrics {
  id: string;
  cryptoId: string;
  symbol: string;
  name: string;
  var95: number;
  var99: number;
  expectedShortfall95: number;
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  riskLevel: string;
  riskScore: number;
  riskTrend: string;
  timestamp: string;
}

interface PortfolioRiskSummary {
  totalVaR95: number;
  totalVaR99: number;
  portfolioVolatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  riskLevel: string;
  riskScore: number;
  diversificationScore: number;
}

interface RiskDashboardProps {
  userId?: string;
  className?: string;
}

export default function RiskDashboard({ userId, className }: RiskDashboardProps) {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioRiskSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskData();
  }, [userId]);

  const fetchRiskData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/risk/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch risk data');
      }

      const data = await response.json();
      setRiskMetrics(data.riskMetrics || []);
      setPortfolioSummary(data.portfolioSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching risk data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (riskLevel) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'HIGH': return 'outline';
      case 'CRITICAL': return 'destructive';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Risk Dashboard</CardTitle>
          <CardDescription>Portfolio risk metrics and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <LoadingState message="Loading risk data..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Risk Dashboard</CardTitle>
          <CardDescription>Portfolio risk metrics and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-2">Error loading risk data</div>
              <div className="text-sm text-muted-foreground mb-4">{error}</div>
              <button
                onClick={fetchRiskData}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Risk Dashboard</CardTitle>
        <CardDescription>Portfolio risk metrics and analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portfolio Risk Summary */}
        {portfolioSummary && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Portfolio Risk Summary</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Value at Risk (95%)</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatCurrency(portfolioSummary.totalVaR95)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Portfolio Volatility</div>
                <div className="text-lg font-semibold">
                  {formatPercentage(portfolioSummary.portfolioVolatility)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Max Drawdown</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatPercentage(portfolioSummary.maxDrawdown)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Sharpe Ratio</div>
                <div className="text-lg font-semibold">
                  {portfolioSummary.sharpeRatio.toFixed(2)}
                </div>
              </div>
            </div>
            
            {/* Overall Risk Level */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-sm font-medium">Overall Risk Level</div>
                <div className="text-2xl font-bold">
                  <span className={getRiskColor(portfolioSummary.riskLevel)}>
                    {portfolioSummary.riskLevel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-muted-foreground">Risk Score</div>
                <div className="text-2xl font-bold">
                  {portfolioSummary.riskScore.toFixed(1)}/100
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Asset Risk Metrics */}
        {riskMetrics.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Individual Asset Risk Metrics</div>
            <div className="space-y-3">
              {riskMetrics.map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium">{metric.symbol}</div>
                      <div className="text-sm text-muted-foreground">{metric.name}</div>
                    </div>
                    <Badge variant={getRiskBadgeVariant(metric.riskLevel)}>
                      {metric.riskLevel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <div className="text-sm text-muted-foreground">VaR 95%</div>
                      <div className="font-medium">{formatCurrency(metric.var95)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Volatility</div>
                      <div className="font-medium">{formatPercentage(metric.volatility)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Sharpe</div>
                      <div className="font-medium">{metric.sharpeRatio.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Trends Chart */}
        {riskMetrics.length > 1 && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Risk Trends</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}%`,
                      name === 'volatility' ? 'Volatility' : 'Risk Score'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volatility" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Volatility"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="riskScore" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Risk Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Risk Distribution */}
        {riskMetrics.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Risk Distribution</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symbol" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, 'Max Drawdown']} />
                  <Bar dataKey="maxDrawdown" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Empty State */}
        {riskMetrics.length === 0 && !portfolioSummary && (
          <div className="text-center py-8">
            <div className="text-lg font-medium mb-2">No risk data available</div>
            <div className="text-muted-foreground">
              Add positions to your portfolio to see risk analysis
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={fetchRiskData} variant="outline">
            Refresh Data
          </Button>
          <Button>
            Run Stress Test
          </Button>
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}