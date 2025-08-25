'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  BarChart3,
  Target,
  Lightbulb
} from 'lucide-react';

interface BuildMetrics {
  timestamp: number;
  buildTime: number;
  bundleSize: number;
  memoryUsage: number;
  cpuUsage: number;
  success: boolean;
  errors: string[];
  warnings: string[];
  dependencies: string[];
  changedFiles: string[];
}

interface BuildPattern {
  id: string;
  pattern: string;
  frequency: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
  recommendations: string[];
}

interface BuildPrediction {
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  estimatedBuildTime: number;
  potentialIssues: string[];
  recommendations: string[];
}

interface MLModel {
  name: string;
  version: string;
  accuracy: number;
  lastTrained: number;
  isTrained: boolean;
}

interface AIBuildAnalysisData {
  history: BuildMetrics[];
  patterns: BuildPattern[];
  models: MLModel[];
  summary: {
    totalBuilds: number;
    successRate: number;
    avgBuildTime: number;
    patternsIdentified: number;
    modelsTrained: number;
  };
}

export default function AIBuildAnalysisDashboard() {
  const [data, setData] = useState<AIBuildAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<BuildPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/performance/ai-build-analysis');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch AI build analysis data');
    } finally {
      setLoading(false);
    }
  };

  const runBuildAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      
      const response = await fetch('/api/performance/ai-build-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // Refresh data
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to run build analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const getBuildPrediction = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      
      const response = await fetch('/api/performance/ai-build-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'predict' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPrediction(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to get build prediction');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading AI Build Analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI-Powered Build Analysis
          </h2>
          <p className="text-muted-foreground">
            ML-powered build optimization and failure prediction
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runBuildAnalysis} 
            disabled={analyzing}
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
          <Button 
            onClick={getBuildPrediction} 
            disabled={analyzing}
            variant="outline"
          >
            <Target className="h-4 w-4 mr-2" />
            Predict Build
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Builds</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalBuilds}</div>
              <p className="text-xs text-muted-foreground">
                Analyzed builds
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(data.summary.successRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Build success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Build Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(data.summary.avgBuildTime)}
              </div>
              <p className="text-xs text-muted-foreground">
                Average build duration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patterns Found</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.patternsIdentified}</div>
              <p className="text-xs text-muted-foreground">
                Build patterns identified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ML Models</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.modelsTrained}</div>
              <p className="text-xs text-muted-foreground">
                Models trained
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Build Patterns</TabsTrigger>
          <TabsTrigger value="history">Build History</TabsTrigger>
          <TabsTrigger value="models">ML Models</TabsTrigger>
          <TabsTrigger value="prediction">Build Prediction</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          {data && data.patterns.length > 0 ? (
            <div className="grid gap-4">
              {data.patterns.map((pattern) => (
                <Card key={pattern.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pattern.pattern}</CardTitle>
                      <Badge variant={getImpactColor(pattern.impact)}>
                        {pattern.impact} impact
                      </Badge>
                    </div>
                    <CardDescription>{pattern.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Frequency</span>
                        <span className="font-medium">{pattern.frequency} occurrences</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {pattern.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No build patterns identified yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {data && data.history.length > 0 ? (
            <div className="space-y-4">
              {data.history.slice(-10).reverse().map((build, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Build #{data.history.length - index}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={build.success ? 'default' : 'destructive'}>
                          {build.success ? 'Success' : 'Failed'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(build.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Build Time</p>
                        <p className="font-medium">{formatTime(build.buildTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bundle Size</p>
                        <p className="font-medium">{formatSize(build.bundleSize)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Memory</p>
                        <p className="font-medium">{build.memoryUsage.toFixed(1)}MB</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Files Changed</p>
                        <p className="font-medium">{build.changedFiles.length}</p>
                      </div>
                    </div>
                    {build.errors.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-destructive mb-2">Errors:</p>
                        <ul className="space-y-1">
                          {build.errors.slice(0, 3).map((error, errorIndex) => (
                            <li key={errorIndex} className="text-sm text-destructive">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No build history available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          {data && data.models.length > 0 ? (
            <div className="grid gap-4">
              {data.models.map((model) => (
                <Card key={model.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <Badge variant={model.isTrained ? 'default' : 'secondary'}>
                        {model.isTrained ? 'Trained' : 'Untrained'}
                      </Badge>
                    </div>
                    <CardDescription>Version {model.version}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Accuracy</span>
                          <span className="font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={model.accuracy * 100} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Trained</span>
                        <span className="font-medium">
                          {new Date(model.lastTrained).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No ML models available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prediction" className="space-y-4">
          {prediction ? (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Build Prediction</CardTitle>
                    <Badge variant={getRiskColor(prediction.riskLevel)}>
                      {prediction.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <CardDescription>
                    AI-powered build analysis and prediction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <div className="flex items-center gap-2">
                          <Progress value={prediction.confidence * 100} className="flex-1" />
                          <span className="font-medium">{(prediction.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Build Time</p>
                        <p className="font-medium">{formatTime(prediction.estimatedBuildTime)}</p>
                      </div>
                    </div>
                    
                    {prediction.potentialIssues.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Potential Issues
                        </h4>
                        <ul className="space-y-1">
                          {prediction.potentialIssues.map((issue, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-destructive">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {prediction.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {prediction.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No prediction available</p>
                  <p className="text-sm text-muted-foreground">Click "Predict Build" to generate prediction</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}