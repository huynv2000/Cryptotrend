// TVL Comparison Card Component

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import type { TVLComparison } from '@/lib/types';

interface TvlComparisonCardProps {
  data: TVLComparison | null;
  isLoading: boolean;
}

export default function TvlComparisonCard({ data, isLoading }: TvlComparisonCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-purple-500" />
            <span>TVL Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-purple-500" />
            <span>TVL Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No comparison data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary, rankings } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-purple-500" />
          <span>TVL Comparison</span>
          <Badge variant="outline" className="text-xs">
            {summary.totalBlockchains} chains
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(summary.totalTVL)}
              </div>
              <div className="text-xs text-muted-foreground">Total TVL</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.averageTVL)}
              </div>
              <div className="text-xs text-muted-foreground">Average TVL</div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Top TVL
                </span>
              </div>
              <div className="font-semibold text-green-900 dark:text-green-100">
                {summary.topTVL}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                {formatCurrency(summary.topTVLValue)}
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Top Growth
                </span>
              </div>
              <div className="font-semibold text-blue-900 dark:text-blue-100">
                {summary.topGrowth24h}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {summary.topGrowth24hValue >= 0 ? '+' : ''}{summary.topGrowth24hValue.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-3">Top 5 by TVL</h4>
            {rankings.slice(0, 5).map((chain, index) => (
              <div key={chain.name} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 ? "bg-yellow-500 text-white" :
                    index === 1 ? "bg-gray-400 text-white" :
                    index === 2 ? "bg-orange-600 text-white" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{chain.name}</div>
                    <div className="text-xs text-muted-foreground">{chain.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{formatCurrency(chain.tvl)}</div>
                  <div className={cn(
                    "text-xs",
                    chain.change24h >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {chain.change24h >= 0 ? '+' : ''}{chain.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Market Insights */}
          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Market Insights</div>
            <div className="text-sm">
              Average TVL/MC Ratio: <span className="font-semibold">
                {summary.averageTvlToMarketCapRatio.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}