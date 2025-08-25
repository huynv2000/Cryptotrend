'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Zap,
  BarChart3,
  Database,
  FileText,
  Trash2,
  Download
} from 'lucide-react';

interface BundleSizeMetric {
  name: string;
  size: number;
  gzipSize: number;
  parsedSize: number;
  percent: number;
  files: string[];
}

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  used: boolean;
  usage: number;
  type: 'direct' | 'dev' | 'transitive';
  canBeRemoved: boolean;
  alternatives: string[];
}

interface BundleAnalysis {
  totalSize: number;
  totalGzipSize: number;
  chunks: BundleSizeMetric[];
  dependencies: DependencyInfo[];
  unusedDependencies: DependencyInfo[];
  largeAssets: BundleSizeMetric[];
  recommendations: string[];
  optimizationScore: number;
}

export default function BundleSizeOptimizationDashboard() {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/performance/bundle-size');
      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data.lastAnalysis);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch bundle analysis data');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/performance/bundle-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to run bundle analysis');
    } finally {
      setLoading(false);
    }
  };

  const optimizeBundle = async () => {
    try {
      setOptimizing(true);
      setError(null);
      
      const response = await fetch('/api/performance/bundle-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchAnalysis(); // Refresh data
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to optimize bundle');
    } finally {
      setOptimizing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loading && !analysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Bundle Analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Bundle Size Optimization
          </h2>
          <p className="text-muted-foreground">
            Analyze and optimize your application bundle size
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAnalysis} disabled={loading} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            {loading ? 'Analyzing...' : 'Analyze Bundle'}
          </Button>
          <Button onClick={optimizeBundle} disabled={optimizing}>
            <Zap className="h-4 w-4 mr-2" />
            {optimizing ? 'Optimizing...' : 'Optimize Bundle'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(analysis.totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(analysis.totalGzipSize)} gzipped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chunks</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.chunks.length}</div>
              <p className="text-xs text-muted-foreground">
                Bundle chunks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unused Deps</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.unusedDependencies.length}</div>
              <p className="text-xs text-muted-foreground">
                Can be removed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={getScoreColor(analysis.optimizationScore)}>
                  {analysis.optimizationScore}
                </span>
                <span className="text-sm">/100</span>
              </div>
              <Badge variant={getScoreBadge(analysis.optimizationScore)}>
                {analysis.optimizationScore >= 80 ? 'Excellent' : 
                 analysis.optimizationScore >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chunks">Chunks</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {analysis && (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bundle Composition</CardTitle>
                  <CardDescription>
                    Overview of your application bundle structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Bundle Size Distribution</span>
                        <span className="text-sm text-muted-foreground">
                          {formatBytes(analysis.totalSize)} total
                        </span>
                      </div>
                      <div className="space-y-2">
                        {analysis.chunks.slice(0, 5).map((chunk, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate">{chunk.name}</span>
                              <span>{formatBytes(chunk.size)} ({chunk.percent.toFixed(1)}%)</span>
                            </div>
                            <Progress value={chunk.percent} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Dependencies</p>
                      <p className="font-semibold">{analysis.dependencies.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Large Assets</p>
                      <p className="font-semibold">{analysis.largeAssets.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Used Deps</p>
                      <p className="font-semibold">
                        {analysis.dependencies.filter(d => d.used).length}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Compression Ratio</p>
                      <p className="font-semibold">
                        {((1 - analysis.totalGzipSize / analysis.totalSize) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chunks" className="space-y-4">
          {analysis && analysis.chunks.length > 0 ? (
            <div className="grid gap-4">
              {analysis.chunks.map((chunk, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{chunk.name}</CardTitle>
                      <Badge variant={chunk.size > 100 * 1024 ? 'destructive' : 'secondary'}>
                        {formatBytes(chunk.size)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {chunk.files.length} file{chunk.files.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Original Size</p>
                          <p className="font-semibold">{formatBytes(chunk.parsedSize)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Gzip Size</p>
                          <p className="font-semibold">{formatBytes(chunk.gzipSize)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Percentage</p>
                          <p className="font-semibold">{chunk.percent.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Compression</p>
                          <p className="font-semibold">
                            {((1 - chunk.gzipSize / chunk.parsedSize) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <Progress value={chunk.percent} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No chunk data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          {analysis && analysis.dependencies.length > 0 ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Unused Dependencies</CardTitle>
                  <CardDescription>
                    Dependencies that can be safely removed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.unusedDependencies.length > 0 ? (
                    <div className="space-y-2">
                      {analysis.unusedDependencies.map((dep, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{dep.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {dep.version} • {formatBytes(dep.size)} • {Math.round(dep.usage * 100)}% used
                            </p>
                            {dep.alternatives.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Alternatives: {dep.alternatives.join(', ')}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Removable
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No unused dependencies found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Dependencies</CardTitle>
                  <CardDescription>
                    Complete list of project dependencies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {analysis.dependencies.map((dep, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{dep.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {dep.version} • {formatBytes(dep.size)} • {dep.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={dep.used ? 'default' : 'secondary'}>
                            {dep.used ? 'Used' : 'Unused'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(dep.usage * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No dependency data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {analysis && analysis.recommendations.length > 0 ? (
            <div className="space-y-4">
              {analysis.recommendations.map((recommendation, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Recommendation #{index + 1}</p>
                        <p className="text-muted-foreground">{recommendation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No recommendations available</p>
                  <p className="text-sm text-muted-foreground">Your bundle is well optimized!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}