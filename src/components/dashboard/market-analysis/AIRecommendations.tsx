// AI Recommendations Component

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/LoadingState';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIAnalysis } from '@/lib/types';

interface AIRecommendationsProps {
  data: AIAnalysis | null;
  isLoading: boolean;
}

export default function AIRecommendations({ data, isLoading }: AIRecommendationsProps) {
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
  
  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              AI analysis not available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* AI Sentiment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <span>AI Sentiment Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={cn(
                "text-3xl font-bold",
                data.sentiment === 'bullish' ? 'text-green-500' : 
                data.sentiment === 'bearish' ? 'text-red-500' : 'text-blue-500'
              )}>
                {data.sentiment === 'bullish' ? 'Bullish' : 
                 data.sentiment === 'bearish' ? 'Bearish' : 'Neutral'}
              </div>
              <div className="text-sm text-muted-foreground">
                Confidence: {(data.confidence * 100).toFixed(1)}%
              </div>
            </div>
            
            {/* Confidence Gauge */}
            <div className="relative">
              <div className="w-full bg-gray-200 h-3 rounded-full">
                <div 
                  className={cn(
                    "h-3 rounded-full",
                    data.sentiment === 'bullish' ? 'bg-green-500' : 
                    data.sentiment === 'bearish' ? 'bg-red-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${data.confidence * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Market Strength</span>
                <Badge 
                  variant={data.sentiment === 'bullish' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {data.sentiment === 'bullish' ? 'Strong' : 'Weak'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Risk Level</span>
                <Badge 
                  variant={data.sentiment === 'bullish' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {data.sentiment === 'bullish' ? 'Low' : 'High'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Trading Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-500" />
            <span>Trading Signals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.signals?.slice(0, 4).map((signal, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={cn(
                  "p-1 rounded-full",
                  signal.type === 'buy' ? 'bg-green-500' :
                  signal.type === 'sell' ? 'bg-red-500' : 'bg-blue-500'
                )}>
                  {signal.type === 'buy' ? (
                    <TrendingUp className="h-3 w-3 text-white" />
                  ) : signal.type === 'sell' ? (
                    <TrendingDown className="h-3 w-3 text-white" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm capitalize">
                    {signal.type} Signal
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {signal.description}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant={signal.type === 'buy' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      Strength: {(signal.strength * 100).toFixed(0)}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {signal.timeframe}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Risk Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={cn(
                "text-3xl font-bold",
                data.riskAssessment.overall === 'low' ? 'text-green-500' :
                data.riskAssessment.overall === 'medium' ? 'text-yellow-500' : 'text-red-500'
              )}>
                {data.riskAssessment.overall.toUpperCase()}
              </div>
              <div className="text-sm text-muted-foreground">
                Score: {data.riskAssessment.score}/{data.riskAssessment.maxScore}
              </div>
            </div>
            
            <div className="space-y-2">
              {data.riskAssessment.factors?.slice(0, 3).map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      factor.level === 'low' ? 'bg-green-500' :
                      factor.level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                    <span className="text-sm">{factor.name}</span>
                  </div>
                  <Badge 
                    variant={factor.level === 'low' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {factor.level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-purple-500" />
            <span>Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recommendations?.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={cn(
                  "p-1 rounded-full mt-0.5",
                  rec.priority === 'high' ? 'bg-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                )}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{rec.title}</div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {rec.description}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rec.timeframe}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Confidence: {(rec.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="outline" size="sm" className="w-full">
            View All Recommendations
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}