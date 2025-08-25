// Stress Testing Component
// Performs stress testing scenarios on portfolio to assess risk under extreme conditions

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface StressTestScenario {
  id: string;
  name: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  probability: number; // 0-1
  marketShock: number; // percentage
  volatilityIncrease: number; // percentage
  correlationBreakdown: number; // percentage
  liquidityShock: number; // percentage
}

interface StressTestResult {
  scenarioId: string;
  scenarioName: string;
  portfolioValueBefore: number;
  portfolioValueAfter: number;
  lossAmount: number;
  lossPercentage: number;
  varBreach: boolean;
  maxDrawdown: number;
  recoveryTime: number; // days
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

interface StressTestingProps {
  userId?: string;
  className?: string;
}

export default function StressTesting({ userId, className }: StressTestingProps) {
  const [scenarios] = useState<StressTestScenario[]>([
    {
      id: 'market_crash_2008',
      name: '2008 Market Crash',
      description: 'Global financial crisis similar to 2008',
      severity: 'EXTREME',
      probability: 0.01,
      marketShock: -50,
      volatilityIncrease: 300,
      correlationBreakdown: 80,
      liquidityShock: -70
    },
    {
      id: 'crypto_winter_2022',
      name: 'Crypto Winter 2022',
      description: 'Extended crypto bear market',
      severity: 'HIGH',
      probability: 0.05,
      marketShock: -70,
      volatilityIncrease: 200,
      correlationBreakdown: 60,
      liquidityShock: -50
    },
    {
      id: 'black_swan_event',
      name: 'Black Swan Event',
      description: 'Unprecedented market event',
      severity: 'EXTREME',
      probability: 0.001,
      marketShock: -80,
      volatilityIncrease: 500,
      correlationBreakdown: 90,
      liquidityShock: -90
    },
    {
      id: 'regulatory_crackdown',
      name: 'Regulatory Crackdown',
      description: 'Major regulatory restrictions',
      severity: 'HIGH',
      probability: 0.02,
      marketShock: -40,
      volatilityIncrease: 150,
      correlationBreakdown: 70,
      liquidityShock: -60
    },
    {
      id: 'exchange_failure',
      name: 'Major Exchange Failure',
      description: 'Collapse of a major exchange',
      severity: 'MEDIUM',
      probability: 0.03,
      marketShock: -30,
      volatilityIncrease: 100,
      correlationBreakdown: 50,
      liquidityShock: -80
    }
  ]);

  const [results, setResults] = useState<StressTestResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-select default scenarios
    setSelectedScenarios(['market_crash_2008', 'crypto_winter_2022', 'black_swan_event']);
  }, []);

  const runStressTests = async () => {
    if (selectedScenarios.length === 0) {
      setError('Please select at least one scenario');
      return;
    }

    try {
      setIsRunning(true);
      setError(null);

      const response = await fetch('/api/risk/stress-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          scenarioIds: selectedScenarios
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run stress tests');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error running stress tests:', err);
    } finally {
      setIsRunning(false);
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

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'EXTREME': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (riskLevel) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'HIGH': return 'outline';
      case 'CRITICAL': return 'destructive';
      default: return 'default';
    }
  };

  const toggleScenario = (scenarioId: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const getWorstCaseScenario = (): StressTestResult | null => {
    if (results.length === 0) return null;
    return results.reduce((worst, current) => 
      current.lossPercentage > worst.lossPercentage ? current : worst
    );
  };

  const getAverageLoss = (): number => {
    if (results.length === 0) return 0;
    return results.reduce((sum, result) => sum + result.lossPercentage, 0) / results.length;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Stress Testing</CardTitle>
        <CardDescription>
          Assess portfolio risk under extreme market scenarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Selection */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Select Scenarios</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={cn(
                  'p-4 border rounded-lg cursor-pointer transition-colors',
                  selectedScenarios.includes(scenario.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => toggleScenario(scenario.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{scenario.name}</div>
                  <Badge 
                    variant={scenario.severity === 'EXTREME' ? 'destructive' : 
                            scenario.severity === 'HIGH' ? 'outline' : 
                            scenario.severity === 'MEDIUM' ? 'secondary' : 'default'}
                  >
                    {scenario.severity}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {scenario.description}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Probability: {(scenario.probability * 100).toFixed(1)}%</span>
                  <span>Market Shock: {formatPercentage(scenario.marketShock)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Run Test Button */}
        <div className="flex gap-2">
          <Button 
            onClick={runStressTests} 
            disabled={isRunning || selectedScenarios.length === 0}
            className="flex-1"
          >
            {isRunning ? 'Running Stress Tests...' : 'Run Stress Tests'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setResults([])}
            disabled={isRunning}
          >
            Clear Results
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="text-red-600 font-medium">Error</div>
            <div className="text-sm text-red-500">{error}</div>
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Stress Test Results</div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Worst Case Loss</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatPercentage(getWorstCaseScenario()?.lossPercentage || 0)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Average Loss</div>
                <div className="text-lg font-semibold text-orange-600">
                  {formatPercentage(getAverageLoss())}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Max Recovery Time</div>
                <div className="text-lg font-semibold">
                  {Math.max(...results.map(r => r.recoveryTime))} days
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Critical Scenarios</div>
                <div className="text-lg font-semibold text-red-600">
                  {results.filter(r => r.riskLevel === 'CRITICAL').length}
                </div>
              </div>
            </div>

            {/* Results Chart */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Loss Distribution</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenarioName" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)}%`,
                        name === 'lossPercentage' ? 'Loss %' : name
                      ]}
                    />
                    <Bar 
                      dataKey="lossPercentage" 
                      fill="#ef4444"
                      name="Loss Percentage"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-3">
              {results.map((result) => (
                <div key={result.scenarioId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">{result.scenarioName}</div>
                    <Badge variant={getRiskBadgeVariant(result.riskLevel)}>
                      {result.riskLevel}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Portfolio Before</div>
                      <div className="font-medium">{formatCurrency(result.portfolioValueBefore)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Portfolio After</div>
                      <div className="font-medium">{formatCurrency(result.portfolioValueAfter)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Loss Amount</div>
                      <div className="font-medium text-red-600">{formatCurrency(result.lossAmount)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Recovery Time</div>
                      <div className="font-medium">{result.recoveryTime} days</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Max Drawdown: </span>
                      <span className="font-medium text-red-600">{formatPercentage(result.maxDrawdown)}</span>
                    </div>
                    {result.varBreach && (
                      <Badge variant="destructive" className="text-xs">
                        VaR Breach
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !isRunning && (
          <div className="text-center py-8">
            <div className="text-lg font-medium mb-2">No stress test results</div>
            <div className="text-muted-foreground">
              Select scenarios and run stress tests to see results
            </div>
          </div>
        )}

        {/* Loading State */}
        {isRunning && (
          <div className="flex items-center justify-center py-8">
            <LoadingState message="Running stress tests..." />
          </div>
        )}
      </CardContent>
    </Card>
  );
}