// Market Analysis Section Component

'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Brain, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarketOverview from './MarketOverview';
import GrowthAnalysis from './GrowthAnalysis';
import CashFlowAnalysis from './CashFlowAnalysis';
import AIRecommendations from './AIRecommendations';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import type { MarketOverview as MarketOverviewType, AIAnalysis, BlockchainValue } from '@/lib/types';

interface MarketAnalysisSectionProps {
  blockchain: BlockchainValue;
  marketData: MarketOverviewType | null;
  aiData: AIAnalysis | null;
  isLoading: boolean;
}

export default function MarketAnalysisSection({
  blockchain,
  marketData,
  aiData,
  isLoading
}: MarketAnalysisSectionProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (isLoading && !marketData && !aiData) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Market Analysis & Insights</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive market analysis for {blockchain}
            </p>
          </div>
          <LoadingState text="Loading market analysis..." />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }
  
  if (!marketData && !aiData) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Market Analysis & Insights</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive market analysis for {blockchain}
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">No data available</div>
              <p className="text-muted-foreground">
                Unable to load market analysis for {blockchain}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Market Analysis & Insights</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive market analysis for {blockchain}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* AI Status */}
          {aiData && (
            <Badge variant="outline" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              AI Analysis Active
            </Badge>
          )}
          {/* Market Status */}
          {marketData && (
            <Badge 
              variant={marketData.priceChange24h >= 0 ? 'default' : 'destructive'}
              className="text-xs"
            >
              {marketData.priceChange24h >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {marketData.priceChange24h >= 0 ? 'Bullish' : 'Bearish'}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {marketData && (
          <>
            <Card className="bg-gradient-to-r from-blue-500/10 to-blue-500/5">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${((marketData.marketCap?.value || 0) / 1e9).toFixed(1)}B
                  </div>
                  <div className="text-xs text-muted-foreground">Market Cap</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {marketData.dominance?.value.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Dominance</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500/10 to-purple-500/5">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${((marketData.volume24h?.value || 0) / 1e9).toFixed(1)}B
                  </div>
                  <div className="text-xs text-muted-foreground">Volume 24h</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500/10 to-orange-500/5">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {marketData.fearGreedIndex?.value.toFixed(0) || 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">Fear & Greed</div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Growth</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Cash Flow</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Insights</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <MarketOverview data={marketData} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="growth" className="space-y-4">
          <GrowthAnalysis marketData={marketData} aiData={aiData} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="cashflow" className="space-y-4">
          <CashFlowAnalysis marketData={marketData} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="ai" className="space-y-4">
          <AIRecommendations data={aiData} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
      
      {/* Quick Actions */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span className="font-medium">AI-Powered Insights</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Risk Assessment
              </Button>
              <Button size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Get Recommendations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}