// System Constants for CryptoTrend Dashboard
// Enterprise-grade blockchain analytics platform constants

// Blockchain Configuration
export const BLOCKCHAINS = [
  {
    value: 'bitcoin' as const,
    label: 'Bitcoin',
    symbol: 'BTC',
    description: 'The original cryptocurrency and digital gold',
    category: 'Layer 1',
    marketCapRank: 1,
    isActive: true,
    hasSmartContracts: false,
    consensus: 'Proof of Work'
  },
  {
    value: 'ethereum' as const,
    label: 'Ethereum',
    symbol: 'ETH',
    description: 'Smart contract platform and decentralized applications',
    category: 'Layer 1',
    marketCapRank: 2,
    isActive: true,
    hasSmartContracts: true,
    consensus: 'Proof of Stake'
  },
  {
    value: 'solana' as const,
    label: 'Solana',
    symbol: 'SOL',
    description: 'High-performance blockchain supporting fast transactions',
    category: 'Layer 1',
    marketCapRank: 5,
    isActive: true,
    hasSmartContracts: true,
    consensus: 'Proof of Stake'
  },
  {
    value: 'binance-smart-chain' as const,
    label: 'BNB Smart Chain',
    symbol: 'BNB',
    description: 'EVM-compatible blockchain with low fees',
    category: 'Layer 1',
    marketCapRank: 4,
    isActive: true,
    hasSmartContracts: true,
    consensus: 'Proof of Stake Authority'
  },
  {
    value: 'polygon' as const,
    label: 'Polygon',
    symbol: 'MATIC',
    description: 'Layer 2 scaling solution for Ethereum',
    category: 'Layer 2',
    marketCapRank: 10,
    isActive: true,
    hasSmartContracts: true,
    consensus: 'Proof of Stake'
  },
  {
    value: 'avalanche' as const,
    label: 'Avalanche',
    symbol: 'AVAX',
    description: 'High-throughput smart contract platform',
    category: 'Layer 1',
    marketCapRank: 12,
    isActive: true,
    hasSmartContracts: true,
    consensus: 'Proof of Stake'
  },
  {
    value: 'cardano' as const,
    label: 'Cardano',
    symbol: 'ADA',
    description: 'Research-driven smart contract platform',
    category: 'Layer 1',
    marketCapRank: 8,
    isActive: true,
    hasSmartContracts: true,
    consensus: 'Proof of Stake'
  },
  {
    value: 'polkadot' as const,
    label: 'Polkadot',
    symbol: 'DOT',
    description: 'Multi-chain interoperability protocol',
    category: 'Layer 0',
    marketCapRank: 15,
    isActive: true,
    hasSmartContracts: true,
    consensus: 'Nominated Proof of Stake'
  }
] as const;

// Timeframe Configuration
export const TIMEFRAMES = [
  {
    value: '1h' as const,
    label: '1 Hour',
    minutes: 60,
    description: 'Last 60 minutes of data',
    granularity: '1m',
    dataPoints: 60
  },
  {
    value: '24h' as const,
    label: '24 Hours',
    minutes: 1440,
    description: 'Last 24 hours of data',
    granularity: '5m',
    dataPoints: 288
  },
  {
    value: '7d' as const,
    label: '7 Days',
    minutes: 10080,
    description: 'Last 7 days of data',
    granularity: '1h',
    dataPoints: 168
  },
  {
    value: '30d' as const,
    label: '30 Days',
    minutes: 43200,
    description: 'Last 30 days of data',
    granularity: '4h',
    dataPoints: 180
  },
  {
    value: '90d' as const,
    label: '90 Days',
    minutes: 129600,
    description: 'Last 90 days of data',
    granularity: '12h',
    dataPoints: 180
  }
] as const;

// UI Design Constants
export const COLORS = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },
  
  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  
  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },
  
  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b'
  }
} as const;

// Typography Constants
export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace']
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem'
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
} as const;

// Chart Configuration
export const CHART_CONFIG = {
  colors: {
    primary: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    neutral: '#6b7280'
  },
  defaults: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  }
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  maxConnections: 10,
  connectionTimeout: 30000,
  queryTimeout: 10000
} as const;

// AI Configuration
export const AI_CONFIG = {
  models: {
    confidenceThreshold: 0.7,
    riskThreshold: 0.6,
    retrainingThreshold: 0.8
  },
  processing: {
    timeout: 60000,
    maxMemoryUsage: 512 * 1024 * 1024, // 512MB
    enableGPU: false,
    parallelProcessing: true
  }
} as const;

// Export types for TypeScript
export type BlockchainValue = typeof BLOCKCHAINS[number]['value'];
export type TimeframeValue = typeof TIMEFRAMES[number]['value'];

// Export utility functions
export const getBlockchainByValue = (value: string) => 
  BLOCKCHAINS.find(b => b.value === value);

export const getTimeframeByValue = (value: string) => 
  TIMEFRAMES.find(t => t.value === value);

export const formatBlockchainLabel = (value: string) => 
  getBlockchainByValue(value)?.label || value;

export const formatTimeframeLabel = (value: string) => 
  getTimeframeByValue(value)?.label || value;

// Default values
export const DEFAULT_BLOCKCHAIN: BlockchainValue = 'bitcoin';
export const DEFAULT_TIMEFRAME: TimeframeValue = '24h';

// System metadata
export const SYSTEM_INFO = {
  name: 'CryptoTrend',
  version: '1.0.0',
  description: 'Enterprise-grade blockchain analytics platform',
  author: 'CryptoTrend Team',
  license: 'MIT'
} as const;