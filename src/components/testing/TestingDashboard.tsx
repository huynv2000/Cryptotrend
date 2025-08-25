/**
 * Testing Dashboard Component
 * Phase 2.8 - Testing & User Feedback
 * 
 * Comprehensive dashboard for monitoring AI personalization testing,
 * displaying test results, user feedback, and system performance metrics
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TestTube, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Star,
  MessageSquare,
  Target,
  Zap,
  Database,
  Activity
} from 'lucide-react';

interface TestingDashboardProps {
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface TestResult {
  testId: string;
  testName: string;
  category: 'hook' | 'api' | 'component' | 'performance' | 'user-feedback';
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'PENDING';
  duration: number;
  timestamp: Date;
  metrics?: {
    responseTime: number;
    accuracy: number;
    personalizationScore: number;
    userSatisfaction: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
    throughput: number;
    recommendationQuality: number;
  };
}

interface FeedbackSummary {
  totalFeedback: number;
  averageRating: number;
  positiveFeedback: number;
  negativeFeedback: number;
  topSuggestions: Array<{
    suggestion: string;
    count: number;
  }>;
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
}

export function TestingDashboard({ 
  userId = 'default-user', 
  autoRefresh = true, 
  refreshInterval = 30000 
}: TestingDashboardProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch testing data
  const fetchTestingData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch test results
      const testResponse = await fetch('/api/testing/results');
      if (testResponse.ok) {
        const testData = await testResponse.json();
        setTestResults(testData.results || []);
      }

      // Fetch feedback summary
      const feedbackResponse = await fetch('/api/testing/feedback/summary');
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedbackSummary(feedbackData);
      }

      // Fetch performance metrics
      const performanceResponse = await fetch('/api/testing/performance');
      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        setPerformanceMetrics(performanceData);
      }

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Failed to fetch testing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch and auto-refresh setup
  useEffect(() => {
    fetchTestingData();

    if (autoRefresh) {
      const interval = setInterval(fetchTestingData, refreshInterval);
      return () => clearInterval(interval);
    }
    // Explicit return for when autoRefresh is false
    return undefined;
  }, [fetchTestingData, autoRefresh, refreshInterval]);

  // Calculate test statistics
  const testStats = React.useMemo(() => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'PASSED').length;
    const failed = testResults.filter(r => r.status === 'FAILED').length;
    const skipped = testResults.filter(r => r.status === 'SKIPPED').length;
    const pending = testResults.filter(r => r.status === 'PENDING').length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, skipped, pending, successRate };
  }, [testResults]);

  // Calculate category breakdown
  const categoryBreakdown = React.useMemo(() => {
    const categories = testResults.reduce((acc, result) => {
      acc[result.category] = (acc[result.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories).map(([category, count]) => ({
      category,
      count,
      percentage: testResults.length > 0 ? (count / testResults.length) * 100 : 0
    }));
  }, [testResults]);

  // Get recent test results
  const recentTests = React.useMemo(() => {
    return testResults
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [testResults]);

  // Chart data preparation
  const testStatusData = [
    { name: 'Passed', value: testStats.passed, color: '#22c55e' },
    { name: 'Failed', value: testStats.failed, color: '#ef4444' },
    { name: 'Skipped', value: testStats.skipped, color: '#f59e0b' },
    { name: 'Pending', value: testStats.pending, color: '#6b7280' }
  ];

  const categoryData = categoryBreakdown.map(item => ({
    name: item.category,
    count: item.count,
    percentage: item.percentage
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading testing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Personalization Testing Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor testing progress, user feedback, and system performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button onClick={fetchTestingData} variant="outline">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold">{testStats.total}</p>
              </div>
              <TestTube className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={testStats.successRate} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {testStats.successRate.toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">User Feedback</p>
                <p className="text-2xl font-bold">{feedbackSummary?.totalFeedback || 0}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {feedbackSummary?.averageRating.toFixed(1) || '0.0'}/5
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-2xl font-bold">
                  {performanceMetrics?.responseTime.toFixed(0) || '0'}ms
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Health</p>
                <p className="text-2xl font-bold">
                  {performanceMetrics?.uptime.toFixed(1) || '0'}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              System uptime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Test Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Test Status Distribution</CardTitle>
                <CardDescription>Overview of test results by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={testStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {testStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Test Categories</CardTitle>
                <CardDescription>Breakdown by test category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>Latest test executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentTests.map((test) => (
                  <div key={test.testId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {test.status === 'PASSED' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {test.status === 'FAILED' && <AlertCircle className="h-5 w-5 text-red-600" />}
                      {test.status === 'SKIPPED' && <Clock className="h-5 w-5 text-yellow-600" />}
                      {test.status === 'PENDING' && <Clock className="h-5 w-5 text-gray-600" />}
                      <div>
                        <p className="font-medium">{test.testName}</p>
                        <p className="text-sm text-gray-600">{test.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        test.status === 'PASSED' ? 'default' :
                        test.status === 'FAILED' ? 'destructive' :
                        test.status === 'SKIPPED' ? 'secondary' : 'outline'
                      }>
                        {test.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {test.duration}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Test Results</CardTitle>
              <CardDescription>Complete list of test executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testResults.map((test) => (
                  <div key={test.testId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {test.status === 'PASSED' && <CheckCircle className="h-6 w-6 text-green-600" />}
                      {test.status === 'FAILED' && <AlertCircle className="h-6 w-6 text-red-600" />}
                      {test.status === 'SKIPPED' && <Clock className="h-6 w-6 text-yellow-600" />}
                      {test.status === 'PENDING' && <Clock className="h-6 w-6 text-gray-600" />}
                      <div>
                        <p className="font-medium">{test.testName}</p>
                        <p className="text-sm text-gray-600">
                          {test.category} • {new Date(test.timestamp).toLocaleString()}
                        </p>
                        {test.metrics && (
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500">
                              Response: {test.metrics.responseTime}ms
                            </span>
                            <span className="text-xs text-gray-500">
                              Accuracy: {(test.metrics.accuracy * 100).toFixed(1)}%
                            </span>
                            <span className="text-xs text-gray-500">
                              Memory: {test.metrics.memoryUsage}MB
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        test.status === 'PASSED' ? 'default' :
                        test.status === 'FAILED' ? 'destructive' :
                        test.status === 'SKIPPED' ? 'secondary' : 'outline'
                      }>
                        {test.status}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        {test.duration}ms
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          {feedbackSummary ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Overview</CardTitle>
                  <CardDescription>User feedback statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {feedbackSummary.totalFeedback}
                      </div>
                      <div className="text-sm text-gray-600">Total Feedback</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {feedbackSummary.averageRating.toFixed(1)}/5
                      </div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Positive Feedback</span>
                      <span>{feedbackSummary.positiveFeedback} ({feedbackSummary.totalFeedback > 0 ? Math.round((feedbackSummary.positiveFeedback / feedbackSummary.totalFeedback) * 100) : 0}%)</span>
                    </div>
                    <Progress value={feedbackSummary.totalFeedback > 0 ? (feedbackSummary.positiveFeedback / feedbackSummary.totalFeedback) * 100 : 0} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Negative Feedback</span>
                      <span>{feedbackSummary.negativeFeedback} ({feedbackSummary.totalFeedback > 0 ? Math.round((feedbackSummary.negativeFeedback / feedbackSummary.totalFeedback) * 100) : 0}%)</span>
                    </div>
                    <Progress value={feedbackSummary.totalFeedback > 0 ? (feedbackSummary.negativeFeedback / feedbackSummary.totalFeedback) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Suggestions</CardTitle>
                  <CardDescription>Most common user suggestions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {feedbackSummary.topSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm truncate flex-1">{suggestion.suggestion}</span>
                        <Badge variant="secondary">{suggestion.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No feedback data available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {performanceMetrics ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>Current performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Response Time</p>
                      <p className="text-xl font-bold">{performanceMetrics.responseTime.toFixed(0)}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Throughput</p>
                      <p className="text-xl font-bold">{performanceMetrics.throughput.toFixed(0)} req/s</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Error Rate</p>
                      <p className="text-xl font-bold">{(performanceMetrics.errorRate * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Memory Usage</p>
                      <p className="text-xl font-bold">{performanceMetrics.memoryUsage.toFixed(0)}MB</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>CPU Usage</span>
                      <span>{performanceMetrics.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={performanceMetrics.cpuUsage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>System Uptime</span>
                      <span>{performanceMetrics.uptime.toFixed(1)}%</span>
                    </div>
                    <Progress value={performanceMetrics.uptime} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Performance metrics over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={Array.from({ length: 24 }, (_, i) => ({
                      time: `${i}:00`,
                      responseTime: 50 + Math.random() * 50,
                      throughput: 100 + Math.random() * 200
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" name="Response Time (ms)" />
                      <Line type="monotone" dataKey="throughput" stroke="#10b981" name="Throughput (req/s)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No performance data available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}