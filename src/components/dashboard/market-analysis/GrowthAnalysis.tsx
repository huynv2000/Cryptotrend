// Growth Analysis Component

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/LoadingState';
import { TrendingUp, Users, Activity, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketOverview as MarketOverviewType, AIAnalysis } from '@/lib/types';

interface GrowthAnalysisProps {
  marketData: MarketOverviewType | null;
  aiData: AIAnalysis | null;
  isLoading: boolean;
}

export default function GrowthAnalysis({ marketData, aiData, isLoading }: GrowthAnalysisProps) {
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
      {/* User Growth Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span>User Adoption Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">2.4M</div>
                <div className="text-xs text-muted-foreground">Active Users</div>
                <div className="text-xs text-green-500">+12.5%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">156K</div>
                <div className="text-xs text-muted-foreground">New Users</div>
                <div className="text-xs text-green-500">+8.3%</div>
              </div>
            </div>
            
            {/* Growth Chart Placeholder */}
            <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">User Growth Rate</span>
                <Badge variant="default" className="text-xs">
                  +15.2% MoM
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Retention Rate</span>
                <Badge variant="secondary" className="text-xs">
                  87.3%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Acquisition Cost</span>
                <Badge variant="outline" className="text-xs">
                  $45/user
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Transaction Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-500" />
            <span>Transaction Patterns</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">1.2M</div>
                <div className="text-xs text-muted-foreground">Daily Tx</div>
                <div className="text-xs text-green-500">+5.7%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">$3.2B</div>
                <div className="text-xs text-muted-foreground">Volume</div>
                <div className="text-xs text-green-500">+12.1%</div>
              </div>
            </div>
            
            {/* Transaction Chart Placeholder */}
            <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Peak Hours</span>
                <Badge variant="default" className="text-xs">
                  14:00-18:00 UTC
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Tx Size</span>
                <Badge variant="secondary" className="text-xs">
                  $2,450
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Success Rate</span>
                <Badge variant="outline" className="text-xs">
                  99.2%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* AI Growth Insights */}
      {aiData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span>AI Growth Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2",
                  aiData.sentiment === 'bullish' ? 'bg-green-500' : 'bg-red-500'
                )} />
                <div>
                  <div className="font-medium text-sm">
                    {aiData.sentiment === 'bullish' ? 'Positive Growth Trajectory' : 'Growth Concerns Detected'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Confidence: {(aiData.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {aiData.recommendations?.slice(0, 2).map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                  <div>
                    <div className="font-medium text-sm">{rec.title}</div>
                    <div className="text-xs text-muted-foreground">{rec.description}</div>
                    <Badge 
                      variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Market Correlations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <span>Market Correlations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Price vs Volume</span>
              <Badge variant="default" className="text-xs">
                +0.87
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Price vs Active Users</span>
              <Badge variant="default" className="text-xs">
                +0.72
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Volume vs Fees</span>
              <Badge variant="secondary" className="text-xs">
                +0.45
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Market Cap vs Dominance</span>
              <Badge variant="outline" className="text-xs">
                +0.91
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}