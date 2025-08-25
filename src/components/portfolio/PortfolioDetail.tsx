// Portfolio Detail Component
// Displays detailed information about individual holdings with performance charts

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  totalValue: number;
  timestamp: string;
}

interface PerformanceData {
  date: string;
  value: number;
  costBasis: number;
  profitLoss: number;
}

interface PortfolioDetailProps {
  positionId?: string;
  cryptoId?: string;
  className?: string;
}

export default function PortfolioDetail({ positionId, cryptoId, className }: PortfolioDetailProps) {
  const [position, setPosition] = useState<PortfolioPosition | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (positionId || cryptoId) {
      fetchPositionDetail();
    }
  }, [positionId, cryptoId]);

  const fetchPositionDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const endpoint = positionId 
        ? `/api/portfolio/positions/${positionId}`
        : `/api/portfolio/crypto/${cryptoId}`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch position details');
      }

      const data = await response.json();
      setPosition(data.position);
      setTransactions(data.transactions || []);
      setPerformanceData(data.performanceData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching position details:', err);
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Position Details</CardTitle>
          <CardDescription>Detailed view of your holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <LoadingState message="Loading position details..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Position Details</CardTitle>
          <CardDescription>Detailed view of your holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-2">Error loading position details</div>
              <div className="text-sm text-muted-foreground mb-4">{error}</div>
              <button
                onClick={fetchPositionDetail}
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

  if (!position) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Position Details</CardTitle>
          <CardDescription>Detailed view of your holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-lg font-medium mb-2">Position not found</div>
            <div className="text-muted-foreground">
              The requested position could not be found
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {position.logo && (
                <img 
                  src={position.logo} 
                  alt={position.symbol} 
                  className="w-8 h-8 rounded-full"
                />
              )}
              {position.symbol} - {position.name}
            </CardTitle>
            <CardDescription>Detailed view of your holdings</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Edit Position
            </Button>
            <Button variant="destructive" size="sm">
              Sell
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Amount</div>
            <div className="text-lg font-semibold">{position.amount.toLocaleString()}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Avg Buy Price</div>
            <div className="text-lg font-semibold">{formatCurrency(position.avgBuyPrice)}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Current Value</div>
            <div className="text-lg font-semibold">{formatCurrency(position.currentValue)}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">P&L</div>
            <div className={cn(
              'text-lg font-semibold',
              position.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(position.profitLoss)} ({formatPercentage(position.profitLossPercentage)})
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        {performanceData.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Performance Over Time</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'value' ? 'Portfolio Value' : name === 'costBasis' ? 'Cost Basis' : 'P&L'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Portfolio Value"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="costBasis" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Cost Basis"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Transaction History</div>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={transaction.type === 'BUY' ? 'default' : 'secondary'}>
                      {transaction.type}
                    </Badge>
                    <div>
                      <div className="font-medium">
                        {transaction.amount.toLocaleString()} @ {formatCurrency(transaction.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(transaction.totalValue)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No transactions found for this position
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}