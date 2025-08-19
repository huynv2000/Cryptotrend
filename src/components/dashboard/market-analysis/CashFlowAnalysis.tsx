// Cash Flow Analysis Component

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/LoadingState';
import { ArrowRight, ArrowLeft, TrendingUp, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketOverview as MarketOverviewType } from '@/lib/types';

interface CashFlowAnalysisProps {
  marketData: MarketOverviewType | null;
  isLoading: boolean;
}

export default function CashFlowAnalysis({ marketData, isLoading }: CashFlowAnalysisProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bridge Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            <span>Bridge Flow Patterns</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">+$245M</div>
                <div className="text-xs text-muted-foreground">Inflow</div>
                <div className="text-xs text-green-500">+18.2%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">-$189M</div>
                <div className="text-xs text-muted-foreground">Outflow</div>
                <div className="text-xs text-red-500">-12.7%</div>
              </div>
            </div>
            
            {/* Bridge Flow Chart Placeholder */}
            <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Net Flow</span>
                <Badge variant="default" className="text-xs">
                  +$56M
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Top Bridge</span>
                <Badge variant="secondary" className="text-xs">
                  Ethereum → BSC
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Flow Efficiency</span>
                <Badge variant="outline" className="text-xs">
                  87.3%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stablecoin Movement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-green-500" />
            <span>Stablecoin Movement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">$1.2B</div>
                <div className="text-xs text-muted-foreground">Total Supply</div>
                <div className="text-xs text-green-500">+5.4%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">$890M</div>
                <div className="text-xs text-muted-foreground">Circulating</div>
                <div className="text-xs text-green-500">+3.2%</div>
              </div>
            </div>
            
            {/* Stablecoin Chart Placeholder */}
            <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
              <PieChart className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">USDC Dominance</span>
                <Badge variant="default" className="text-xs">
                  45.2%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">USDT Dominance</span>
                <Badge variant="secondary" className="text-xs">
                  38.7%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Other Stablecoins</span>
                <Badge variant="outline" className="text-xs">
                  16.1%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Exchange Flow Correlations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <span>Exchange Flow Correlations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Exchange Inflow vs Price</span>
              <Badge variant="default" className="text-xs">
                +0.78
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Exchange Outflow vs Volume</span>
              <Badge variant="default" className="text-xs">
                +0.82
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Net Flow vs Market Cap</span>
              <Badge variant="secondary" className="text-xs">
                +0.65
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Flow Velocity vs Volatility</span>
              <Badge variant="outline" className="text-xs">
                -0.43
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Liquidity Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5 text-orange-500" />
            <span>Liquidity Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">$4.2B</div>
                <div className="text-xs text-muted-foreground">Total Liquidity</div>
                <div className="text-xs text-green-500">+8.7%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">92.3%</div>
                <div className="text-xs text-muted-foreground">Utilization</div>
                <div className="text-xs text-yellow-500">-2.1%</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Depth</span>
                <Badge variant="default" className="text-xs">
                  $125M
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Spread</span>
                <Badge variant="secondary" className="text-xs">
                  0.12%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Slippage</span>
                <Badge variant="outline" className="text-xs">
                  0.08%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}