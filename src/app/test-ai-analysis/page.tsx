'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIAnalysisPanel } from '@/components/dashboard/AIAnalysisPanel';

export default function TestAIAnalysisPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Bitcoin AI Analysis',
        url: '/api/ai-analysis?action=analyze&coinId=bitcoin'
      },
      {
        name: 'Ethereum AI Analysis', 
        url: '/api/ai-analysis?action=analyze&coinId=ethereum'
      },
      {
        name: 'Service Status Check',
        url: '/api/ai-analysis?action=status'
      },
      {
        name: 'Providers Check',
        url: '/api/ai-analysis?action=providers'
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        const response = await fetch(test.url);
        const endTime = Date.now();
        const data = await response.json();

        results.push({
          name: test.name,
          success: response.ok,
          status: response.status,
          responseTime: endTime - startTime,
          data: data,
          error: null
        });
      } catch (error) {
        results.push({
          name: test.name,
          success: false,
          status: 0,
          responseTime: 0,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 AI Analysis Testing Dashboard
          </h1>
          <p className="text-gray-600">
            Test and validate AI analysis functionality for crypto market insights
          </p>
        </div>

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Run comprehensive tests for AI analysis system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                onClick={runTests} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? '⏳ Running Tests...' : '🚀 Run All Tests'}
              </Button>
              <Button 
                onClick={() => setTestResults([])} 
                variant="outline"
              >
                🗑️ Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testResults.map((result, index) => (
                <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{result.name}</CardTitle>
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {result.success ? '✅ Success' : '❌ Failed'}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Status: {result.status} | Response: {result.responseTime}ms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.error ? (
                      <div className="text-sm text-red-600">
                        <strong>Error:</strong> {result.error}
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div className="mb-2">
                          <strong>Response:</strong>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Live AI Analysis Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bitcoin AI Analysis</h2>
            <AIAnalysisPanel coinId="bitcoin" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ethereum AI Analysis</h2>
            <AIAnalysisPanel coinId="ethereum" />
          </div>
        </div>

        {/* System Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📋 System Information</CardTitle>
            <CardDescription>
              AI Analysis System Configuration and Capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🤖 AI Providers</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Z.AI:</strong> Primary AI analysis engine</li>
                  <li>• <strong>ChatGPT:</strong> Secondary analysis provider</li>
                  <li>• <strong>Consensus System:</strong> Multi-AI result aggregation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📊 Analysis Types</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Comprehensive:</strong> Full market analysis</li>
                  <li>• <strong>Breakout:</strong> Breakout potential detection</li>
                  <li>• <strong>Risk:</strong> Risk assessment</li>
                  <li>• <strong>Quick:</strong> Rapid analysis</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Key Features</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Real-time market data integration</li>
                  <li>• Multi-provider consensus scoring</li>
                  <li>• Dynamic risk assessment</li>
                  <li>• Actionable recommendations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">⚡ Performance</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Response time: &lt; 30 seconds</li>
                  <li>• Retry mechanism: 3 attempts</li>
                  <li>• Fallback systems: Available</li>
                  <li>• Error handling: Comprehensive</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}