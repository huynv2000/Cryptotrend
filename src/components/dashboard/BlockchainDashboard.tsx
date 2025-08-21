// Main Blockchain Dashboard Component

'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useBlockchainStore } from '@/store/blockchainStore';
import { useAllBlockchainData, useRealTimeUpdates } from '@/hooks/useBlockchainData';
import { memoryOptimizer, MemoryUtils } from '@/lib/memory-optimizer';
import DashboardHeader from './header/DashboardHeader';
import UsageMetricsSectionWithBaseline from './usage-metrics/UsageMetricsSectionWithBaseline';
import TVLMetricsSectionWithBaseline from './tvl-metrics/TVLMetricsSectionWithBaseline';
import EnhancedTVLMetricsSection from './tvl-metrics/EnhancedTVLMetricsSection';
import TvlComparisonCard from './tvl-metrics/TvlComparisonCard';
import CashFlowSection from './cashflow-metrics/CashFlowSection';
import MarketAnalysisSection from './market-analysis/MarketAnalysisSection';
import TVLHistoryChartOptimized from './tvl-history/TVLHistoryChartOptimized';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import type { BlockchainValue, TimeframeValue } from '@/lib/types';

interface BlockchainDashboardProps {
  initialBlockchain?: BlockchainValue;
  initialTimeframe?: TimeframeValue;
}

export default function BlockchainDashboard({
  initialBlockchain = 'ethereum',
  initialTimeframe = '24h'
}: BlockchainDashboardProps) {
  const { theme, setTheme } = useTheme();
  const store = useBlockchainStore();
  const [mounted, setMounted] = useState(false);
  
  // Initialize store values
  useEffect(() => {
    store.setSelectedBlockchain(initialBlockchain);
    store.setSelectedTimeframe(initialTimeframe);
    setTheme('dark'); // Force dark theme for professional dashboard
    setMounted(true);
    
    // Initialize memory optimization
    memoryOptimizer.startMonitoring();
    
    // Register cleanup for navigation scenario
    memoryOptimizer.registerCleanup('dashboard-navigation', () => {
      memoryOptimizer.optimizeForScenario('navigation');
    });
    
    return () => {
      memoryOptimizer.unregisterCleanup('dashboard-navigation');
    };
  }, [initialBlockchain, initialTimeframe, setTheme]);
  
  // Get current state from store
  const selectedBlockchain = store.selectedBlockchain;
  const selectedTimeframe = store.selectedTimeframe;
  const sidebarOpen = store.sidebarOpen;
  
  // Fetch data using React Query
  const {
    data,
    isLoading,
    isError,
    error,
    refresh,
    isRefreshing
  } = useAllBlockchainData(selectedBlockchain, selectedTimeframe);
  
  // Setup real-time updates
  const {
    connected: wsConnected,
    connect: wsConnect,
    disconnect: wsDisconnect
  } = useRealTimeUpdates({
    blockchain: selectedBlockchain,
    timeframe: selectedTimeframe,
    enabled: mounted,
  });
  
  // Handle blockchain change
  const handleBlockchainChange = (blockchain: BlockchainValue) => {
    store.setSelectedBlockchain(blockchain);
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (timeframe: TimeframeValue) => {
    store.setSelectedTimeframe(timeframe);
  };
  
  // Handle refresh
  const handleRefresh = MemoryUtils.debounce(() => {
    memoryOptimizer.optimizeForScenario('data-load');
    refresh();
  }, 300);
  
  // Handle sidebar toggle
  const handleSidebarToggle = MemoryUtils.throttle(() => {
    store.setSidebarOpen(!sidebarOpen);
  }, 200);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      memoryOptimizer.unregisterCleanup('dashboard-navigation');
      memoryOptimizer.stopMonitoring();
    };
  }, []);
  
  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState text="Initializing dashboard..." />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Dashboard Header */}
      <DashboardHeader
        selectedBlockchain={selectedBlockchain}
        selectedTimeframe={selectedTimeframe}
        onBlockchainChange={handleBlockchainChange}
        onTimeframeChange={handleTimeframeChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        websocketConnected={wsConnected}
        onSidebarToggle={handleSidebarToggle}
        sidebarOpen={sidebarOpen}
      />
      
      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-card border-r border-border min-h-screen">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Navigation</h2>
              <nav className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-md bg-primary text-primary-foreground">
                  Dashboard
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
                  Analytics
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
                  Reports
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
                  Settings
                </button>
              </nav>
            </div>
          </aside>
        )}
        
        {/* Main Dashboard Content */}
        <main className="flex-1">
          {isLoading && !data.usageMetrics ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <LoadingState text="Loading dashboard data..." />
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center">
                <div className="text-red-500 mb-4">Error loading dashboard</div>
                <div className="text-muted-foreground mb-4">
                  {error?.message || 'Failed to load dashboard data'}
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Usage Metrics Section */}
              <UsageMetricsSectionWithBaseline
                blockchain={selectedBlockchain}
                timeframe={selectedTimeframe}
                data={data.usageMetrics}
                isLoading={isLoading}
              />
              
              {/* TVL Metrics Section */}
              <TVLMetricsSectionWithBaseline
                blockchain={selectedBlockchain}
                timeframe={selectedTimeframe}
                data={data.tvlMetrics}
                isLoading={isLoading}
              />
              
              {/* Enhanced TVL Metrics Section */}
              <EnhancedTVLMetricsSection
                blockchain={selectedBlockchain}
                timeframe={selectedTimeframe}
                data={data.enhancedTvlMetrics}
                isLoading={isLoading}
              />
              
              {/* TVL History Chart */}
              <TVLHistoryChartOptimized
                coinId={selectedBlockchain}
                coinName={selectedBlockchain.charAt(0).toUpperCase() + selectedBlockchain.slice(1)}
                timeframe={selectedTimeframe === '24h' ? '24H' : selectedTimeframe === '7d' ? '7D' : selectedTimeframe === '30d' ? '30D' : '90D'}
                height={400}
                showControls={true}
                autoRefresh={true}
              />
              
              {/* TVL Comparison Card */}
              <TvlComparisonCard
                data={data.tvlComparison}
                isLoading={isLoading}
              />
              
              {/* Cash Flow Metrics Section */}
              <CashFlowSection
                blockchain={selectedBlockchain}
                timeframe={selectedTimeframe}
                data={data.cashflowMetrics}
                isLoading={isLoading}
              />
              
              {/* Market Analysis Section */}
              <MarketAnalysisSection
                blockchain={selectedBlockchain}
                marketData={data.marketOverview}
                aiData={data.aiAnalysis}
                isLoading={isLoading}
              />
              
              {/* Status Bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2">
                <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        wsConnected ? 'bg-green-500' : 'bg-red-500'
                      )} />
                      <span>WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div>
                      Blockchain: {selectedBlockchain}
                    </div>
                    <div>
                      Timeframe: {selectedTimeframe}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      Last Updated: {new Date().toLocaleTimeString()}
                    </div>
                    <div>
                      Data Points: {Object.keys(data).reduce((acc, key) => {
                        const sectionData = data[key as keyof typeof data];
                        return acc + (sectionData ? 1 : 0);
                      }, 0)}/6
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}