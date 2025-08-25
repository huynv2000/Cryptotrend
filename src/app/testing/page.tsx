/**
 * Testing Integration Page
 * Phase 2.8 - Testing & User Feedback
 * 
 * Demonstration page for AI personalization testing framework
 * showing testing dashboard, user feedback collection, and system monitoring
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TestingDashboard } from '@/components/testing/TestingDashboard';
import { UserFeedbackCollector, QuickFeedbackButton } from '@/components/testing/UserFeedbackCollector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  MessageSquare, 
  BarChart3, 
  Users, 
  Settings, 
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function TestingPage() {
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showFeedbackCollector, setShowFeedbackCollector] = useState(false);
  const [autoShowFeedback, setAutoShowFeedback] = useState(true);

  // Simulate running tests
  const runTests = async () => {
    setIsTesting(true);
    setTestResults([]);

    try {
      const response = await fetch('/api/testing/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testTypes: ['unit', 'integration', 'performance'],
          iterations: 1,
          timeout: 30000,
          generateReport: true,
          collectUserFeedback: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(data.results || []);
      }
    } catch (error) {
      console.error('Failed to run tests:', error);
    } finally {
      setIsTesting(false);
    }
  };

  // Test status summary
  const testSummary = React.useMemo(() => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'PASSED').length;
    const failed = testResults.filter(r => r.status === 'FAILED').length;
    const skipped = testResults.filter(r => r.status === 'SKIPPED').length;
    const pending = testResults.filter(r => r.status === 'PENDING').length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, skipped, pending, successRate };
  }, [testResults]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Personalization Testing Framework
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Phase 2.8 - Testing & User Feedback Integration
          </p>
        </div>

        {/* User Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Testing Session</h3>
                <p className="text-sm text-blue-700">
                  User ID: {userId} | Session ID: {sessionId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Active Session
                </Badge>
                <Button
                  onClick={() => setAutoShowFeedback(!autoShowFeedback)}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Auto Feedback: {autoShowFeedback ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Demo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <TestingDashboard 
              userId={userId}
              autoRefresh={true}
              refreshInterval={30000}
            />
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            {/* Test Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Test Controls</CardTitle>
                <CardDescription>
                  Run AI personalization tests and monitor results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={runTests}
                    disabled={isTesting}
                    className="flex items-center gap-2"
                  >
                    {isTesting ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run All Tests
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setTestResults([])}
                    variant="outline"
                    disabled={testResults.length === 0}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Results
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Results Summary */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Results Summary</CardTitle>
                  <CardDescription>
                    Overview of the latest test execution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{testSummary.total}</div>
                      <div className="text-sm text-gray-600">Total Tests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{testSummary.passed}</div>
                      <div className="text-sm text-gray-600">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{testSummary.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{testSummary.skipped}</div>
                      <div className="text-sm text-gray-600">Skipped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{testSummary.successRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                  </div>

                  {/* Recent Test Results */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Test Results</h4>
                    {testResults.slice(0, 5).map((test) => (
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
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Feedback Collection</CardTitle>
                <CardDescription>
                  Test the user feedback collection system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setShowFeedbackCollector(!showFeedbackCollector)}
                      variant={showFeedbackCollector ? "default" : "outline"}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {showFeedbackCollector ? 'Hide' : 'Show'} Feedback Collector
                    </Button>
                    <Badge variant={autoShowFeedback ? "default" : "secondary"}>
                      Auto Show: {autoShowFeedback ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  {showFeedbackCollector && (
                    <div className="mt-6">
                      <UserFeedbackCollector
                        userId={userId}
                        sessionId={sessionId}
                        testId="demo_test"
                        context={{
                          page: 'testing',
                          section: 'feedback-demo',
                          deviceType: 'web',
                          experienceLevel: 'beginner'
                        }}
                        autoShow={autoShowFeedback}
                        showDelay={5000} // 5 seconds for demo
                        onFeedbackSubmit={(feedback) => {
                          console.log('Feedback submitted:', feedback);
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Feedback Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Feedback Demo</CardTitle>
                <CardDescription>
                  Test the quick feedback button component
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  The quick feedback button appears in the bottom-right corner of the screen.
                  Try clicking it to test the quick feedback functionality.
                </p>
                <QuickFeedbackButton
                  userId={userId}
                  sessionId={sessionId}
                  context={{
                    page: 'testing',
                    section: 'quick-feedback-demo',
                    deviceType: 'web',
                    experienceLevel: 'beginner'
                  }}
                  onFeedbackSubmit={(feedback) => {
                    console.log('Quick feedback submitted:', feedback);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Demo Integration</CardTitle>
                <CardDescription>
                  See how the testing framework integrates with the main dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Testing Features</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Automated test execution</li>
                        <li>• Real-time performance monitoring</li>
                        <li>• User feedback collection</li>
                        <li>• A/B testing framework</li>
                        <li>• Comprehensive analytics</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Integration Points</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• AI personalization hooks</li>
                        <li>• Dashboard components</li>
                        <li>• API endpoints</li>
                        <li>• Database operations</li>
                        <li>• Real-time monitoring</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Demo Instructions</h4>
                    <ol className="text-sm space-y-1 text-blue-800">
                      <li>1. Navigate to the Dashboard tab to see live testing metrics</li>
                      <li>2. Go to the Testing tab to run automated tests</li>
                      <li>3. Visit the Feedback tab to test user feedback collection</li>
                      <li>4. Monitor real-time performance and user satisfaction</li>
                      <li>5. Check the testing dashboard for comprehensive analytics</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Demo Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Session Statistics</CardTitle>
                <CardDescription>
                  Current testing session metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{testSummary.total}</div>
                    <div className="text-sm text-gray-600">Tests Run</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{testSummary.successRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{autoShowFeedback ? 'Auto' : 'Manual'}</div>
                    <div className="text-sm text-gray-600">Feedback Mode</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{showFeedbackCollector ? 'Active' : 'Inactive'}</div>
                    <div className="text-sm text-gray-600">Feedback UI</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}