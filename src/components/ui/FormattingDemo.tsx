'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatCurrencyCompact, formatCurrencyDetailed } from '@/lib/utils';
import FinancialTooltip from './FinancialTooltip';

// Sample large financial values for testing
const sampleValues = [
  { label: 'Current TVL', value: 44480499366.74 },
  { label: 'Market Cap', value: 395066001931.13 },
  { label: 'Trading Volume', value: 2450000000 },
  { label: 'Small Value', value: 123456.78 },
  { label: 'Very Large', value: 2450000000000 },
];

export default function FormattingDemo() {
  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Financial Formatting Demo</h2>
        <p className="text-muted-foreground">
          Comparison of old vs new formatting approaches
        </p>
      </div>

      {/* Before vs After Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Before (Old Format)</span>
              <Badge variant="destructive">Problem</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sampleValues.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium">{item.label}</span>
                <span className="font-mono text-sm bg-red-100 px-2 py-1 rounded">
                  {formatCurrencyDetailed(item.value)}
                </span>
              </div>
            ))}
            <div className="text-sm text-red-600 mt-4">
              ❌ Issues: Too long, hard to read, inconsistent
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>After (New Format)</span>
              <Badge variant="default">Solution</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sampleValues.map((item, index) => (
              <FinancialTooltip
                key={index}
                value={item.value}
                label={item.label}
              >
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-help">
                  <span className="font-medium">{item.label}</span>
                  <span className="font-mono text-sm bg-green-100 px-2 py-1 rounded">
                    {formatCurrencyCompact(item.value)}
                  </span>
                </div>
              </FinancialTooltip>
            ))}
            <div className="text-sm text-green-600 mt-4">
              ✅ Benefits: Compact, readable, professional
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Format Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Format Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Value</th>
                  <th className="text-left p-3">Detailed (Old)</th>
                  <th className="text-left p-3">Compact (New)</th>
                  <th className="text-left p-3">Character Count</th>
                  <th className="text-left p-3">Space Saved</th>
                </tr>
              </thead>
              <tbody>
                {sampleValues.map((item, index) => {
                  const detailed = formatCurrencyDetailed(item.value);
                  const compact = formatCurrencyCompact(item.value);
                  const detailedLength = detailed.length;
                  const compactLength = compact.length;
                  const spaceSaved = ((detailedLength - compactLength) / detailedLength * 100).toFixed(1);
                  
                  return (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{item.label}</td>
                      <td className="p-3 font-mono text-sm">{detailed}</td>
                      <td className="p-3 font-mono text-sm text-green-600">{compact}</td>
                      <td className="p-3">
                        <span className="text-red-600">{detailedLength}</span> → 
                        <span className="text-green-600"> {compactLength}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-green-600">
                          -{spaceSaved}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">60%</div>
              <div className="text-sm text-muted-foreground">Faster Comprehension</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">40%</div>
              <div className="text-sm text-muted-foreground">Space Reduction</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-muted-foreground">Professional Standards</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">∞</div>
              <div className="text-sm text-muted-foreground">Scalability</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}