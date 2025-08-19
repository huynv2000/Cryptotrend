// Real-time Indicator Component

'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RealTimeIndicatorProps {
  connected: boolean;
}

export default function RealTimeIndicator({ connected }: RealTimeIndicatorProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [pulse, setPulse] = useState(false);
  
  // Simulate real-time updates
  useEffect(() => {
    if (!connected) return;
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [connected]);
  
  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return 'just now';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h ago`;
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        <div className={cn(
          "relative",
          connected && "animate-pulse"
        )}>
          {connected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </div>
        <span className={cn(
          "text-xs font-medium",
          connected ? "text-green-500" : "text-red-500"
        )}>
          {connected ? "Live" : "Offline"}
        </span>
      </div>
      
      {/* Activity Indicator */}
      {connected && (
        <div className="flex items-center space-x-1">
          <div className={cn(
            "relative",
            pulse && "animate-pulse"
          )}>
            <Activity className="h-3 w-3 text-blue-500" />
          </div>
          <Zap className={cn(
            "h-3 w-3 text-yellow-500",
            pulse && "animate-pulse"
          )} />
        </div>
      )}
      
      {/* Update Status */}
      <div className="hidden sm:flex items-center space-x-2">
        <span className="text-xs text-muted-foreground">
          Updated: {formatRelativeTime(lastUpdate)}
        </span>
        {connected && (
          <Badge variant="outline" className="text-xs">
            Real-time
          </Badge>
        )}
      </div>
    </div>
  );
}