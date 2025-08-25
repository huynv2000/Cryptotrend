// Hook for real-time updates via WebSocket

import { useEffect, useRef, useCallback } from 'react';
import { useBlockchainStore } from '@/store/blockchainStore';
import { useQueryClient } from '@tanstack/react-query';
import { blockchainKeys } from './useBlockchainData';
import io, { Socket } from 'socket.io-client';
import type { BlockchainValue, TimeframeValue } from '@/lib/types';

interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

interface UseRealTimeUpdatesProps {
  blockchain: BlockchainValue;
  timeframe: TimeframeValue;
  enabled?: boolean;
  events?: string[];
}

export function useRealTimeUpdates({
  blockchain,
  timeframe,
  enabled = true,
  events = [
    'usage-metrics-update',
    'cashflow-metrics-update',
    'market-overview-update',
    'ai-analysis-update',
    'spike-alert'
  ]
}: UseRealTimeUpdatesProps) {
  const socketRef = useRef<Socket | null>(null);
  const store = useBlockchainStore();
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const defaultOptions: WebSocketOptions = {
    url: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  };
  
  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) return;
    
    try {
      socketRef.current = io(defaultOptions.url!, {
        autoConnect: defaultOptions.autoConnect,
        reconnection: defaultOptions.reconnection,
        reconnectionAttempts: defaultOptions.reconnectionAttempts,
        reconnectionDelay: defaultOptions.reconnectionDelay,
        timeout: defaultOptions.timeout,
      });
      
      setupEventHandlers();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      handleConnectionError(error as Error);
    }
  }, [enabled, defaultOptions]);
  
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    store.setWebsocketStatus({
      connected: false,
      reconnectAttempts: 0,
      lastConnected: null,
      lastMessage: null,
    });
  }, [store]);
  
  const setupEventHandlers = useCallback(() => {
    if (!socketRef.current) return;
    
    const socket = socketRef.current;
    
    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      reconnectAttempts.current = 0;
      
      store.setWebsocketStatus({
        connected: true,
        reconnectAttempts: 0,
        lastConnected: new Date(),
        lastMessage: store.websocketStatus.lastMessage,
      });
      
      // Subscribe to updates
      subscribe();
    });
    
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      
      store.setWebsocketStatus({
        connected: false,
        reconnectAttempts: reconnectAttempts.current,
        lastConnected: store.websocketStatus.lastConnected,
        lastMessage: new Date(),
      });
      
      handleDisconnection(reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      handleConnectionError(error);
    });
    
    // Data update events
    socket.on('usage-metrics-update', (data) => {
      handleUsageMetricsUpdate(data);
    });
    
    socket.on('cashflow-metrics-update', (data) => {
      handleCashflowMetricsUpdate(data);
    });
    
    socket.on('market-overview-update', (data) => {
      handleMarketOverviewUpdate(data);
    });
    
    socket.on('ai-analysis-update', (data) => {
      handleAIAnalysisUpdate(data);
    });
    
    // Alert events
    socket.on('spike-alert', (data) => {
      handleSpikeAlert(data);
    });
    
    // Error events
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      store.addNotification({
        type: 'error',
        title: 'WebSocket Error',
        message: 'A WebSocket error occurred',
        read: false,
      });
    });
    
    // Pong event for connection health
    socket.on('pong', () => {
      store.setWebsocketStatus({
        ...store.websocketStatus,
        lastMessage: new Date(),
      });
    });
    
  }, [store, blockchain, timeframe]);
  
  const subscribe = useCallback(() => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('subscribe', {
      blockchain,
      events,
    });
    
    console.log(`Subscribed to updates for ${blockchain}:`, events);
  }, [blockchain, events]);
  
  const unsubscribe = useCallback(() => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('unsubscribe', {
      blockchain,
      events,
    });
    
    console.log(`Unsubscribed from updates for ${blockchain}:`, events);
  }, [blockchain, events]);
  
  const handleDisconnection = useCallback((reason: string) => {
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, try to reconnect
      attemptReconnect();
    }
  }, []);
  
  const handleConnectionError = useCallback((error: Error) => {
    console.error('Connection error:', error);
    attemptReconnect();
  }, []);
  
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      store.addNotification({
        type: 'error',
        title: 'Connection Lost',
        message: 'Unable to reconnect to real-time updates',
        read: false,
      });
      return;
    }
    
    reconnectAttempts.current++;
    console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
    
    const delay = defaultOptions.reconnectionDelay! * reconnectAttempts.current;
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, store, defaultOptions.reconnectionDelay]);
  
  const handleUsageMetricsUpdate = useCallback((data: any) => {
    try {
      // Update React Query cache
      queryClient.setQueryData(
        blockchainKeys.usageMetrics(blockchain, timeframe),
        data
      );
      
      // Update Zustand store
      store.setUsageMetrics(data);
      
      // Update last message timestamp
      store.setWebsocketStatus({
        ...store.websocketStatus,
        lastMessage: new Date(),
      });
      
    } catch (error) {
      console.error('Error handling usage metrics update:', error);
    }
  }, [queryClient, store, blockchain, timeframe]);
  
  const handleCashflowMetricsUpdate = useCallback((data: any) => {
    try {
      // Update React Query cache
      queryClient.setQueryData(
        blockchainKeys.cashflowMetrics(blockchain, timeframe),
        data
      );
      
      // Update Zustand store
      store.setCashflowMetrics(data);
      
      // Update last message timestamp
      store.setWebsocketStatus({
        ...store.websocketStatus,
        lastMessage: new Date(),
      });
      
    } catch (error) {
      console.error('Error handling cashflow metrics update:', error);
    }
  }, [queryClient, store, blockchain, timeframe]);
  
  const handleMarketOverviewUpdate = useCallback((data: any) => {
    try {
      // Update React Query cache
      queryClient.setQueryData(
        blockchainKeys.marketOverview(blockchain),
        data
      );
      
      // Update Zustand store
      store.setMarketOverview(data);
      
      // Update last message timestamp
      store.setWebsocketStatus({
        ...store.websocketStatus,
        lastMessage: new Date(),
      });
      
    } catch (error) {
      console.error('Error handling market overview update:', error);
    }
  }, [queryClient, store, blockchain]);
  
  const handleAIAnalysisUpdate = useCallback((data: any) => {
    try {
      // Update React Query cache
      queryClient.setQueryData(
        blockchainKeys.aiAnalysis(blockchain),
        data
      );
      
      // Update Zustand store
      store.setAIAnalysis(data);
      
      // Update last message timestamp
      store.setWebsocketStatus({
        ...store.websocketStatus,
        lastMessage: new Date(),
      });
      
    } catch (error) {
      console.error('Error handling AI analysis update:', error);
    }
  }, [queryClient, store, blockchain]);
  
  const handleSpikeAlert = useCallback((data: any) => {
    try {
      console.log('Spike alert received:', data);
      
      // Add notification for spike alert
      store.addNotification({
        type: 'warning',
        title: 'Spike Alert',
        message: data.message || 'Anomaly detected in blockchain metrics',
        read: false,
        actions: [
          {
            label: 'View Details',
            action: () => {
              // Navigate to detailed view or show modal
              console.log('Show spike details:', data);
            },
            primary: true,
          },
        ],
      });
      
      // Update last message timestamp
      store.setWebsocketStatus({
        ...store.websocketStatus,
        lastMessage: new Date(),
      });
      
    } catch (error) {
      console.error('Error handling spike alert:', error);
    }
  }, [store]);
  
  const ping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    }
  }, []);
  
  // Connection health check
  useEffect(() => {
    if (!enabled) return;
    
    const healthCheckInterval = setInterval(() => {
      if (socketRef.current?.connected) {
        ping();
      } else {
        connect();
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [enabled, connect, ping]);
  
  // Main connection effect
  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }
    
    connect();
    
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);
  
  // Re-subscribe when blockchain or events change
  useEffect(() => {
    if (!enabled || !socketRef.current?.connected) return;
    
    unsubscribe();
    subscribe();
    
    return () => {
      unsubscribe();
    };
  }, [blockchain, timeframe, events, enabled, subscribe, unsubscribe]);
  
  return {
    connected: store.websocketStatus.connected,
    reconnectAttempts: store.websocketStatus.reconnectAttempts,
    lastConnected: store.websocketStatus.lastConnected,
    lastMessage: store.websocketStatus.lastMessage,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    ping,
  };
}

// Hook for connection status
export function useWebSocketStatus() {
  const status = useBlockchainStore(state => state.websocketStatus);
  
  return {
    ...status,
    isConnected: status.connected,
    isReconnecting: status.reconnectAttempts > 0 && !status.connected,
    connectionAge: status.lastConnected 
      ? Date.now() - status.lastConnected.getTime() 
      : 0,
    lastMessageAge: status.lastMessage 
      ? Date.now() - status.lastMessage.getTime() 
      : 0,
  };
}

// Hook for manual event subscription
export function useEventSubscription(event: string, callback: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');
    }
    
    const socket = socketRef.current;
    
    socket.on(event, callback);
    
    return () => {
      socket.off(event, callback);
    };
  }, [event, callback]);
  
  return {
    emit: (data: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
      }
    },
  };
}

// Hook for broadcasting events
export function useEventBroadcast() {
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');
    }
  }, []);
  
  const broadcast = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot broadcast: WebSocket not connected');
    }
  }, []);
  
  return { broadcast };
}

// Hook for connection management
export function useWebSocketManager() {
  const store = useBlockchainStore();
  const connectionsRef = useRef<Map<string, Socket>>(new Map());
  
  const createConnection = useCallback((key: string, options: WebSocketOptions = {}) => {
    if (connectionsRef.current.has(key)) {
      return connectionsRef.current.get(key)!;
    }
    
    const socket = io(options.url || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      autoConnect: options.autoConnect ?? true,
      reconnection: options.reconnection ?? true,
      reconnectionAttempts: options.reconnectionAttempts ?? 5,
      reconnectionDelay: options.reconnectionDelay ?? 1000,
      timeout: options.timeout ?? 10000,
    });
    
    connectionsRef.current.set(key, socket);
    
    return socket;
  }, []);
  
  const getConnection = useCallback((key: string) => {
    return connectionsRef.current.get(key);
  }, []);
  
  const removeConnection = useCallback((key: string) => {
    const socket = connectionsRef.current.get(key);
    if (socket) {
      socket.disconnect();
      connectionsRef.current.delete(key);
    }
  }, []);
  
  const removeAllConnections = useCallback(() => {
    connectionsRef.current.forEach((socket) => {
      socket.disconnect();
    });
    connectionsRef.current.clear();
  }, []);
  
  return {
    createConnection,
    getConnection,
    removeConnection,
    removeAllConnections,
    connectionCount: connectionsRef.current.size,
  };
}

export default useRealTimeUpdates;