// Portfolio Overview Component
// Displays total portfolio value, P&L, and allocation chart

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PortfolioPosition {
  id: string;
  cryptoId: string;
  symbol: string;
  name: string;
  amount: number;
  avgBuyPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  logo?: string;
}

interface PortfolioOverviewProps {
  userId?: string;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function PortfolioOverview({ userId, className }: PortfolioOverviewProps) {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [totalProfitLoss, setTotalProfitLoss] = useState<number>(0);
  const [totalProfitLossPercentage, setTotalProfitLossPercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolioData();
  }, [userId]);

  const fetchPortfolioData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/portfolio');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }

      const data = await response.json();
      setPositions(data.positions || []);
      setTotalValue(data.totalValue || 0);
      setTotalProfitLoss(data.totalProfitLoss || 0);
      setTotalProfitLossPercentage(data.totalProfitLossPercentage || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching portfolio data:', err);
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

  // Prepare data for allocation chart
  const chartData = positions.map(position => ({
    name: position.symbol,
    value: position.currentValue,
    percentage: (position.currentValue / totalValue) * 100,
  }));

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>Your investment portfolio at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <LoadingState message="Loading portfolio data..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>Your investment portfolio at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-2">Error loading portfolio</div>
              <div className="text-sm text-muted-foreground mb-4">{error}</div>
              <button
                onClick={fetchPortfolioData}
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
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>Your investment portfolio at a glance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Total Value</div>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Total P&L</div>
            <div className={cn(
              'text-2xl font-bold',
              totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(totalProfitLoss)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">P&L %</div>
            <div className={cn(
              'text-2xl font-bold',
              totalProfitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatPercentage(totalProfitLossPercentage)}
            </div>
          </div>
        </div>

        {/* Allocation Chart */}
        {positions.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Portfolio Allocation</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Position List */}
              <div className="space-y-3">
                {positions.map((position, index) => (
                  <div key={position.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {position.amount} @ {formatCurrency(position.avgBuyPrice)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(position.currentValue)}</div>
                      <div className={cn(
                        'text-sm',
                        position.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatPercentage(position.profitLossPercentage)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {positions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-lg font-medium mb-2">No positions yet</div>
            <div className="text-muted-foreground mb-4">
              Start building your portfolio by adding your first position
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Add Position
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}