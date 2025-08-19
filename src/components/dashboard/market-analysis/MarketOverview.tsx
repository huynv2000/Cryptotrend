// Market Overview Component

'use client';

import { PieChart, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import type { MarketOverview as MarketOverviewType } from '@/lib/types';

interface MarketOverviewProps {
  data: MarketOverviewType | null;
  isLoading: boolean;
}

export default function MarketOverview({ data, isLoading }: MarketOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
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
  
  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-2">No market data available</div>
            <p className="text-muted-foreground">
              Unable to load market overview data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Market Cap Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-blue-500" />
            <span>Market Cap Dominance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold">
                ${((data.marketCap?.value || 0) / 1e9).toFixed(1)}B
              </div>
              <div className={cn(
                "text-sm",
                data.marketCap?.changePercent >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {data.marketCap?.changePercent >= 0 ? '+' : ''}{data.marketCap?.changePercent.toFixed(2)}%
              </div>
            </div>
            
            {/* Placeholder for pie chart */}
            <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
              <PieChart className="h-12 w-12 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Bitcoin</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-sm font-medium">45%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Ethereum</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-sm font-medium">25%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Others</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-sm font-medium">30%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Volume Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-500" />
            <span>Volume Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${((data.volume24h?.value || 0) / 1e9).toFixed(1)}B
                </div>
                <div className="text-xs text-muted-foreground">Volume 24h</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  data.priceChange24h?.changePercent >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {data.priceChange24h?.changePercent >= 0 ? '+' : ''}{data.priceChange24h?.changePercent?.toFixed(2) || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Price Change 24h</div>
              </div>
            </div>
            
            {/* Placeholder for volume chart */}
            <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">High Volume</span>
                <Badge variant="outline" className="text-xs">
                  ${((data.volume24h?.value || 0) * 1.2 / 1e9).toFixed(1)}B
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Volume</span>
                <Badge variant="secondary" className="text-xs">
                  ${((data.volume24h?.value || 0) / 1e9).toFixed(1)}B
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Low Volume</span>
                <Badge variant="outline" className="text-xs">
                  ${((data.volume24h?.value || 0) * 0.8 / 1e9).toFixed(1)}B
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Fear & Greed Index */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-orange-500" />
            <span>Fear & Greed Index</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={cn(
                "text-4xl font-bold",
                data.fearGreedIndex?.value >= 50 ? "text-green-500" : "text-red-500"
              )}>
                {data.fearGreedIndex?.value.toFixed(0) || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">
                {data.fearGreedIndex?.value >= 50 ? 'Greed' : 'Fear'}
              </div>
            </div>
            
            {/* Fear & Greed Gauge */}
            <div className="relative">
              <div className="w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-4 rounded-full"></div>
              <div 
                className="absolute top-0 w-1 h-4 bg-white border-2 border-gray-800 rounded-full"
                style={{ left: `${(data.fearGreedIndex?.value || 0)}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">Extreme Fear</div>
                <div className="text-muted-foreground">0-25</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Extreme Greed</div>
                <div className="text-muted-foreground">75-100</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sector Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <span>Sector Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.marketAnalysis?.sectorPerformance?.slice(0, 5).map((sector, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    sector.performance >= 0 ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-sm font-medium">{sector.sector}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "text-sm font-medium",
                    sector.performance >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                  </span>
                  <Badge variant="outline" className="text-xs">
                    ${((sector.marketCap || 0) / 1e9).toFixed(1)}B
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}