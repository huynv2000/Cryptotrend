'use client';

import { useState } from 'react';
import PortfolioOverview from '@/components/portfolio/PortfolioOverview';
import AddEditPosition from '@/components/portfolio/AddEditPosition';
import PerformanceAnalytics from '@/components/portfolio/PerformanceAnalytics';

export default function TestPortfolioPage() {
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePositionAdded = () => {
    setShowAddPosition(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Portfolio Management Test</h1>
        <p className="text-muted-foreground">Testing portfolio components functionality</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Overview */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Portfolio Overview</h2>
            <PortfolioOverview key={`overview-${refreshKey}`} />
          </div>

          {/* Add Position Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Add New Position</h2>
            <AddEditPosition
              onSuccess={handlePositionAdded}
              onCancel={() => setShowAddPosition(false)}
            />
          </div>
        </div>

        {/* Performance Analytics */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Performance Analytics</h2>
          <PerformanceAnalytics key={`analytics-${refreshKey}`} />
        </div>

        {/* Test Controls */}
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="space-y-4">
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Refresh Portfolio Data
            </button>
            <button
              onClick={() => setShowAddPosition(true)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md ml-4"
            >
              Show Add Position Form
            </button>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>• Test adding new positions with different cryptocurrencies</p>
            <p>• Verify portfolio overview updates correctly</p>
            <p>• Check performance analytics calculations</p>
            <p>• Test form validation and error handling</p>
          </div>
        </div>
      </div>
    </div>
  );
}