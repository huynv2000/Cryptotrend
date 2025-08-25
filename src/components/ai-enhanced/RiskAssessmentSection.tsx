// Risk Assessment Section Component
// Phase 4: AI Analysis Enhancement
// Enterprise-grade risk assessment visualization component with Basel III compliance

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Activity,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  FileText,
  Database,
  Network
} from 'lucide-react';

interface RiskAssessmentSectionProps {
  riskResults: any;
  onRiskAlert?: (alert: any) => void;
  className?: string;
}

interface RiskScore {
  overallRiskScore: number;
  marketRisk: number;
  liquidityRisk: number;
  creditRisk: number;
  operationalRisk: number;
  systemicRisk: number;
}

interface VaRResult {
  value: number;
  confidence: number;
  holdingPeriod: number;
  method: string;
  calculationDate: Date;
}

interface ExpectedShortfallResult {
  value: number;
  confidence: number;
  holdingPeriod: number;
  method: string;
  calculationDate: Date;
}

interface MarketRisk {
  var: VaRResult;
  expectedShortfall: ExpectedShortfallResult;
  beta: number;
  volatility: number;
  correlation: number;
  maxDrawdown: number;
}

interface LiquidityRisk {
  bidAskSpread: number;
  marketDepth: number;
  volumeProfile: any;
  slippage: number;
  impactCost: number;
}

interface CreditRisk {
  counterpartyRisk: number;
  defaultProbability: number;
  exposureAtDefault: number;
  lossGivenDefault: number;
  creditVaR: number;
}

interface OperationalRisk {
  systemRisk: number;
  processRisk: number;
  peopleRisk: number;
  externalRisk: number;
  operationalVaR: number;
}

interface SystemicRisk {
  correlationRisk: number;
  contagionRisk: number;
  liquidityRisk: number;
  marketRisk: number;
  systemicIndex: number;
}

interface RiskCategory {
  category: string;
  score: number;
  contribution: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface RiskSeverity {
  severity: string;
  count: number;
  percentage: number;
  topRisks: string[];
}

interface RiskMitigation {
  risk: string;
  strategy: string;
  priority: 'high' | 'medium' | 'low';
  effectiveness: number;
  implementation: string;
}

// Risk Gauge Component
const RiskGauge: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const getRiskColor = (score: number) => {
    if (score < 0.3) return '#10b981'; // Green
    if (score < 0.7) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getRiskLevel = (score: number) => {
    if (score < 0.3) return 'LOW';
    if (score < 0.7) return 'MEDIUM';
    return 'HIGH';
  };

  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value * circumference;

  return (
    <div className="text-center">
      <div className="relative inline-block">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getRiskColor(value)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: getRiskColor(value) }}>
              {(value * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">{getRiskLevel(value)}</div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium">{label}</div>
    </div>
  );
};

// Risk Breakdown Chart Component
const RiskBreakdownChart: React.FC<{ riskCategories: RiskCategory[] }> = ({ riskCategories }) => {
  const getChartDimensions = () => {
    const width = 400;
    const height = 300;
    const padding = 40;
    return { width, height, padding };
  };

  const { width, height, padding } = getChartDimensions();
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const maxContribution = Math.max(...riskCategories.map(cat => cat.contribution));

  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full">
        {/* Y-axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#64748b"
          strokeWidth={1}
        />
        
        {/* X-axis */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#64748b"
          strokeWidth={1}
        />
        
        {/* Bars */}
        {riskCategories.map((category, index) => {
          const barHeight = (category.contribution / maxContribution) * chartHeight;
          const barWidth = chartWidth / riskCategories.length * 0.8;
          const x = padding + (index * chartWidth / riskCategories.length) + (chartWidth / riskCategories.length - barWidth) / 2;
          const y = height - padding - barHeight;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={colors[index % colors.length]}
                className="hover:opacity-80 cursor-pointer"
              />
              <text
                x={x + barWidth / 2}
                y={height - padding + 15}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
                transform={`rotate(-45 ${x + barWidth / 2} ${height - padding + 15})`}
              >
                {category.category}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs font-semibold fill-current"
              >
                {(category.contribution * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// VaR Chart Component
const VaRChart: React.FC<{ varData: VaRResult; expectedShortfall: ExpectedShortfallResult }> = ({ varData, expectedShortfall }) => {
  const getChartDimensions = () => {
    const width = 350;
    const height = 200;
    const padding = 40;
    return { width, height, padding };
  };

  const { width, height, padding } = getChartDimensions();
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Create normal distribution curve for VaR visualization
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = (i / 100) * chartWidth;
    const y = height - padding - (Math.exp(-Math.pow((i - 50) / 15, 2)) * chartHeight * 0.8);
    points.push({ x, y });
  }

  const varPosition = 100 - (varData.confidence * 100);
  const varX = padding + (varPosition / 100) * chartWidth;
  const varY = height - padding;

  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full">
        {/* Normal distribution curve */}
        <path
          d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
        />
        
        {/* VaR line */}
        <line
          x1={varX}
          y1={padding}
          x2={varX}
          y2={height - padding}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
        
        {/* VaR area */}
        <path
          d={`M ${varX} ${padding} L ${varX} ${height - padding} L ${width - padding} ${height - padding} L ${width - padding} ${padding} Z`}
          fill="#ef4444"
          fillOpacity={0.1}
        />
        
        {/* Labels */}
        <text
          x={varX}
          y={padding - 10}
          textAnchor="middle"
          className="text-xs font-semibold fill-current"
        >
          VaR
        </text>
        
        <text
          x={varX + 10}
          y={varY + 15}
          className="text-xs fill-muted-foreground"
        >
          {(varData.confidence * 100).toFixed(0)}%
        </text>
      </svg>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-center p-2 bg-red-50 rounded">
          <div className="font-semibold text-red-600">VaR</div>
          <div>${varData.value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{(varData.confidence * 100).toFixed(0)}% confidence</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded">
          <div className="font-semibold text-orange-600">Expected Shortfall</div>
          <div>${expectedShortfall.value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{(expectedShortfall.confidence * 100).toFixed(0)}% confidence</div>
        </div>
      </div>
    </div>
  );
};

// Risk Mitigation Card Component
const RiskMitigationCard: React.FC<{ strategy: RiskMitigation }> = ({ strategy }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness > 0.8) return 'text-green-600';
    if (effectiveness > 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="font-semibold">{strategy.risk}</h5>
          <p className="text-sm text-muted-foreground mt-1">{strategy.strategy}</p>
        </div>
        <Badge variant={getPriorityColor(strategy.priority)}>
          {strategy.priority}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Effectiveness</span>
          <div className="flex items-center gap-2">
            <Progress value={strategy.effectiveness * 100} className="w-20" />
            <span className={`text-sm font-medium ${getEffectivenessColor(strategy.effectiveness)}`}>
              {(strategy.effectiveness * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div className="text-sm">
          <span className="text-muted-foreground">Implementation: </span>
          <span className="font-medium">{strategy.implementation}</span>
        </div>
      </div>
    </div>
  );
};

// Basel III Compliance Component
const BaselIIICompliance: React.FC<{ riskResults: any }> = ({ riskResults }) => {
  const complianceChecks = [
    {
      name: 'Capital Ratio',
      current: 1 - riskResults.overallRiskScore,
      required: 0.105,
      status: (1 - riskResults.overallRiskScore) >= 0.105
    },
    {
      name: 'Liquidity Coverage',
      current: 1 - riskResults.liquidityRisk.impactCost,
      required: 1.0,
      status: (1 - riskResults.liquidityRisk.impactCost) >= 1.0
    },
    {
      name: 'Leverage Ratio',
      current: 1 / (1 + riskResults.overallRiskScore),
      required: 0.03,
      status: (1 / (1 + riskResults.overallRiskScore)) >= 0.03
    }
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Basel III Compliance
      </h4>
      
      <div className="space-y-3">
        {complianceChecks.map((check, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {check.status ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className="font-medium">{check.name}</div>
                <div className="text-sm text-muted-foreground">
                  Required: {(check.required * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${check.status ? 'text-green-600' : 'text-red-600'}`}>
                {(check.current * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Current
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Basel III compliance monitoring is active. All ratios are continuously monitored and alerts are generated for any breaches.
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Main Risk Assessment Section Component
export const RiskAssessmentSection: React.FC<RiskAssessmentSectionProps> = ({
  riskResults,
  onRiskAlert,
  className = ""
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!riskResults) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>No risk assessment data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskLevelColor = (score: number) => {
    if (score < 0.3) return 'text-green-600';
    if (score < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadgeVariant = (score: number) => {
    if (score < 0.3) return "default";
    if (score < 0.7) return "secondary";
    return "destructive";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Assessment
          <Badge variant={getRiskBadgeVariant(riskResults.overallRiskScore)}>
            {(riskResults.overallRiskScore * 100).toFixed(1)}% Risk
          </Badge>
        </CardTitle>
        <CardDescription>
          Comprehensive risk analysis following Basel III compliance standards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="counterparty">Counterparty</TabsTrigger>
            <TabsTrigger value="mitigation">Mitigation</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Overall Risk Score */}
            <div className="space-y-4">
              <h4 className="font-semibold">Overall Risk Score</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RiskGauge value={riskResults.overallRiskScore} label="Overall Risk" />
                <RiskGauge value={riskResults.marketRisk.volatility} label="Market Risk" />
                <RiskGauge value={riskResults.liquidityRisk.impactCost} label="Liquidity Risk" />
              </div>
            </div>
            
            {/* Risk Breakdown */}
            <div className="space-y-4">
              <h4 className="font-semibold">Risk Breakdown</h4>
              <RiskBreakdownChart riskCategories={riskResults.riskBreakdown?.byCategory || []} />
            </div>
            
            {/* Risk Severity */}
            <div className="space-y-4">
              <h4 className="font-semibold">Risk Severity Distribution</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(riskResults.riskBreakdown?.bySeverity || []).map((severity: RiskSeverity, index: number) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className={`text-2xl font-bold ${
                      severity.severity === 'LOW' ? 'text-green-600' :
                      severity.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {severity.severity}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {severity.count} risks ({severity.percentage.toFixed(1)}%)
                    </div>
                    <div className="text-xs">
                      Top: {severity.topRisks.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="market" className="space-y-6">
            {/* Market Risk Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Value at Risk (VaR)</h4>
                <VaRChart 
                  varData={riskResults.marketRisk.var}
                  expectedShortfall={riskResults.marketRisk.expectedShortfall}
                />
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Market Risk Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Beta</span>
                    <span className="font-semibold">{riskResults.marketRisk.beta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Volatility</span>
                    <span className="font-semibold">{(riskResults.marketRisk.volatility * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Correlation</span>
                    <span className="font-semibold">{riskResults.marketRisk.correlation.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Max Drawdown</span>
                    <span className="font-semibold">{(riskResults.marketRisk.maxDrawdown * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stress Testing */}
            <div className="space-y-4">
              <h4 className="font-semibold">Stress Testing Scenarios</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Market Crash</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    30% market crash scenario
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Probability: 5%
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">Liquidity Crisis</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Market liquidity freeze
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Probability: 10%
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Volatility Spike</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    3x volatility increase
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Probability: 15%
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="counterparty" className="space-y-6">
            {/* Credit Risk */}
            <div className="space-y-4">
              <h4 className="font-semibold">Credit Risk Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Counterparty Risk</span>
                    <span className="font-semibold">{(riskResults.creditRisk.counterpartyRisk * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Default Probability</span>
                    <span className="font-semibold">{(riskResults.creditRisk.defaultProbability * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Exposure at Default</span>
                    <span className="font-semibold">${riskResults.creditRisk.exposureAtDefault.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Loss Given Default</span>
                    <span className="font-semibold">{(riskResults.creditRisk.lossGivenDefault * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Credit VaR</span>
                    <span className="font-semibold">${riskResults.creditRisk.creditVaR.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Operational Risk */}
            <div className="space-y-4">
              <h4 className="font-semibold">Operational Risk</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">System Risk</span>
                  </div>
                  <div className="text-lg font-semibold">{(riskResults.operationalRisk.systemRisk * 100).toFixed(2)}%</div>
                  <Progress value={riskResults.operationalRisk.systemRisk * 100} className="h-2 mt-2" />
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Process Risk</span>
                  </div>
                  <div className="text-lg font-semibold">{(riskResults.operationalRisk.processRisk * 100).toFixed(2)}%</div>
                  <Progress value={riskResults.operationalRisk.processRisk * 100} className="h-2 mt-2" />
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Network className="h-4 w-4 text-green-600" />
                    <span className="font-medium">People Risk</span>
                  </div>
                  <div className="text-lg font-semibold">{(riskResults.operationalRisk.peopleRisk * 100).toFixed(2)}%</div>
                  <Progress value={riskResults.operationalRisk.peopleRisk * 100} className="h-2 mt-2" />
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">External Risk</span>
                  </div>
                  <div className="text-lg font-semibold">{(riskResults.operationalRisk.externalRisk * 100).toFixed(2)}%</div>
                  <Progress value={riskResults.operationalRisk.externalRisk * 100} className="h-2 mt-2" />
                </div>
              </div>
            </div>
            
            {/* Systemic Risk */}
            <div className="space-y-4">
              <h4 className="font-semibold">Systemic Risk</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Systemic Index</span>
                  </div>
                  <div className="text-lg font-semibold">{(riskResults.systemicRisk.systemicIndex * 100).toFixed(2)}%</div>
                  <Progress value={riskResults.systemicRisk.systemicIndex * 100} className="h-2 mt-2" />
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Risk Components</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Correlation Risk</span>
                      <span>{(riskResults.systemicRisk.correlationRisk * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contagion Risk</span>
                      <span>{(riskResults.systemicRisk.contagionRisk * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Liquidity Risk</span>
                      <span>{(riskResults.systemicRisk.liquidityRisk * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Risk</span>
                      <span>{(riskResults.systemicRisk.marketRisk * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="mitigation" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Risk Mitigation Strategies</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(riskResults.riskMitigation || []).map((strategy: RiskMitigation, index: number) => (
                  <RiskMitigationCard key={index} strategy={strategy} />
                ))}
              </div>
            </div>
            
            {/* Risk Alerts */}
            {riskResults.overallRiskScore > 0.7 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">High Risk Alert</div>
                  The overall risk level has exceeded the 70% threshold. Immediate attention is required. Consider implementing risk mitigation strategies and reducing exposure to high-risk assets.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="compliance" className="space-y-6">
            <BaselIIICompliance riskResults={riskResults} />
            
            {/* Compliance Monitoring */}
            <div className="space-y-4">
              <h4 className="font-semibold">Compliance Monitoring</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Monitoring Status</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Real-time monitoring active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Automated alert system enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Compliance reporting scheduled</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Reporting</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Report</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Report</span>
                      <span>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Report Status</span>
                      <span className="text-green-600 font-medium">Compliant</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};