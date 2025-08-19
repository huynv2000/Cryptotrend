'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Settings, RefreshCw, User, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  selectedBlockchain: string;
  onBlockchainChange: (blockchain: string) => void;
  lastUpdate: Date;
  onRefresh: () => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export function Header({
  selectedBlockchain,
  onBlockchainChange,
  lastUpdate,
  onRefresh,
  theme,
  onThemeChange
}: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const blockchains = [
    { value: 'bitcoin', label: 'Bitcoin', icon: '₿' },
    { value: 'ethereum', label: 'Ethereum', icon: 'Ξ' },
    { value: 'solana', label: 'Solana', icon: '◎' },
    { value: 'binance-smart-chain', label: 'BSC', icon: '🟡' },
    { value: 'polygon', label: 'Polygon', icon: '⬟' },
    { value: 'avalanche', label: 'Avalanche', icon: '🔺' }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BC</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Blockchain Monitoring Dashboard
            </h1>
          </div>
        </div>

        {/* Blockchain Selector */}
        <div className="flex items-center space-x-4">
          <Select value={selectedBlockchain} onValueChange={onBlockchainChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select blockchain" />
            </SelectTrigger>
            <SelectContent>
              {blockchains.map((blockchain) => (
                <SelectItem key={blockchain.value} value={blockchain.value}>
                  <div className="flex items-center space-x-2">
                    <span>{blockchain.icon}</span>
                    <span>{blockchain.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Last Update */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Last update:</span>
            <Badge variant="outline" className="text-xs">
              {formatLastUpdate(lastUpdate)}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>

            {/* Notifications */}
            <Button variant="outline" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 text-xs">3</Badge>
            </Button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="User" />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@blockchain.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Help</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}