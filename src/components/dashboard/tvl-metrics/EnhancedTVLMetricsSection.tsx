// Enhanced TVL Metrics Section Component
// Displays TVL Concentration Risk and TVL Sustainability Score metrics

'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Leaf, 
  Activity, 
  Users, 
  Building,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/LoadingState';
import { cn, formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import type { BlockchainValue, TimeframeValue } from '@/lib/types';

interface EnhancedTVLMetricsData {
  concentrationRisk: {
    concentrationRisk: number;
    herfindahlIndex: number;
    topProtocolDominance: number;
    top3ProtocolDominance: number;
    top5ProtocolDominance: number;
    protocolDiversity: number;
    concentrationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    concentrationTrend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  };
  sustainability: {
    sustainabilityScore: number;
    revenueStability: number;
    userGrowthRate: number;
    protocolHealth: number;
    ecosystemMaturity: number;
    riskAdjustedReturns: number;
    sustainabilityLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    sustainabilityTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };
  overallTVLHealth: number;
  recommendations: string[];
  riskFactors: string[];
  strengthFactors: string[];
  lastUpdated: string;
  isOutdated: boolean;
  confidence: number;
  source: string;
}

interface EnhancedTVLMetricsSectionProps {
  blockchain: BlockchainValue;
  timeframe: TimeframeValue;
  data: EnhancedTVLMetricsData | null;
  isLoading: boolean;
}

const concentrationRiskConfig = [
  {
    key: 'concentrationRisk',
    title: 'Concentration Risk',
    description: 'Overall concentration risk score',
    icon: AlertTriangle,
    color: 'text-red-500',
    format: 'score',
    inverse: true // Lower is better
  },
  {
    key: 'herfindahlIndex',
    title: 'Herfindahl Index',
    description: 'Market concentration measure',
    icon: BarChart3,
    color: 'text-orange-500',
    format: 'number',
    inverse: true
  },
  {
    key: 'topProtocolDominance',
    title: 'Top Protocol',
    description: 'TVL share of top protocol',
    icon: Target,
    color: 'text-purple-500',
    format: 'percentage',
    inverse: true
  },
  {
    key: 'protocolDiversity',
    title: 'Protocol Diversity',
    description: 'Diversity of protocol distribution',
    icon: PieChart,
    color: 'text-green-500',
    format: 'score',
    inverse: false
  }
];

const sustainabilityConfig = [
  {
    key: 'sustainabilityScore',
    title: 'Sustainability Score',
    description: 'Overall ecosystem sustainability',
    icon: Leaf,
    color: 'text-green-500',
    format: 'score',
    inverse: false
  },
  {
    key: 'revenueStability',
    title: 'Revenue Stability',
    description: 'Stability of protocol revenues',
    icon: TrendingUp,
    color: 'text-blue-500',
    format: 'score',
    inverse: false
  },
  {
    key: 'protocolHealth',
    title: 'Protocol Health',
    description: 'Average health of protocols',
    icon: Activity,
    color: 'text-purple-500',
    format: 'score',
    inverse: false
  },
  {
    key: 'ecosystemMaturity',
    title: 'Ecosystem Maturity',
    description: 'Maturity level of ecosystem',
    icon: Building,
    color: 'text-orange-500',
    format: 'score',
    inverse: false
  }
];

export default function EnhancedTVLMetricsSection({
  blockchain,
  timeframe,
  data,
  isLoading
}: EnhancedTVLMetricsSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
  const handleMetricClick = (metricKey: string) => {
    setSelectedMetric(selectedMetric === metricKey ? null : metricKey);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSustainabilityLevelColor = (level: string) => {
    switch (level) {
      case 'EXCELLENT': return 'bg-green-500';
      case 'GOOD': return 'bg-blue-500';
      case 'FAIR': return 'bg-yellow-500';
      case 'POOR': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'DETERIORATING': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatMetricValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return formatCurrency(value);
      case 'score':
        return value.toFixed(1);
      default:
        return formatNumber(value);
    }
  };

  if (isLoading && !data) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Enhanced TVL Metrics</h2>
            <p className="text-sm text-muted-foreground">
              Advanced concentration risk and sustainability analysis for {blockchain}
            </p>
          </div>
          <LoadingState text="Loading enhanced TVL metrics..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Enhanced TVL Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Advanced concentration risk and sustainability analysis for {blockchain}
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">No data available</div>
              <p className="text-muted-foreground">
                Unable to load enhanced TVL metrics for {blockchain}
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
          <h2 className="text-xl font-semibold">Enhanced TVL Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Advanced concentration risk and sustainability analysis for {blockchain} • {timeframe}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={data.isOutdated ? "destructive" : "secondary"}>
            {data.isOutdated ? "Data Outdated" : "Data Fresh"}
          </Badge>
          <Badge variant="outline">
            Confidence: {((data.confidence !== null && data.confidence !== undefined ? Number(data.confidence) || 0 : 0) * 100).toFixed(0)}%
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall TVL Health */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Overall TVL Health</span>
              </div>
              <Badge variant={(data.overallTVLHealth !== null && data.overallTVLHealth !== undefined ? Number(data.overallTVLHealth) || 0 : 0) >= 70 ? "default" : (data.overallTVLHealth !== null && data.overallTVLHealth !== undefined ? Number(data.overallTVLHealth) || 0 : 0) >= 50 ? "secondary" : "destructive"}>
                {(data.overallTVLHealth !== null && data.overallTVLHealth !== undefined ? Number(data.overallTVLHealth) || 0 : 0) >= 70 ? "Good" : (data.overallTVLHealth !== null && data.overallTVLHealth !== undefined ? Number(data.overallTVLHealth) || 0 : 0) >= 50 ? "Fair" : "Poor"}
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-2">
              {(data.overallTVLHealth !== null && data.overallTVLHealth !== undefined 
                ? Number(data.overallTVLHealth) || 0 
                : 0
              ).toFixed(1)}/100
            </div>
            <Progress value={data.overallTVLHealth !== null && data.overallTVLHealth !== undefined ? Number(data.overallTVLHealth) || 0 : 0} className="h-2" />
          </CardContent>
        </Card>

        {/* Concentration Risk */}
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="font-medium">Concentration Risk</span>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(data.concentrationRisk?.concentrationTrend || 'STABLE')}
                <Badge variant="outline" className={getRiskLevelColor(data.concentrationRisk?.concentrationLevel || 'MEDIUM').replace('bg-', 'bg-').replace('500', '100')}>
                  {data.concentrationRisk?.concentrationLevel || 'MEDIUM'}
                </Badge>
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">
              {(data.concentrationRisk?.concentrationRisk !== null && data.concentrationRisk?.concentrationRisk !== undefined 
                ? Number(data.concentrationRisk?.concentrationRisk) || 0 
                : 0
              ).toFixed(1)}/100
            </div>
            <Progress value={data.concentrationRisk?.concentrationRisk !== null && data.concentrationRisk?.concentrationRisk !== undefined ? Number(data.concentrationRisk?.concentrationRisk) || 0 : 0} className="h-2" />
          </CardContent>
        </Card>

        {/* Sustainability Score */}
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Leaf className="h-5 w-5 text-green-500" />
                <span className="font-medium">Sustainability</span>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(data.sustainability?.sustainabilityTrend || 'STABLE')}
                <Badge variant="outline" className={getSustainabilityLevelColor(data.sustainability?.sustainabilityLevel || 'FAIR').replace('bg-', 'bg-').replace('500', '100')}>
                  {data.sustainability?.sustainabilityLevel || 'FAIR'}
                </Badge>
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">
              {(data.sustainability?.sustainabilityScore !== null && data.sustainability?.sustainabilityScore !== undefined 
                ? Number(data.sustainability?.sustainabilityScore) || 0 
                : 0
              ).toFixed(1)}/100
            </div>
            <Progress value={data.sustainability?.sustainabilityScore !== null && data.sustainability?.sustainabilityScore !== undefined ? Number(data.sustainability?.sustainabilityScore) || 0 : 0} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="concentration">Concentration Risk</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                {concentrationRiskConfig.slice(0, 2).concat(sustainabilityConfig.slice(0, 2)).map((metric) => {
                  const metricData = metric.key.startsWith('concentration') 
                    ? data.concentrationRisk?.[metric.key.replace('concentration', '').toLowerCase()]
                    : data.sustainability?.[metric.key.toLowerCase()];
                  
                  return (
                    <Card key={metric.key} className="p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <metric.icon className={cn("h-4 w-4", metric.color)} />
                        <span className="text-xs font-medium">{metric.title}</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {formatMetricValue(metricData || 0, metric.format)}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Protocol Distribution</h3>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Top Protocol</span>
                    <span className="font-semibold">{(data.concentrationRisk?.topProtocolDominance !== null && data.concentrationRisk?.topProtocolDominance !== undefined ? Number(data.concentrationRisk?.topProtocolDominance) || 0 : 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={data.concentrationRisk?.topProtocolDominance !== null && data.concentrationRisk?.topProtocolDominance !== undefined ? Number(data.concentrationRisk?.topProtocolDominance) || 0 : 0} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Top 3 Protocols</span>
                    <span className="font-semibold">{(data.concentrationRisk?.top3ProtocolDominance !== null && data.concentrationRisk?.top3ProtocolDominance !== undefined ? Number(data.concentrationRisk?.top3ProtocolDominance) || 0 : 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={data.concentrationRisk?.top3ProtocolDominance !== null && data.concentrationRisk?.top3ProtocolDominance !== undefined ? Number(data.concentrationRisk?.top3ProtocolDominance) || 0 : 0} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Top 5 Protocols</span>
                    <span className="font-semibold">{(data.concentrationRisk?.top5ProtocolDominance !== null && data.concentrationRisk?.top5ProtocolDominance !== undefined ? Number(data.concentrationRisk?.top5ProtocolDominance) || 0 : 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={data.concentrationRisk?.top5ProtocolDominance !== null && data.concentrationRisk?.top5ProtocolDominance !== undefined ? Number(data.concentrationRisk?.top5ProtocolDominance) || 0 : 0} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="concentration" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concentrationRiskConfig.map((metric) => {
              const metricData = data.concentrationRisk?.[metric.key as keyof typeof data.concentrationRisk] as number;
              const displayValue = metricData || 0;
              
              return (
                <Card 
                  key={metric.key}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedMetric === metric.key && "ring-2 ring-blue-500"
                  )}
                  onClick={() => handleMetricClick(metric.key)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <metric.icon className={cn("h-5 w-5", metric.color)} />
                      <Badge 
                        variant={metric.inverse && displayValue > 50 ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {metric.inverse ? (displayValue > 70 ? "High Risk" : displayValue > 40 ? "Medium Risk" : "Low Risk") : "Good"}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm">{metric.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-1">
                      {formatMetricValue(displayValue, metric.format)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                    {metric.format === 'score' && (
                      <Progress value={metric.inverse ? 100 - displayValue : displayValue} className="h-2 mt-2" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sustainabilityConfig.map((metric) => {
              const metricData = data.sustainability?.[metric.key as keyof typeof data.sustainability] as number;
              const displayValue = metricData || 0;
              
              return (
                <Card 
                  key={metric.key}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedMetric === metric.key && "ring-2 ring-green-500"
                  )}
                  onClick={() => handleMetricClick(metric.key)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <metric.icon className={cn("h-5 w-5", metric.color)} />
                      <Badge 
                        variant={displayValue > 70 ? "default" : displayValue > 50 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {displayValue > 70 ? "Excellent" : displayValue > 50 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm">{metric.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-1">
                      {formatMetricValue(displayValue, metric.format)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                    {metric.format === 'score' && (
                      <Progress value={displayValue} className="h-2 mt-2" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  <span>Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(data.recommendations?.length || 0) > 0 ? (
                    data.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No specific recommendations at this time
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Risk & Strength Factors */}
            <div className="space-y-4">
              {/* Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span>Risk Factors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(data.riskFactors?.length || 0) > 0 ? (
                      data.riskFactors.map((risk, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{risk}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        No significant risk factors identified
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Strength Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Strength Factors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(data.strengthFactors?.length || 0) > 0 ? (
                      data.strengthFactors.map((strength, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{strength}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        No significant strength factors identified
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
        <div className="flex items-center space-x-4">
          <span>Source: {data.source}</span>
          <span>Last Updated: {new Date(data.lastUpdated).toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Confidence: {((data.confidence !== null && data.confidence !== undefined ? Number(data.confidence) || 0 : 0) * 100).toFixed(0)}%</span>
          <div className={cn(
            "w-2 h-2 rounded-full",
            (data.confidence !== null && data.confidence !== undefined ? Number(data.confidence) || 0 : 0) > 0.8 ? "bg-green-500" : 
            (data.confidence !== null && data.confidence !== undefined ? Number(data.confidence) || 0 : 0) > 0.6 ? "bg-yellow-500" : "bg-red-500"
          )} />
        </div>
      </div>
    </section>
  );
}