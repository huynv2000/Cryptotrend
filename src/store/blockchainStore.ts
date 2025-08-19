// Blockchain Store for State Management

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  UsageMetrics, 
  TVLMetrics,
  CashflowMetrics, 
  MarketOverview, 
  AIAnalysis,
  BlockchainValue,
  TimeframeValue,
  UIState,
  Notification,
  WebSocketStatus
} from '@/lib/types';
import { utils } from '@/lib/utils';

interface BlockchainState extends UIState {
  // Data State
  usageMetrics: UsageMetrics | null;
  tvlMetrics: TVLMetrics | null;
  enhancedTvlMetrics: any | null;
  cashflowMetrics: CashflowMetrics | null;
  marketOverview: MarketOverview | null;
  aiAnalysis: AIAnalysis | null;
  historicalData: Record<string, any[]>;
  
  // WebSocket State
  websocketStatus: WebSocketStatus;
  
  // Actions
  // Data Actions
  setUsageMetrics: (metrics: UsageMetrics | null) => void;
  setTVLMetrics: (metrics: TVLMetrics | null) => void;
  setEnhancedTVLMetrics: (metrics: any | null) => void;
  setCashflowMetrics: (metrics: CashflowMetrics | null) => void;
  setMarketOverview: (overview: MarketOverview | null) => void;
  setAIAnalysis: (analysis: AIAnalysis | null) => void;
  setHistoricalData: (key: string, data: any[]) => void;
  
  // UI Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedBlockchain: (blockchain: BlockchainValue) => void;
  setSelectedTimeframe: (timeframe: TimeframeValue) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // WebSocket Actions
  setWebsocketStatus: (status: Partial<WebSocketStatus>) => void;
  
  // Data Fetching Actions
  fetchUsageMetrics: (blockchain: BlockchainValue, timeframe: TimeframeValue) => Promise<void>;
  fetchCashflowMetrics: (blockchain: BlockchainValue, timeframe: TimeframeValue) => Promise<void>;
  fetchMarketOverview: (blockchain: BlockchainValue) => Promise<void>;
  fetchAIAnalysis: (blockchain: BlockchainValue) => Promise<void>;
  fetchHistoricalData: (blockchain: BlockchainValue, metric: string, timeframe: TimeframeValue) => Promise<void>;
  
  // Bulk Actions
  fetchAllData: (blockchain: BlockchainValue, timeframe: TimeframeValue) => Promise<void>;
  refreshData: () => Promise<void>;
  clearData: () => void;
  
  // Utility Actions
  updateMetricValue: (metricType: string, metricKey: string, value: any) => void;
  getMetricValue: (metricType: string, metricKey: string) => any;
}

export const useBlockchainStore = create<BlockchainState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        theme: 'dark',
        sidebarOpen: true,
        selectedBlockchain: 'bitcoin',
        selectedTimeframe: '24h',
        loading: false,
        error: null,
        notifications: [],
        
        // Data State
        usageMetrics: null,
        tvlMetrics: null,
        enhancedTvlMetrics: null,
        cashflowMetrics: null,
        marketOverview: null,
        aiAnalysis: null,
        historicalData: {},
        
        // WebSocket State
        websocketStatus: {
          connected: false,
          reconnectAttempts: 0,
          lastConnected: null,
          lastMessage: null,
        },
        
        // Data Actions
        setUsageMetrics: (metrics) => {
          set({ usageMetrics: metrics, error: null });
        },
        
        setCashflowMetrics: (metrics) => {
          set({ cashflowMetrics: metrics, error: null });
        },
        
        setTVLMetrics: (metrics) => {
          set({ tvlMetrics: metrics, error: null });
        },
        
        setEnhancedTVLMetrics: (metrics) => {
          set({ enhancedTvlMetrics: metrics, error: null });
        },
        
        setMarketOverview: (overview) => {
          set({ marketOverview: overview, error: null });
        },
        
        setAIAnalysis: (analysis) => {
          set({ aiAnalysis: analysis, error: null });
        },
        
        setHistoricalData: (key, data) => {
          set((state) => ({
            historicalData: {
              ...state.historicalData,
              [key]: data,
            },
          }));
        },
        
        // UI Actions
        setTheme: (theme) => {
          set({ theme });
          // Apply theme to document
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', theme === 'dark');
          }
        },
        
        setSidebarOpen: (open) => {
          set({ sidebarOpen: open });
        },
        
        setSelectedBlockchain: (blockchain) => {
          set({ selectedBlockchain: blockchain });
        },
        
        setSelectedTimeframe: (timeframe) => {
          set({ selectedTimeframe: timeframe });
        },
        
        setLoading: (loading) => {
          set({ loading });
        },
        
        setError: (error) => {
          set({ error, loading: false });
        },
        
        // Notification Actions
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: utils.generateUUID(),
            timestamp: new Date(),
            read: false,
          };
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
          }));
          
          // Auto-remove success notifications after 5 seconds
          if (notification.type === 'success') {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, 5000);
          }
        },
        
        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id),
          }));
        },
        
        markNotificationRead: (id) => {
          set((state) => ({
            notifications: state.notifications.map(n => 
              n.id === id ? { ...n, read: true } : n
            ),
          }));
        },
        
        clearNotifications: () => {
          set({ notifications: [] });
        },
        
        // WebSocket Actions
        setWebsocketStatus: (status) => {
          set((state) => ({
            websocketStatus: {
              ...state.websocketStatus,
              ...status,
            },
          }));
        },
        
        // Data Fetching Actions
        fetchUsageMetrics: async (blockchain, timeframe) => {
          try {
            set({ loading: true, error: null });
            
            const response = await fetch(
              `/api/v2/blockchain/usage-metrics?blockchain=${blockchain}&timeframe=${timeframe}`
            );
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            get().setUsageMetrics(data);
            
            // Add success notification
            get().addNotification({
              type: 'success',
              title: 'Data Updated',
              message: 'Usage metrics updated successfully',
            });
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch usage metrics';
            set({ error: errorMessage, loading: false });
            
            // Add error notification
            get().addNotification({
              type: 'error',
              title: 'Fetch Error',
              message: errorMessage,
            });
            
            throw error;
          } finally {
            set({ loading: false });
          }
        },
        
        fetchCashflowMetrics: async (blockchain, timeframe) => {
          try {
            set({ loading: true, error: null });
            
            const response = await fetch(
              `/api/v2/blockchain/cashflow-metrics?blockchain=${blockchain}&timeframe=${timeframe}`
            );
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            get().setCashflowMetrics(data);
            
            // Add success notification
            get().addNotification({
              type: 'success',
              title: 'Data Updated',
              message: 'Cashflow metrics updated successfully',
            });
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cashflow metrics';
            set({ error: errorMessage, loading: false });
            
            // Add error notification
            get().addNotification({
              type: 'error',
              title: 'Fetch Error',
              message: errorMessage,
            });
            
            throw error;
          } finally {
            set({ loading: false });
          }
        },
        
        fetchMarketOverview: async (blockchain) => {
          try {
            set({ loading: true, error: null });
            
            const response = await fetch(
              `/api/v2/blockchain/market-overview?blockchain=${blockchain}`
            );
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            get().setMarketOverview(data);
            
            // Add success notification
            get().addNotification({
              type: 'success',
              title: 'Data Updated',
              message: 'Market overview updated successfully',
            });
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch market overview';
            set({ error: errorMessage, loading: false });
            
            // Add error notification
            get().addNotification({
              type: 'error',
              title: 'Fetch Error',
              message: errorMessage,
            });
            
            throw error;
          } finally {
            set({ loading: false });
          }
        },
        
        fetchAIAnalysis: async (blockchain) => {
          try {
            set({ loading: true, error: null });
            
            const response = await fetch(
              `/api/v2/blockchain/ai-analysis?blockchain=${blockchain}`
            );
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            get().setAIAnalysis(data);
            
            // Add success notification
            get().addNotification({
              type: 'success',
              title: 'Data Updated',
              message: 'AI analysis updated successfully',
            });
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch AI analysis';
            set({ error: errorMessage, loading: false });
            
            // Add error notification
            get().addNotification({
              type: 'error',
              title: 'Fetch Error',
              message: errorMessage,
            });
            
            throw error;
          } finally {
            set({ loading: false });
          }
        },
        
        fetchHistoricalData: async (blockchain, metric, timeframe) => {
          try {
            set({ loading: true, error: null });
            
            const response = await fetch(
              `/api/v2/blockchain/historical?blockchain=${blockchain}&metric=${metric}&timeframe=${timeframe}`
            );
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const key = `${blockchain}-${metric}-${timeframe}`;
            get().setHistoricalData(key, data);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch historical data';
            set({ error: errorMessage, loading: false });
            throw error;
          } finally {
            set({ loading: false });
          }
        },
        
        // Bulk Actions
        fetchAllData: async (blockchain, timeframe) => {
          const { fetchUsageMetrics, fetchCashflowMetrics, fetchMarketOverview, fetchAIAnalysis } = get();
          
          set({ loading: true, error: null });
          
          try {
            await Promise.all([
              fetchUsageMetrics(blockchain, timeframe),
              fetchCashflowMetrics(blockchain, timeframe),
              fetchMarketOverview(blockchain),
              fetchAIAnalysis(blockchain),
            ]);
            
            // Add success notification
            get().addNotification({
              type: 'success',
              title: 'Data Refreshed',
              message: 'All dashboard data refreshed successfully',
            });
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
            set({ error: errorMessage, loading: false });
            
            // Add error notification
            get().addNotification({
              type: 'error',
              title: 'Refresh Error',
              message: errorMessage,
            });
            
            throw error;
          } finally {
            set({ loading: false });
          }
        },
        
        refreshData: async () => {
          const { selectedBlockchain, selectedTimeframe, fetchAllData } = get();
          await fetchAllData(selectedBlockchain, selectedTimeframe);
        },
        
        clearData: () => {
          set({
            usageMetrics: null,
            tvlMetrics: null,
            enhancedTvlMetrics: null,
            cashflowMetrics: null,
            marketOverview: null,
            aiAnalysis: null,
            historicalData: {},
            error: null,
          });
        },
        
        // Utility Actions
        updateMetricValue: (metricType, metricKey, value) => {
          set((state) => {
            const newState = { ...state };
            
            switch (metricType) {
              case 'usage':
                if (newState.usageMetrics) {
                  newState.usageMetrics = {
                    ...newState.usageMetrics,
                    [metricKey]: value,
                  };
                }
                break;
              case 'tvl':
                if (newState.tvlMetrics) {
                  newState.tvlMetrics = {
                    ...newState.tvlMetrics,
                    [metricKey]: value,
                  };
                }
                break;
              case 'cashflow':
                if (newState.cashflowMetrics) {
                  newState.cashflowMetrics = {
                    ...newState.cashflowMetrics,
                    [metricKey]: value,
                  };
                }
                break;
              case 'market':
                if (newState.marketOverview) {
                  newState.marketOverview = {
                    ...newState.marketOverview,
                    [metricKey]: value,
                  };
                }
                break;
              case 'ai':
                if (newState.aiAnalysis) {
                  newState.aiAnalysis = {
                    ...newState.aiAnalysis,
                    [metricKey]: value,
                  };
                }
                break;
            }
            
            return newState;
          });
        },
        
        getMetricValue: (metricType, metricKey) => {
          const state = get();
          
          switch (metricType) {
            case 'usage':
              return state.usageMetrics?.[metricKey as keyof UsageMetrics];
            case 'tvl':
              return state.tvlMetrics?.[metricKey as keyof TVLMetrics];
            case 'cashflow':
              return state.cashflowMetrics?.[metricKey as keyof CashflowMetrics];
            case 'market':
              return state.marketOverview?.[metricKey as keyof MarketOverview];
            case 'ai':
              return state.aiAnalysis?.[metricKey as keyof AIAnalysis];
            default:
              return null;
          }
        },
      }),
      {
        name: 'blockchain-storage',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          selectedBlockchain: state.selectedBlockchain,
          selectedTimeframe: state.selectedTimeframe,
        }),
      }
    ),
    {
      name: 'blockchain-store',
    }
  )
);

// Selectors for better performance
export const selectUsageMetrics = (state: BlockchainState) => state.usageMetrics;
export const selectCashflowMetrics = (state: BlockchainState) => state.cashflowMetrics;
export const selectMarketOverview = (state: BlockchainState) => state.marketOverview;
export const selectAIAnalysis = (state: BlockchainState) => state.aiAnalysis;
export const selectLoading = (state: BlockchainState) => state.loading;
export const selectError = (state: BlockchainState) => state.error;
export const selectNotifications = (state: BlockchainState) => state.notifications;
export const selectWebsocketStatus = (state: BlockchainState) => state.websocketStatus;

// Hooks for common use cases
export const useBlockchainData = (blockchain: BlockchainValue, timeframe: TimeframeValue) => {
  const store = useBlockchainStore();
  
  return {
    usageMetrics: store.usageMetrics,
    cashflowMetrics: store.cashflowMetrics,
    marketOverview: store.marketOverview,
    aiAnalysis: store.aiAnalysis,
    loading: store.loading,
    error: store.error,
    refresh: store.refreshData,
    fetchAll: () => store.fetchAllData(blockchain, timeframe),
  };
};

export const useNotifications = () => {
  const store = useBlockchainStore();
  
  return {
    notifications: store.notifications,
    unreadCount: store.notifications.filter(n => !n.read).length,
    addNotification: store.addNotification,
    removeNotification: store.removeNotification,
    markNotificationRead: store.markNotificationRead,
    clearNotifications: store.clearNotifications,
  };
};

export const useWebSocket = () => {
  const store = useBlockchainStore();
  
  return {
    status: store.websocketStatus,
    setStatus: store.setWebsocketStatus,
    isConnected: store.websocketStatus.connected,
  };
};

export default useBlockchainStore;