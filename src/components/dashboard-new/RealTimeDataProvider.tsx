'use client';

import { useEffect, useState } from 'react';

interface RealTimeDataProviderProps {
  children: (data: {
    isConnected: boolean;
    lastUpdate: Date;
    data: any;
    error: string | null;
  }) => React.ReactNode;
  selectedBlockchain: string;
}

export function RealTimeDataProvider({ children, selectedBlockchain }: RealTimeDataProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate WebSocket connection
    const connectWebSocket = () => {
      setIsConnected(true);
      setError(null);
      
      // Simulate real-time data updates
      const interval = setInterval(() => {
        setLastUpdate(new Date());
        
        // Generate mock real-time data updates
        const updateData = {
          timestamp: Date.now(),
          blockchain: selectedBlockchain,
          metrics: {
            price: Math.random() * 50000 + 20000, // Random price between 20k-70k
            volume24h: Math.random() * 1000000000 + 500000000, // Random volume
            activeAddresses: Math.floor(Math.random() * 1000000) + 500000, // Random active addresses
            transactions: Math.floor(Math.random() * 500000) + 200000, // Random transactions
            marketCap: Math.random() * 1000000000000 + 500000000000, // Random market cap
          },
          alerts: Math.random() > 0.8 ? [
            {
              id: Date.now().toString(),
              type: 'WARNING',
              title: 'High Volume Detected',
              message: 'Unusual trading volume detected',
              severity: 'MEDIUM',
              timestamp: new Date()
            }
          ] : []
        };
        
        setData(updateData);
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    };

    const cleanup = connectWebSocket();

    return () => {
      setIsConnected(false);
      if (cleanup) cleanup();
    };
  }, [selectedBlockchain]);

  return children({
    isConnected,
    lastUpdate,
    data,
    error
  });
}