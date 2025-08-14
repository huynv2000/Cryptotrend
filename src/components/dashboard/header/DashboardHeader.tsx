// Dashboard Header Component

'use client';

import { Bell, Settings, RefreshCw, Menu, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BlockchainSelector from './BlockchainSelector';
import TimeframeSelector from './TimeframeSelector';
import RealTimeIndicator from './RealTimeIndicator';
import { cn } from '@/lib/utils';
import type { BlockchainValue, TimeframeValue } from '@/lib/types';

interface DashboardHeaderProps {
  selectedBlockchain: BlockchainValue;
  selectedTimeframe: TimeframeValue;
  onBlockchainChange: (blockchain: BlockchainValue) => void;
  onTimeframeChange: (timeframe: TimeframeValue) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  websocketConnected: boolean;
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

export default function DashboardHeader({
  selectedBlockchain,
  selectedTimeframe,
  onBlockchainChange,
  onTimeframeChange,
  onRefresh,
  isRefreshing,
  websocketConnected,
  onSidebarToggle,
  sidebarOpen
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Sidebar Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Blockchain Monitor</h1>
                <p className="text-xs text-muted-foreground">Real-time Analytics Dashboard</p>
              </div>
            </div>
            
            {/* Blockchain Selector */}
            <BlockchainSelector
              value={selectedBlockchain}
              onChange={onBlockchainChange}
            />
            
            {/* Timeframe Selector */}
            <TimeframeSelector
              value={selectedTimeframe}
              onChange={onTimeframeChange}
            />
            
            {/* Real-time Indicator */}
            <RealTimeIndicator connected={websocketConnected} />
          </div>
          
          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* WebSocket Status */}
            <div className="hidden sm:flex items-center space-x-2">
              {websocketConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {websocketConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="hidden sm:flex"
            >
              <RefreshCw className={cn(
                "h-4 w-4 mr-2",
                isRefreshing && "animate-spin"
              )} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            {/* Mobile Refresh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="sm:hidden"
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isRefreshing && "animate-spin"
              )} />
            </Button>
            
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              {/* Notification Badge */}
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                3
              </Badge>
            </div>
            
            {/* Settings */}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">U</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium">User</div>
                <div className="text-xs text-muted-foreground">Admin</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Network: {selectedBlockchain}</span>
              <span>Timeframe: {selectedTimeframe}</span>
              <span className="flex items-center space-x-1">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  websocketConnected ? 'bg-green-500' : 'bg-red-500'
                )} />
                <span>{websocketConnected ? 'Connected' : 'Disconnected'}</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Last Update: {new Date().toLocaleTimeString()}</span>
              <span>Version 2.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}