'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Download, 
  BarChart3, 
  Database, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Play,
  Pause,
  Activity,
  Package
} from 'lucide-react';

// Lazy load heavy components
const HeavyChartComponent = React.lazy(() => import('@/components/lazy/HeavyChartComponent'));
const AdvancedDataTable = React.lazy(() => import('@/components/lazy/AdvancedDataTable'));

// Mock data for demonstration
const mockChartData = Array.from({ length: 50 }, (_, i) => ({
  value: Math.random() * 100 + 50,
  prevValue: Math.random() * 100 + 50,
  index: i
}));

const mockTableData = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
  value: Math.floor(Math.random() * 1000),
  active: Math.random() > 0.5,
  date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
}));

const tableColumns = [
  { key: 'id', label: 'ID', type: 'number' as const, sortable: true },
  { key: 'name', label: 'Name', type: 'string' as const, sortable: true, filterable: true },
  { key: 'category', label: 'Category', type: 'string' as const, sortable: true, filterable: true },
  { key: 'value', label: 'Value', type: 'number' as const, sortable: true },
  { key: 'active', label: 'Active', type: 'boolean' as const, sortable: true },
  { key: 'date', label: 'Date', type: 'date' as const, sortable: true }
];

interface ChunkStatus {
  name: string;
  size: number;
  loaded: boolean;
  loading: boolean;
  loadTime: number;
  error: string | null;
}

export default function CodeSplittingDashboard() {
  const [chunkStatuses, setChunkStatuses] = useState<ChunkStatus[]>([
    { name: 'HeavyChartComponent', size: 150, loaded: false, loading: false, loadTime: 0, error: null },
    { name: 'AdvancedDataTable', size: 200, loaded: false, loading: false, loadTime: 0, error: null }
  ]);
  const [isPreloading, setIsPreloading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadChunk = async (chunkName: string) => {
    setChunkStatuses(prev => 
      prev.map(chunk => 
        chunk.name === chunkName 
          ? { ...chunk, loading: true, error: null }
          : chunk
      )
    );

    const startTime = performance.now();
    
    try {
      // Simulate loading the chunk
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const loadTime = performance.now() - startTime;
      
      setChunkStatuses(prev => 
        prev.map(chunk => 
          chunk.name === chunkName 
            ? { ...chunk, loaded: true, loading: false, loadTime }
            : chunk
        )
      );
    } catch (error) {
      setChunkStatuses(prev => 
        prev.map(chunk => 
          chunk.name === chunkName 
            ? { ...chunk, loading: false, error: error instanceof Error ? error.message : 'Unknown error' }
            : chunk
        )
      );
    }
  };

  const preloadAllChunks = async () => {
    setIsPreloading(true);
    
    const promises = chunkStatuses
      .filter(chunk => !chunk.loaded && !chunk.loading)
      .map(chunk => loadChunk(chunk.name));
    
    await Promise.all(promises);
    setIsPreloading(false);
  };

  const resetChunks = () => {
    setChunkStatuses(prev => 
      prev.map(chunk => ({
        ...chunk,
        loaded: false,
        loading: false,
        loadTime: 0,
        error: null
      }))
    );
  };

  const totalSize = chunkStatuses.reduce((sum, chunk) => sum + chunk.size, 0);
  const loadedSize = chunkStatuses.reduce((sum, chunk) => sum + (chunk.loaded ? chunk.size : 0), 0);
  const loadProgress = totalSize > 0 ? (loadedSize / totalSize) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Code Splitting Dashboard
          </h2>
          <p className="text-muted-foreground">
            Dynamic imports and lazy loading optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetChunks} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={preloadAllChunks} disabled={isPreloading}>
            <Download className="h-4 w-4 mr-2" />
            {isPreloading ? 'Preloading...' : 'Preload All'}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chunkStatuses.length}</div>
            <p className="text-xs text-muted-foreground">
              {chunkStatuses.filter(c => c.loaded).length} loaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSize}KB</div>
            <p className="text-xs text-muted-foreground">
              {loadedSize}KB loaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Load Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadProgress.toFixed(1)}%</div>
            <Progress value={loadProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chunkStatuses.filter(c => c.loaded).length > 0
                ? (chunkStatuses.reduce((sum, c) => sum + c.loadTime, 0) / chunkStatuses.filter(c => c.loaded).length).toFixed(0)
                : '0'
              }ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average load time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chunk Status */}
      <Card>
        <CardHeader>
          <CardTitle>Chunk Status</CardTitle>
          <CardDescription>
            Status of lazy-loaded components and their loading state
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chunkStatuses.map((chunk) => (
              <div key={chunk.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {chunk.loaded ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : chunk.loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                    ) : chunk.error ? (
                      <XCircle className="h-6 w-6 text-red-500" />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{chunk.name}</h3>
                    <p className="text-sm text-muted-foreground">{chunk.size}KB</p>
                    {chunk.error && (
                      <p className="text-sm text-red-500">{chunk.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {chunk.loadTime > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {chunk.loadTime.toFixed(0)}ms
                    </span>
                  )}
                  <Button
                    onClick={() => loadChunk(chunk.name)}
                    disabled={chunk.loading || chunk.loaded}
                    variant="outline"
                    size="sm"
                  >
                    {chunk.loaded ? 'Loaded' : chunk.loading ? 'Loading...' : 'Load'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Components */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chart-demo">Chart Demo</TabsTrigger>
          <TabsTrigger value="table-demo">Table Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Splitting Benefits</CardTitle>
              <CardDescription>
                How code splitting improves your application performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Performance Benefits</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Reduced initial bundle size
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Faster initial page load
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Better caching efficiency
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Improved user experience
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Technical Features</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Dynamic imports with React.lazy
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Suspense boundaries with fallbacks
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Preloading strategies
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Error boundaries and retry logic
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart-demo" className="space-y-4">
          <React.Suspense fallback={
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading heavy chart component...</p>
                </div>
              </CardContent>
            </Card>
          }>
            <HeavyChartComponent
              data={mockChartData}
              title="Heavy Chart Component"
              description="This component is loaded on-demand using code splitting"
            />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="table-demo" className="space-y-4">
          <React.Suspense fallback={
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading advanced data table...</p>
                </div>
              </CardContent>
            </Card>
          }>
            <AdvancedDataTable
              data={mockTableData}
              columns={tableColumns}
              title="Advanced Data Table"
              description="This table component is loaded on-demand using code splitting"
            />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}