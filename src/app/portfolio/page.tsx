'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import PortfolioOverview from '@/components/portfolio/PortfolioOverview';
import PortfolioDetail from '@/components/portfolio/PortfolioDetail';
import AddEditPosition from '@/components/portfolio/AddEditPosition';
import PerformanceAnalytics from '@/components/portfolio/PerformanceAnalytics';
import { LoadingState } from '@/components/LoadingState';

export default function PortfolioPage() {
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [selectedCryptoId, setSelectedCryptoId] = useState<string | null>(null);
  const [showAddPosition, setShowAddPosition] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handlePositionSelect = (positionId: string) => {
    setSelectedPositionId(positionId);
    setSelectedCryptoId(null);
    setShowAddPosition(false);
  };

  const handleAddPosition = () => {
    setShowAddPosition(true);
    setSelectedPositionId(null);
    setSelectedCryptoId(null);
  };

  const handlePositionAdded = () => {
    setShowAddPosition(false);
    setRefreshKey(prev => prev + 1); // Force refresh of portfolio data
  };

  const handleCancel = () => {
    setShowAddPosition(false);
    setSelectedPositionId(null);
    setSelectedCryptoId(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Management</h1>
            <p className="text-muted-foreground">
              Manage your cryptocurrency investments and track performance
            </p>
          </div>
          <Button onClick={handleAddPosition} size="lg">
            Add New Position
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Portfolio Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Overview */}
            <PortfolioOverview key={`overview-${refreshKey}`} />

            {/* Tabs for Detail and Analytics */}
            <Tabs defaultValue="detail" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detail">Position Details</TabsTrigger>
                <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="detail" className="space-y-4">
                {selectedPositionId ? (
                  <PortfolioDetail 
                    key={`detail-${selectedPositionId}-${refreshKey}`}
                    positionId={selectedPositionId}
                  />
                ) : selectedCryptoId ? (
                  <PortfolioDetail 
                    key={`detail-${selectedCryptoId}-${refreshKey}`}
                    cryptoId={selectedCryptoId}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Position Details</CardTitle>
                      <CardDescription>Select a position to view detailed information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <div className="text-lg font-medium mb-2">No Position Selected</div>
                        <div className="text-muted-foreground">
                          Click on a position in the overview to see detailed information
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-4">
                <PerformanceAnalytics key={`analytics-${refreshKey}`} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Add/Edit Position */}
          <div className="space-y-6">
            {showAddPosition ? (
              <AddEditPosition
                key={`add-${refreshKey}`}
                onSuccess={handlePositionAdded}
                onCancel={handleCancel}
              />
            ) : selectedPositionId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Position Actions</CardTitle>
                  <CardDescription>Manage your selected position</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowAddPosition(true)}
                  >
                    Edit Position
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                  >
                    Sell Position
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleCancel}
                  >
                    Clear Selection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Portfolio management shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full"
                    onClick={handleAddPosition}
                  >
                    Add New Position
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    Import Portfolio
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    Export Portfolio
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    Portfolio Settings
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Summary</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Positions</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Auto Refresh</span>
                  <Badge variant="outline">Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}